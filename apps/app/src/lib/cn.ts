// Concatène des classNames en ignorant les valeurs falsy.
export function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(' ');
}
