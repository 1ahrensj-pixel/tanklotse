#!/usr/bin/env bash
# Edge cases.
API="http://localhost:3000/api"
PASS="Audit-Strong-Password-2026!"

echo "=== Edge: Sehr lange Email lokaler Teil > 320 Zeichen ==="
LONG_LOCAL=$(printf 'a%.0s' {1..400})
curl -s -o /tmp/o.json -w "Status: %{http_code}\n" -X POST $API/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${LONG_LOCAL}@example.test\",\"password\":\"$PASS\"}"
head -c 200 /tmp/o.json; echo

echo
echo "=== Edge: Unicode Email (RFC valid mit umlauts) ==="
curl -s -o /tmp/o.json -w "Status: %{http_code}\n" -X POST $API/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"mueller@xn--mnchen-3ya.de\",\"password\":\"$PASS\"}"
head -c 200 /tmp/o.json; echo

echo
echo "=== Edge: Email mit Space ==="
curl -s -o /tmp/o.json -w "Status: %{http_code}\n" -X POST $API/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"a b@example.test\",\"password\":\"$PASS\"}"
head -c 200 /tmp/o.json; echo

echo
echo "=== Edge: Float overflow im Detour ==="
curl -s -o /tmp/o.json -w "Status: %{http_code}\n" -X POST $API/recommendations/detour-calculation \
  -H "Content-Type: application/json" \
  -d '{"comparisonPricePerLiter":9e308,"targetPricePerLiter":1.629,"detourKm":4.8,"consumptionLPer100Km":8,"tankLiters":50}'
head -c 200 /tmp/o.json; echo

echo
echo "=== Edge: Negative tankLiters ==="
curl -s -o /tmp/o.json -w "Status: %{http_code}\n" -X POST $API/recommendations/detour-calculation \
  -H "Content-Type: application/json" \
  -d '{"comparisonPricePerLiter":1.689,"targetPricePerLiter":1.629,"detourKm":4.8,"consumptionLPer100Km":8,"tankLiters":-50}'
head -c 200 /tmp/o.json; echo

echo
echo '=== Edge: NaN als Zahl ==='
curl -s -o /tmp/o.json -w "Status: %{http_code}\n" -X POST $API/recommendations/detour-calculation \
  -H "Content-Type: application/json" \
  -d '{"comparisonPricePerLiter":"NaN","targetPricePerLiter":1.629,"detourKm":4.8,"consumptionLPer100Km":8,"tankLiters":50}'
head -c 200 /tmp/o.json; echo

echo
echo "=== Edge: Polar latitude ==="
curl -s -o /tmp/o.json -w "Status: %{http_code}\n" "$API/stations/search?lat=89.9999&lng=179.9999&radius=5&fuelType=DIESEL"
head -c 200 /tmp/o.json; echo

echo
echo "=== Edge: HTTP-Methode falsch ==="
curl -s -o /tmp/o.json -w "Status: %{http_code}\n" -X DELETE $API/health
head -c 200 /tmp/o.json; echo

echo
echo "=== Edge: Falsches Content-Type ==="
curl -s -o /tmp/o.json -w "Status: %{http_code}\n" -X POST $API/auth/register \
  -H "Content-Type: text/plain" \
  -d 'email=test@example.test&password=abc'
head -c 200 /tmp/o.json; echo

echo
echo "=== Edge: Kaputtes JSON ==="
curl -s -o /tmp/o.json -w "Status: %{http_code}\n" -X POST $API/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.test", oops'
head -c 200 /tmp/o.json; echo

echo
echo "=== Edge: Riesiger JSON-Body (1 MB) ==="
BIG=$(printf 'a%.0s' {1..1000000})
echo -n "{\"email\":\"big@example.test\",\"password\":\"$PASS\",\"extra\":\"$BIG\"}" > /tmp/big.json
curl -s -o /tmp/o.json -w "Status: %{http_code}\n" -X POST $API/auth/register \
  -H "Content-Type: application/json" \
  --data @/tmp/big.json
head -c 200 /tmp/o.json; echo
rm -f /tmp/big.json
