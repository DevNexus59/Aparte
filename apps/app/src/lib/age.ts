// Même règle que côté backend (User.getAge) — gère le 29 février correctement.
export function getAge(isoBirthdate: string, now = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoBirthdate)) return null;
  const dob = new Date(isoBirthdate);
  if (Number.isNaN(dob.getTime())) return null;
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export function isAdult(isoBirthdate: string): boolean {
  const age = getAge(isoBirthdate);
  return age !== null && age >= 18;
}
