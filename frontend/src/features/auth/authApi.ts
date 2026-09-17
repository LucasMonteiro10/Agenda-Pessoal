export interface CredenciaisLogin {
  email: string
  senha: string
}

export interface DadosCadastro extends CredenciaisLogin {
  nomeCompleto: string
}

// Corpo de erro padrão do NestJS (ValidationPipe/HttpException): `message`
// pode ser uma string única ou uma lista (várias regras de validação
// falhando ao mesmo tempo).
interface CorpoDeErro {
  message?: string | string[]
}

async function extrairMensagemDeErro(response: Response): Promise<string> {
  const corpo = (await response.json().catch(() => null)) as CorpoDeErro | null
  const mensagem = corpo?.message

  if (Array.isArray(mensagem)) return mensagem.join(', ')
  if (typeof mensagem === 'string') return mensagem
  return 'Não foi possível completar a solicitação. Tente novamente.'
}

async function requisitar<TResposta>(caminho: string, corpo: unknown): Promise<TResposta> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}${caminho}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  })

  if (!response.ok) {
    throw new Error(await extrairMensagemDeErro(response))
  }

  return response.json() as Promise<TResposta>
}

export function cadastrar(dados: DadosCadastro): Promise<{ id: string; nomeCompleto: string; email: string }> {
  return requisitar('/auth/registrar', dados)
}

export function login(credenciais: CredenciaisLogin): Promise<{ accessToken: string }> {
  return requisitar('/auth/login', credenciais)
}
