import { requisitar } from '../../api/http.ts'

export interface CredenciaisLogin {
  email: string
  senha: string
}

export interface DadosCadastro extends CredenciaisLogin {
  nomeCompleto: string
}

export function cadastrar(dados: DadosCadastro): Promise<{ id: string; nomeCompleto: string; email: string }> {
  return requisitar('/auth/registrar', { metodo: 'POST', corpo: dados })
}

export function login(credenciais: CredenciaisLogin): Promise<{ accessToken: string }> {
  return requisitar('/auth/login', { metodo: 'POST', corpo: credenciais })
}
