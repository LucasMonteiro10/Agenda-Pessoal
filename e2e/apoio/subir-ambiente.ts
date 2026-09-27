import { execSync } from 'node:child_process';
import { COMANDO_COMPOSE, URL_BACKEND, URL_FRONTEND } from './ambiente';

const TEMPO_MAXIMO_MS = 180_000;

// O `--wait` do Compose só garante que os containers estão de pé (o
// Postgres, com healthcheck, pronto de verdade). O backend ainda precisa
// compilar e o Vite ainda precisa subir — então esperamos os dois
// responderem por HTTP antes de liberar os testes.
async function aguardarResposta(url: string, respostaValida: (status: number) => boolean) {
  const limite = Date.now() + TEMPO_MAXIMO_MS;
  while (Date.now() < limite) {
    try {
      const resposta = await fetch(url);
      if (respostaValida(resposta.status)) return;
    } catch {
      // Ainda não está aceitando conexões.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`${url} não respondeu em ${TEMPO_MAXIMO_MS / 1000}s`);
}

export default async function subirAmbiente() {
  execSync(`${COMANDO_COMPOSE} up -d --build --wait`, { stdio: 'inherit' });

  // Sem token, /atividades responde 401 — o que já prova que a API está no
  // ar (5xx ou conexão recusada, não).
  await aguardarResposta(`${URL_BACKEND}/atividades`, (status) => status < 500);
  await aguardarResposta(URL_FRONTEND, (status) => status === 200);
}
