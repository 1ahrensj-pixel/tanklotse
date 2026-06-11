/**
 * Rundet Koordinaten auf 3 Nachkommastellen (~111 m).
 * Damit können Nutzer in derselben Gegend denselben Cache-Eintrag treffen,
 * ohne dass präzise Standorte serverseitig protokolliert werden.
 */
export function roundCoord(value: number): string {
  return value.toFixed(3);
}
