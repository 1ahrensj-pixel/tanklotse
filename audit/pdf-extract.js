const fs = require('fs');
const zlib = require('zlib');
const buf = fs.readFileSync(process.argv[2]);
let out = [];

// 1) Unkomprimierte (...)-Textfragmente
const latin = buf.toString('latin1');
const direct = latin.match(/\(([^()\\]{2,})\)/g) || [];
out.push(...direct.map((m) => m.slice(1, -1)));

// 2) FlateDecode-Streams entpacken und Text ziehen
const re = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
let m;
while ((m = re.exec(latin)) !== null) {
  try {
    const raw = Buffer.from(m[1], 'latin1');
    const inflated = zlib.inflateSync(raw).toString('latin1');
    const frags = inflated.match(/\(([^()\\]{2,})\)/g) || [];
    out.push(...frags.map((f) => f.slice(1, -1)));
    // Tj/TJ-Arrays
    const tj = inflated.match(/\[([^\]]*)\]\s*TJ/g) || [];
    for (const t of tj) {
      const parts = t.match(/\(([^()\\]*)\)/g) || [];
      out.push(parts.map((p) => p.slice(1, -1)).join(''));
    }
  } catch {}
}

const text = out.join(' ').replace(/\s+/g, ' ');
console.log(text.slice(0, 4000));
