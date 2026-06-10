import { describe, it, expect, vi } from 'vitest';
import { uploadWithAuthRetry } from './upload';
import { ApiError } from './errors';

describe('uploadWithAuthRetry', () => {
  it('retourne le résultat si la première tentative réussit', async () => {
    const request = vi.fn(async (token: string | null) => ({ key: `ok-${token}` }));
    const refresh = vi.fn();

    const result = await uploadWithAuthRetry(request, () => 'token-1', refresh);

    expect(result).toEqual({ key: 'ok-token-1' });
    expect(request).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('rafraîchit le token et rejoue une fois en cas de 401', async () => {
    const request = vi.fn(async (token: string | null) => {
      if (token === 'expired') throw new ApiError(401, 'Unauthorized');
      return { key: `ok-${token}` };
    });
    const refresh = vi.fn(async () => 'fresh-token');

    const result = await uploadWithAuthRetry(request, () => 'expired', refresh);

    expect(result).toEqual({ key: 'ok-fresh-token' });
    expect(request).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('propage les erreurs non-401 sans rafraîchir', async () => {
    const request = vi.fn(async () => { throw new ApiError(400, 'Aucun fichier fourni'); });
    const refresh = vi.fn();

    await expect(uploadWithAuthRetry(request, () => 'token', refresh)).rejects.toThrow('Aucun fichier fourni');
    expect(refresh).not.toHaveBeenCalled();
    expect(request).toHaveBeenCalledTimes(1);
  });
});
