type Ambiente = Record<string, string | undefined>;

// A Vercel informa a porta em PORT; no Docker local, o compose usa
// BACKEND_PORT (seção 7.11 do CLAUDE.md).
export function portaDoServidor(env: Ambiente): number {
  return Number(env.PORT ?? env.BACKEND_PORT ?? 3000);
}

const ORIGEM_PADRAO = 'http://localhost:5173';

// "https://agenda-pessoal-*-lucas.vercel.app" → o "*" vale um trecho de
// letras, números e hífens (nunca um ponto, então não dá pra encaixar
// outro domínio no meio), com a expressão ancorada no início e no fim.
function paraExpressao(padrao: string): RegExp {
  const partes = padrao.split('*').map((parte) => parte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`^${partes.join('[a-z0-9-]+')}$`);
}

// FRONTEND_URL aceita várias origens separadas por vírgula, e "*" para as
// URLs de preview da Vercel (cada deploy de branch/PR ganha uma URL própria).
export function origemPermitida(origem: string, env: Ambiente): boolean {
  const configuradas = (env.FRONTEND_URL ?? ORIGEM_PADRAO)
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return configuradas.some((padrao) =>
    padrao.includes('*') ? paraExpressao(padrao).test(origem) : padrao === origem,
  );
}
