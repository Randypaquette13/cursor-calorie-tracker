/** Build candidate barcode strings to try against Open Food Facts. */
export function barcodeLookupCandidates(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const candidates = new Set<string>([trimmed]);
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length > 0) {
    candidates.add(digitsOnly);

    if (digitsOnly.length === 12) {
      candidates.add(`0${digitsOnly}`);
    }

    if (digitsOnly.length === 13 && digitsOnly.startsWith('0')) {
      candidates.add(digitsOnly.slice(1));
    }
  }

  return [...candidates];
}
