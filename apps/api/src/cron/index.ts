import { AppDataSource } from '../config/data-source';
import { Repositories } from '../repositories';
import { Services } from '../services';
import { EmotionalState } from '../entities/EmotionalState';
import { User } from '../entities/User';
import { CronLock } from '../entities/CronLock';
import { LessThan, IsNull } from 'typeorm';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// I9 : verrou applicatif par job. En multi-instance, une seule instance
// gagne le lock par fenêtre.
//
// Logique :
//   1. SELECT : le lock existe-t-il déjà ?
//   2a. Non    -> INSERT (avec catch silencieux si une autre instance gagne entre-temps)
//   2b. Oui    -> est-il expiré ? Non -> abandon. Oui -> UPDATE conditionnel (compare-and-swap)
//
// On évite ainsi d'utiliser l'exception "duplicate key" comme contrôle de flow.
async function tryAcquireLock(jobName: string, ttlMs: number): Promise<boolean> {
  const repo = AppDataSource.getRepository(CronLock);
  const now = new Date();

  const existing = await repo.findOne({ where: { jobName } });

  if (!existing) {
    // Pas de lock encore. On tente l'INSERT. Une autre instance peut avoir
    // gagné entre-temps (race) -> on catche, mais c'est désormais un cas
    // rare, pas le cas normal.
    try {
      await repo.insert({ jobName, acquiredAt: now });
      return true;
    } catch {
      return false;
    }
  }

  // Lock existant : encore actif ?
  const elapsed = now.getTime() - existing.acquiredAt.getTime();
  if (elapsed < ttlMs) return false;

  // Lock périmé : on tente de le reprendre atomiquement via compare-and-swap.
  // Si une autre instance l'a déjà repris (acquiredAt a changé), affected = 0.
  const result = await repo
    .createQueryBuilder()
    .update(CronLock)
    .set({ acquiredAt: now })
    .where('job_name = :job AND acquired_at = :prev', {
      job: jobName, prev: existing.acquiredAt,
    })
    .execute();
  return (result.affected ?? 0) > 0;
}

export function startCronJobs(repos: Repositories, services: Services): void {
  // --- Purges quotidiennes ---
  const runDaily = async () => {
    if (!(await tryAcquireLock('daily', 23 * HOUR))) return;
    try {
      const tokens = await repos.refreshTokens.cleanupExpired(7);
      if (tokens > 0) console.log(`[cron] purge ${tokens} refresh tokens expirés`);

      const before = new Date(Date.now() - 30 * DAY);
      const result = await AppDataSource
        .getRepository(EmotionalState)
        .delete({ expiresAt: LessThan(before) });
      if (result.affected) console.log(`[cron] purge ${result.affected} états expirés`);
    } catch (e) {
      console.error('[cron] daily failed:', e);
    }
  };

  // --- Question hebdomadaire poussée à tout le monde ---
  // Garde-fou : lundi 9-11h UTC. TTL 23h pour ne pas re-déclencher dans la même fenêtre.
  const runWeeklyPush = async () => {
    const now = new Date();
    if (now.getUTCDay() !== 1) return;
    const hour = now.getUTCHours();
    if (hour < 9 || hour > 11) return;

    if (!(await tryAcquireLock('weekly_push', 23 * HOUR))) return;

    try {
      const prompt = await services.heartbeat.getCurrentWeeklyPrompt();
      if (!prompt) return;

      const activeUsers = await AppDataSource.getRepository(User).find({
        where: { status: 'active', deletedAt: IsNull() },
        select: ['id'],
      });
      const userIds = activeUsers.map((u) => u.id);
      if (userIds.length === 0) return;

      await services.push.send({
        userIds,
        title: 'Cette semaine',
        body: prompt.text,
        data: { type: 'weekly_prompt', promptId: prompt.id },
      });
      console.log(`[cron] question hebdo poussée à ${userIds.length} users`);
    } catch (e) {
      console.error('[cron] weekly push failed:', e);
    }
  };

  setTimeout(runDaily, 60_000).unref();
  setInterval(runDaily, DAY).unref();

  setTimeout(runWeeklyPush, 2 * 60_000).unref();
  setInterval(runWeeklyPush, HOUR).unref();
}
