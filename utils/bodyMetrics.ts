export function feetInchesToCm(feet: number, inches: number) {
  const totalInches = feet * 12 + inches;
  return totalInches * 2.54;
}

export function cmToFeetInches(cm: number) {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return { feet, inches: inches === 12 ? 0 : inches, adjustedFeet: inches === 12 ? feet + 1 : feet };
}

export function lbsToKg(lbs: number) {
  return lbs / 2.20462;
}

export function kgToLbs(kg: number) {
  return kg * 2.20462;
}

export function formatHeightCm(cm: number | null) {
  if (cm == null || cm <= 0) return 'Not set';
  const { adjustedFeet, inches } = cmToFeetInches(cm);
  return `${adjustedFeet}'${inches}"`;
}

export function formatWeightKg(kg: number | null) {
  if (kg == null || kg <= 0) return 'Not set';
  return `${Math.round(kgToLbs(kg))} lb`;
}
