import { Text as RNText, TextProps } from 'react-native';
import { cn } from '@/lib/cn';

type Variant =
  | 'caption' | 'body' | 'body-l'
  | 'title'   | 'display' | 'hero'
  | 'editorial-title' | 'editorial-display' | 'editorial-hero'
  | 'mono';
type Tone = 'default' | 'muted' | 'faded' | 'accent';

interface Props extends TextProps {
  variant?: Variant;
  tone?: Tone;
  italic?: boolean;
  className?: string;
}

// Mapping centralisé : chaque variant choisit famille, taille, ligne.
// Les variantes "editorial-*" passent en serif Newsreader light pour
// les moments importants (titres de rituel, libellés de lueur).
const VARIANT_CLASS: Record<Variant, string> = {
  caption:           'font-regular text-caption',
  body:              'font-regular text-body',
  'body-l':          'font-regular text-body-l',
  title:             'font-semibold text-title',
  display:           'font-semibold text-display',
  hero:              'font-semibold text-hero',
  'editorial-title': 'font-editorial-light text-title',
  'editorial-display': 'font-editorial-light text-display',
  'editorial-hero':  'font-editorial-light text-hero',
  mono:              'font-mono text-caption',
};

const TONE_CLASS: Record<Tone, string> = {
  default: 'text-text',
  muted:   'text-text-muted',
  faded:   'text-text-faded',
  accent:  'text-accent',
};

export function Text({
  variant = 'body',
  tone = 'default',
  italic,
  className,
  style,
  children,
  ...rest
}: Props) {
  // L'italique fonctionne uniquement avec la famille editorial-italic.
  const fontOverride = italic ? 'font-editorial-italic' : undefined;
  return (
    <RNText
      className={cn(VARIANT_CLASS[variant], TONE_CLASS[tone], fontOverride, className)}
      style={style}
      {...rest}
    >
      {children}
    </RNText>
  );
}
