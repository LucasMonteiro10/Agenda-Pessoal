import { type FormEvent, type ReactNode, useState } from 'react';
import * as authApi from './authApi.ts';

export interface TelaAutenticadaProps {
  autenticado: boolean;
  onAutenticado: (accessToken: string) => void;
  children: ReactNode;
}

type Modo = 'login' | 'cadastro';

// Sem biblioteca de rotas decidida ainda (CLAUDE.md, seção 7), este
// componente representa a alternância "cronograma" / "tela de login" a
// partir de uma flag, sem navegação de URL de fato. O botão "Deslogar" fica
// no header do cronograma (DeslogarButton, em App.tsx) — aqui só reagimos à
// troca da flag.
export function TelaAutenticada({ autenticado, onAutenticado, children }: TelaAutenticadaProps) {
  const [modo, setModo] = useState<Modo>('login');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (autenticado) {
    return <>{children}</>;
  }

  function alternarModo() {
    setModo((atual) => (atual === 'login' ? 'cadastro' : 'login'));
    setErro(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      if (modo === 'cadastro') {
        await authApi.cadastrar({ nomeCompleto, email, senha });
      }
      // Cadastro não retorna token — logamos em seguida com as mesmas
      // credenciais para já entrar direto no cronograma.
      const { accessToken } = await authApi.login({ email, senha });
      // Volta ao estado inicial da tela de login já ao entrar — este
      // componente continua montado enquanto autenticado, então sem isso,
      // deslogar (pelo botão ou por um 401) logo após um cadastro deixaria a
      // tela presa em "Criar conta".
      setModo('login');
      setNomeCompleto('');
      setEmail('');
      setSenha('');
      onAutenticado(accessToken);
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : 'Não foi possível completar a solicitação.');
    } finally {
      setEnviando(false);
    }
  }

  // Mesmo visual do cronograma (tokens de index.css, `.btn` e campos no
  // estilo dos formulários da agenda) — ver `.tela-login*` em App.css.
  return (
    <main className="tela-login">
      <section className="tela-login__card">
        <span className="app-header__eyebrow">Cronograma Pessoal</span>
        <h1>{modo === 'login' ? 'Login' : 'Criar conta'}</h1>
        <p className="tela-login__subtitulo">
          {modo === 'login'
            ? 'Entre para ver e organizar a sua semana recorrente.'
            : 'Crie sua conta para montar a sua semana recorrente.'}
        </p>

        <form className="tela-login__form" onSubmit={handleSubmit}>
          {modo === 'cadastro' && (
            <label className="tela-login__campo">
              Nome completo
              <input
                type="text"
                value={nomeCompleto}
                onChange={(event) => setNomeCompleto(event.target.value)}
                autoComplete="name"
                required
              />
            </label>
          )}

          <label className="tela-login__campo">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="tela-login__campo">
            Senha
            <input
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </label>

          {erro && (
            <p role="alert" className="app-erro">
              {erro}
            </p>
          )}

          <button type="submit" className="btn tela-login__enviar" disabled={enviando}>
            {modo === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <button type="button" className="tela-login__alternar" onClick={alternarModo}>
          {modo === 'login' ? 'Ainda não tenho conta' : 'Já tenho conta'}
        </button>
      </section>
    </main>
  );
}
