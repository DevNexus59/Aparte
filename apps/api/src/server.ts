import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from './config/data-source';
import { initRepositories } from './repositories';
import { initServices, services } from './services';
import { startCronJobs } from './cron';
import { createApp } from './app';

const port = Number(process.env.PORT ?? 4000);

async function main() {
  await AppDataSource.initialize();
  console.log('[db] DataSource initialisé');

  const repos = initRepositories();
  initServices(repos, AppDataSource);

  startCronJobs(repos, services);

  createApp().listen(port, () => {
    console.log(`[http] Cercle API en écoute sur http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error('[boot] échec démarrage:', err);
  process.exit(1);
});
