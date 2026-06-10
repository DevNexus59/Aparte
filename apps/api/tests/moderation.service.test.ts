import { describe, it, expect, vi } from 'vitest';
import { ModerationService } from '../src/services/ModerationService';
import { Classifier, ClassificationResult } from '../src/lib/moderation';

function fakeRepos() {
  return {
    audit: { record: vi.fn() },
    modFlags: { record: vi.fn() },
    reports: {},
  } as never;
}

function fakeClassifier(scores: number[]): Classifier {
  let i = 0;
  return {
    name: 'fake',
    async classifyImage(): Promise<ClassificationResult> {
      const score = scores[i++ % scores.length];
      return { classifier: 'fake', score, flagged: score >= 0.85 };
    },
    async classifyText(): Promise<ClassificationResult> {
      const score = scores[i++ % scores.length];
      return { classifier: 'fake', score, flagged: score >= 0.85 };
    },
  };
}

describe('ModerationService.handleResults', () => {
  it('laisse passer si score < FLAG_THRESHOLD', async () => {
    const repos = fakeRepos();
    const svc = new ModerationService(repos, [fakeClassifier([0.2])]);
    const ok = await svc.screenImage({
      userId: 'u1', buffer: Buffer.from([]), mime: 'image/jpeg', contentType: 'profile_photo',
    });
    expect(ok).toBe(true);
    expect(repos.modFlags.record).not.toHaveBeenCalled();
  });

  it('enregistre un flag à revue humaine si FLAG ≤ score < AUTO_ACTION, laisse passer', async () => {
    const repos = fakeRepos();
    const svc = new ModerationService(repos, [fakeClassifier([0.9])]);
    const ok = await svc.screenImage({
      userId: 'u1', buffer: Buffer.from([]), mime: 'image/jpeg', contentType: 'profile_photo',
    });
    expect(ok).toBe(true);
    expect(repos.modFlags.record).toHaveBeenCalledTimes(1);
    expect((repos.modFlags.record as ReturnType<typeof vi.fn>).mock.calls[0][0].autoActioned).toBe(false);
  });

  it('bloque et enregistre auto_actioned si score ≥ AUTO_ACTION', async () => {
    const repos = fakeRepos();
    const svc = new ModerationService(repos, [fakeClassifier([0.97])]);
    const ok = await svc.screenImage({
      userId: 'u1', buffer: Buffer.from([]), mime: 'image/jpeg', contentType: 'profile_photo',
    });
    expect(ok).toBe(false);
    expect((repos.modFlags.record as ReturnType<typeof vi.fn>).mock.calls[0][0].autoActioned).toBe(true);
  });

  it('survit à un classifier qui throw (fail-open par classifier)', async () => {
    const repos = fakeRepos();
    const broken: Classifier = {
      name: 'broken',
      async classifyImage() { throw new Error('down'); },
    };
    const svc = new ModerationService(repos, [broken]);
    const ok = await svc.screenImage({
      userId: 'u1', buffer: Buffer.from([]), mime: 'image/jpeg', contentType: 'profile_photo',
    });
    expect(ok).toBe(true); // pas de résultat -> pas de blocage
  });
});
