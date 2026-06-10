import 'dotenv/config';
import 'reflect-metadata';
import http from 'node:http';
import { AppDataSource } from './config/data-source';
import { initRepositories } from './repositories';
import { initServices, services } from './services';
import { startCronJobs } from './cron';
import { createApp } from './app';
import { initRealtime } from './realtime';

const port = Number(process.env.PORT ?? 4000);

async function main() {
  await AppDataSource.initialize();
  console.log('[db] DataSource initialisé');

  const repos = initRepositories();
  initServices(repos, AppDataSource);

  startCronJobs(repos, services);

  const server = http.createServer(createApp());
  initRealtime(server);

  server.listen(port, () => {
    console.log(`[http] Cercle API en écoute sur http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error('[boot] échec démarrage:', err);
  process.exit(1);
});
