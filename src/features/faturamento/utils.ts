// Usa slicing de string — não chama new Date(), não crasha com datetimes
export const safeFormatDate = (s: string | null | undefined): string | null => {
  if (!s) return null;
  const parts = s.slice(0, 10).split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
};
