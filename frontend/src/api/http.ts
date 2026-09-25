// Cliente fininho sobre `fetch` compartilhado por todas as chamadas ao
// backend (authApi, atividadesApi, alocacoesApi) — nenhuma lib nova (`axios`
// etc.), ver CLAUDE.md seção 7.9.

// Carrega o status HTTP junto com a mensagem para quem chama poder reagir a
// casos específicos — ex.: 401 (token expirado/inválido) desloga o usuário.
export class ErroHttp extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ErroHttp';
    this.status = status;
  }
}

export interface OpcoesRequisicao {
  metodo?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  corpo?: unknown;
  // Rotas de Atividade/Alocação exigem `Authorization: Bearer <token>`
  // (CLAUDE.md, seção 7.3); as de autenticação não.
  accessToken?: string;
}

// Corpo de erro padrão do NestJS (ValidationPipe/HttpException): `message`
// pode ser uma string única ou uma lista (várias regras de validação
// falhando ao mesmo tempo).
interface CorpoDeErro {
  message?: string | string[];
}

async function extrairMensagemDeErro(response: Response): Promise<string> {
  const corpo = (await response.json().catch(() => null)) as CorpoDeErro | null;
  const mensagem = corpo?.message;

  if (Array.isArray(mensagem)) return mensagem.join(', ');
  if (typeof mensagem === 'string') return mensagem;
  return 'Não foi possível completar a solicitação. Tente novamente.';
}

export async function requisitar<TResposta>(
  caminho: string,
  { metodo = 'GET', corpo, accessToken }: OpcoesRequisicao = {},
): Promise<TResposta> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL}${caminho}`, {
    method: metodo,
    headers,
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });

  if (!response.ok) {
    throw new ErroHttp(await extrairMensagemDeErro(response), response.status);
  }

  // DELETE devolve 204 sem corpo — `response.json()` falharia.
  if (response.status === 204) {
    return undefined as TResposta;
  }

  return response.json() as Promise<TResposta>;
}
