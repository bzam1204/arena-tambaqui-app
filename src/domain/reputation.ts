export function calculateReputation({
  elogios,
  denuncias,
}: {
  elogios: number;
  denuncias: number;
}): number {
  const base = 6;
  const delta = Math.floor(elogios / 5) - Math.floor(denuncias / 5);
  return clamp(base + delta, 0, 10);
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
