// Ported from the MIT-licensed `ireal-reader` package
// (github.com/pianosnake/ireal-reader, unscramble.js).
//
// iReal Pro scrambles chart payloads in 50-character segments: within each
// full segment, characters 0-4 are swapped with 45-49 and characters 10-23
// are swapped with 26-39. A trailing segment of 50 or fewer characters (or
// one that would leave fewer than 2 characters remaining) passes through
// unchanged.

export function descramble(rawChart: string): string {
  let result = "";
  let rest = rawChart;
  while (rest.length > 50) {
    const chunk = rest.slice(0, 50);
    rest = rest.slice(50);
    result += rest.length < 2 ? chunk : swapSegment(chunk);
  }
  return result + rest;
}

function swapSegment(chunk: string): string {
  const chars = chunk.split("");
  for (let i = 0; i < 5; i++) {
    chars[49 - i] = chunk[i];
    chars[i] = chunk[49 - i];
  }
  for (let i = 10; i < 24; i++) {
    chars[49 - i] = chunk[i];
    chars[i] = chunk[49 - i];
  }
  return chars.join("");
}
