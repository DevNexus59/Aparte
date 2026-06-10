import crypto from 'node:crypto';

// HIBP — API k-anonymous : on n'envoie que les 5 premiers caractères du SHA1.
// Le serveur HIBP ne sait jamais quel mot de passe est vérifié.
// Fail-open : si HIBP est indispo, on ne bloque pas l'inscription.

export async function isPasswordPwned(password: string, timeoutMs = 2000): Promise<boolean> {
  const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn('[hibp] http', res.status, '— fail-open');
      return false;
    }
    const text = await res.text();
    return text.split('\n').some((line) => line.startsWith(suffix));
  } catch (e) {
    console.warn('[hibp] api down — fail-open:', (e as Error).message);
    return false; // fail-open
  } finally {
    clearTimeout(timer);
  }
}
