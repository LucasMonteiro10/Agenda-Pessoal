import { execSync } from 'node:child_process';
import { COMANDO_COMPOSE } from './ambiente';

// Derruba o ambiente e apaga tudo o que os testes criaram. Com
// E2E_MANTER_AMBIENTE=1, deixa de pé — útil para rodar os testes várias
// vezes seguidas sem esperar o build de novo (`docker compose -f
// docker-compose.e2e.yml down -v` derruba depois, à mão).
export default async function derrubarAmbiente() {
  if (process.env.E2E_MANTER_AMBIENTE) return;
  execSync(`${COMANDO_COMPOSE} down -v --remove-orphans`, { stdio: 'inherit' });
}
