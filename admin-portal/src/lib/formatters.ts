export function formatBdt(amount: number): string {
  return `৳${Number(amount || 0).toLocaleString('en-US')}`;
}
