import { defineConfig, devices } from '@playwright/test';
import { URL_FRONTEND } from './apoio/ambiente';

// DEMO=1 (npm run test:demo): execução mais lenta e sempre gravada em
// vídeo, com um cursor visível — para apresentar o teste rodando. Fora
// disso, o teste roda na velocidade normal e só guarda vídeo/trace quando
// falha.
const demo = Boolean(process.env.DEMO);

export default defineConfig({
  testDir: './testes',
  // Sobe o ambiente descartável (docker-compose.e2e.yml) antes de tudo e o
  // derruba no fim — ver apoio/subir-ambiente.ts e apoio/derrubar-ambiente.ts.
  globalSetup: './apoio/subir-ambiente.ts',
  globalTeardown: './apoio/derrubar-ambiente.ts',
  timeout: demo ? 90_000 : 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: URL_FRONTEND,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: demo ? { mode: 'on', size: { width: 1280, height: 720 } } : 'retain-on-failure',
    launchOptions: { slowMo: demo ? 700 : 0 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
  ],
});
