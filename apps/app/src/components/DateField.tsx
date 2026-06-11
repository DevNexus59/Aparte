import { useEffect, useState } from 'react';
import { Input } from './Input';

interface Props {
  label?: string;
  value: string;        // ISO yyyy-mm-dd (ou '')
  onChangeIso: (iso: string) => void;
  error?: string;
}

// L'user ne tape QUE des chiffres. On insère les `/` automatiquement.
// State local pour gérer les états intermédiaires (ex: pendant qu'on tape "12",
// value ISO n'est pas encore valide donc on ne peut pas dériver l'affichage de lui).

function format(digits: string): string {
  const d = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const y = digits.slice(4, 8);
  if (digits.length <= 2) return d;
  if (digits.length <= 4) return `${d}/${m}`;
  return `${d}/${m}/${y}`;
}

function digitsToIso(digits: string): string {
  if (digits.length !== 8) return '';
  return `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
}

function isoToDigits(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-');
  return `${d}${m}${y}`;
}

export function DateField({ label, value, onChangeIso, error }: Props) {
  const [digits, setDigits] = useState<string>(() => isoToDigits(value));

  // Si value est modifiée depuis l'extérieur (reset, prefill), on resync.
  useEffect(() => {
    const fromIso = isoToDigits(value);
    if (fromIso !== digits && (value !== '' || digits === '')) {
      setDigits(fromIso);
    }
  }, [value, digits]);

  function handleChange(text: string) {
    const next = text.replace(/\D/g, '').slice(0, 8);
    setDigits(next);
    onChangeIso(digitsToIso(next));
  }

  return (
    <Input
      label={label}
      placeholder="jj/mm/aaaa"
      keyboardType="number-pad"
      value={format(digits)}
      onChangeText={handleChange}
      error={error}
      maxLength={10}
    />
  );
}
