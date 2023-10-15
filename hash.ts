

export function hashString(input: string): number {
  const firstAscii = input.charCodeAt(0) * 7;
  const length = input.length * 23;

  return (firstAscii * length) % Number.MAX_SAFE_INTEGER;
}
