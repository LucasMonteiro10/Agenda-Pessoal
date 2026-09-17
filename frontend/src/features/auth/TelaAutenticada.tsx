import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import waterCssHref from 'water.css?url';
import * as authApi from './authApi.ts';

export interface TelaAutenticadaProps {
  autenticado: boolean;
  onAutenticado: (accessToken: string) => void;
  onDeslogar: () => void;
  children: ReactNode;
}

type Modo = 'login' | 'cadastro';

// water.css é "classless" — estiliza <body>/<input>/<button>/<table> etc.
// direto pela tag, documento inteiro. Só queremos esse visual na tela de
// login (o resto do app já tem seu próprio estilo em index.css/App.css),
// então o <link> é inserido/removido dinamicamente junto com a troca de
// `autenticado`, em vez de um `import` estático de main.tsx (que ficaria
// sempre ativo e recolocaria o cronograma inteiro também).
function useWaterCssEnquantoDeslogado(autenticado: boolean) {
  useEffect(() => {
    if (autenticado) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = waterCssHref;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [autenticado]);
}

// Sem biblioteca de rotas decidida ainda (CLAUDE.md, seção 7), este
// componente representa a alternância "cronograma" / "tela de login" a
// partir de uma flag, sem navegação de URL de fato.
export function TelaAutenticada({ autenticado, onAutenticado, onDeslogar, children }: TelaAutenticadaProps) {
  const [modo, setModo] = useState<Modo>('login');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useWaterCssEnquantoDeslogado(autenticado);

  function handleDeslogar() {
    // Volta ao estado inicial da tela de login — sem isso, deslogar logo
    // após um cadastro deixaria a tela presa em "Criar conta".
    setModo('login');
    setNomeCompleto('');
    setEmail('');
    setSenha('');
    setErro(null);
    onDeslogar();
  }

  if (autenticado) {
    return (
      <div>
        <button type="button" onClick={handleDeslogar}>
          Deslogar
        </button>
        {children}
      </div>
    );
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
      onAutenticado(accessToken);
    } catch (erroCapturado) {
      setErro(erroCapturado instanceof Error ? erroCapturado.message : 'Não foi possível completar a solicitação.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main>
      <h1>{modo === 'login' ? 'Login' : 'Criar conta'}</h1>

      <form onSubmit={handleSubmit}>
        {modo === 'cadastro' && (
          <label>
            Nome completo
            <input
              type="text"
              value={nomeCompleto}
              onChange={(event) => setNomeCompleto(event.target.value)}
              required
            />
          </label>
        )}

        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>

        <label>
          Senha
          <input type="password" value={senha} onChange={(event) => setSenha(event.target.value)} required />
        </label>

        {erro && <p role="alert">{erro}</p>}

        <button type="submit" disabled={enviando}>
          {modo === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>

      <button type="button" onClick={alternarModo}>
        {modo === 'login' ? 'Ainda não tenho conta' : 'Já tenho conta'}
      </button>
    </main>
  );
}
