import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as authApi from './authApi.ts';
import { TelaAutenticada } from './TelaAutenticada.tsx';

// authApi fala com o backend de verdade (fetch) — aqui mockamos, os
// cenários e2e de backend/test/autenticacao.e2e-spec.ts já cobrem a API.
vi.mock('./authApi.ts');

// Cenários Gherkin: docs/requisitos.md, Feature "Autenticação". Sem uma
// biblioteca de rotas decidida ainda, este componente representa a
// alternância entre "cronograma" e "tela de login" a partir de uma flag de
// autenticação — não faz navegação de URL de fato.
describe('TelaAutenticada', () => {
  beforeEach(() => {
    vi.mocked(authApi.login).mockReset();
    vi.mocked(authApi.cadastrar).mockReset();
  });

  it('autenticado mostra o cronograma, sem o formulário de login', () => {
    // O botão "Deslogar" fica no header do cronograma (DeslogarButton) — o
    // fluxo completo de deslogar é testado em App.test.tsx.
    render(
      <TelaAutenticada autenticado={true} onAutenticado={vi.fn()}>
        <p>Meu cronograma</p>
      </TelaAutenticada>,
    );

    expect(screen.getByText('Meu cronograma')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /login/i })).not.toBeInTheDocument();
  });

  it('Então eu devo voltar para a tela de login quando não autenticado, pedindo email e senha', () => {
    render(
      <TelaAutenticada autenticado={false} onAutenticado={vi.fn()}>
        <p>Meu cronograma</p>
      </TelaAutenticada>,
    );

    expect(screen.queryByText('Meu cronograma')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    // Nome completo não faz parte do login — só do cadastro.
    expect(screen.queryByLabelText(/nome completo/i)).not.toBeInTheDocument();
  });

  it('Cenário: Login com credenciais válidas autentica o usuário', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ accessToken: 'token-123' });
    const onAutenticado = vi.fn();
    render(
      <TelaAutenticada autenticado={false} onAutenticado={onAutenticado}>
        <p>Meu cronograma</p>
      </TelaAutenticada>,
    );

    // Quando eu informo email e senha corretos
    await userEvent.type(screen.getByLabelText(/email/i), 'lucas@teste.com');
    await userEvent.type(screen.getByLabelText(/senha/i), 'senha-forte-123');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    // Então eu devo ser autenticado
    expect(authApi.login).toHaveBeenCalledWith({ email: 'lucas@teste.com', senha: 'senha-forte-123' });
    expect(onAutenticado).toHaveBeenCalledWith('token-123');
  });

  it('Cenário: Login com credenciais inválidas exibe mensagem de erro e não autentica', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('Email ou senha incorretos'));
    const onAutenticado = vi.fn();
    render(
      <TelaAutenticada autenticado={false} onAutenticado={onAutenticado}>
        <p>Meu cronograma</p>
      </TelaAutenticada>,
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'lucas@teste.com');
    await userEvent.type(screen.getByLabelText(/senha/i), 'senha-errada');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    // Então eu devo receber uma mensagem alertando sobre email ou senha incorretos
    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou senha incorretos');
    // E eu não devo ser autenticado
    expect(onAutenticado).not.toHaveBeenCalled();
  });

  it('Cenário: Cadastro de novo usuário com nome completo, email e senha', async () => {
    vi.mocked(authApi.cadastrar).mockResolvedValue({
      id: 'usuario-1',
      nomeCompleto: 'Lucas Monteiro',
      email: 'lucas@teste.com',
    });
    vi.mocked(authApi.login).mockResolvedValue({ accessToken: 'token-novo' });
    const onAutenticado = vi.fn();
    render(
      <TelaAutenticada autenticado={false} onAutenticado={onAutenticado}>
        <p>Meu cronograma</p>
      </TelaAutenticada>,
    );

    // Quando eu abro a opção de cadastro
    await userEvent.click(screen.getByRole('button', { name: /ainda não tenho conta/i }));
    expect(screen.getByRole('heading', { name: /criar conta/i })).toBeInTheDocument();

    // E eu me cadastro com nome completo, email e senha válidos
    await userEvent.type(screen.getByLabelText(/nome completo/i), 'Lucas Monteiro');
    await userEvent.type(screen.getByLabelText(/email/i), 'lucas@teste.com');
    await userEvent.type(screen.getByLabelText(/senha/i), 'senha-forte-123');
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    // Então uma conta deve ser criada...
    expect(authApi.cadastrar).toHaveBeenCalledWith({
      nomeCompleto: 'Lucas Monteiro',
      email: 'lucas@teste.com',
      senha: 'senha-forte-123',
    });
    // ...e eu devo conseguir fazer login com essas credenciais (automaticamente).
    expect(authApi.login).toHaveBeenCalledWith({ email: 'lucas@teste.com', senha: 'senha-forte-123' });
    expect(onAutenticado).toHaveBeenCalledWith('token-novo');
  });

  it('Deslogar depois de um cadastro volta para o modo login, não fica preso em "Criar conta"', async () => {
    vi.mocked(authApi.cadastrar).mockResolvedValue({
      id: 'usuario-1',
      nomeCompleto: 'Lucas Monteiro',
      email: 'lucas@teste.com',
    });
    vi.mocked(authApi.login).mockResolvedValue({ accessToken: 'token-novo' });

    const { rerender } = render(
      <TelaAutenticada autenticado={false} onAutenticado={vi.fn()}>
        <p>Meu cronograma</p>
      </TelaAutenticada>,
    );

    // Abro o cadastro e crio a conta (fica autenticado em seguida)
    await userEvent.click(screen.getByRole('button', { name: /ainda não tenho conta/i }));
    await userEvent.type(screen.getByLabelText(/nome completo/i), 'Lucas Monteiro');
    await userEvent.type(screen.getByLabelText(/email/i), 'lucas@teste.com');
    await userEvent.type(screen.getByLabelText(/senha/i), 'senha-forte-123');
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    rerender(
      <TelaAutenticada autenticado={true} onAutenticado={vi.fn()}>
        <p>Meu cronograma</p>
      </TelaAutenticada>,
    );

    // Deslogar (pelo botão do header ou por um 401) só troca a flag.

    rerender(
      <TelaAutenticada autenticado={false} onAutenticado={vi.fn()}>
        <p>Meu cronograma</p>
      </TelaAutenticada>,
    );

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/nome completo/i)).not.toBeInTheDocument();
  });
});
