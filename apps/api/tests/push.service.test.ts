import { describe, it, expect, vi } from 'vitest';
import { PushService } from '../src/services/PushService';

function fakeRepos() {
  return {
    pushDevices: {
      dropTokenForUser: vi.fn(async () => undefined),
    },
  } as never;
}

describe('PushService.dropDeviceByToken', () => {
  it("ne supprime que les devices appartenant à l'utilisateur courant", async () => {
    const repos = fakeRepos();
    const svc = new PushService(repos);

    await svc.dropDeviceByToken('user-1', 'ExponentPushToken[abc]');

    expect((repos as any).pushDevices.dropTokenForUser).toHaveBeenCalledWith(
      'user-1',
      'ExponentPushToken[abc]',
    );
    expect((repos as any).pushDevices.dropTokenForUser).toHaveBeenCalledTimes(1);
  });
});
