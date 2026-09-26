import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.tsx';
import { useCronograma } from './features/cronograma/useCronograma.ts';

// useCronograma fala com o backend — aqui mockamos. O hook em si está em
// features/cronograma/useCronograma.test.ts.
vi.mock('./features/cronograma/useCronograma.ts');

// jsdom não implementa ResizeObserver — usado pelo CalendarioSemanal
// (largura do container e layout dos cards), irrelevante aqui.
class ResizeObserverFalso {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function cronogramaVazio(): ReturnType<typeof useCronograma> {
  return {
    atividades: [],
    alocacoes: [],
    erro: null,
    criarAtividade: vi.fn(),
    editarAtividade: vi.fn(),
    excluirAtividade: vi.fn(),
    criarAlocacao: vi.fn(),
    criarAtividadeEAlocar: vi.fn(),
    moverAlocacao: vi.fn(),
    redimensionarAlocacao: vi.fn(),
    duplicarAlocacao: vi.fn(),
    excluirAlocacao: vi.fn(),
    excluirAlocacoesDaAtividade: vi.fn(),
    limparCalendario: vi.fn(),
  };
}

// Cenários Gherkin: docs/requisitos.md, Feature "Autenticação". O fluxo de
// confirmação isolado está em features/auth/DeslogarButton.test.tsx; aqui,
// o efeito de ponta a ponta (token removido, volta para o login).
describe('App — deslogar', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverFalso);
    localStorage.setItem('accessToken', 'token-123');
    vi.mocked(useCronograma).mockReturnValue(cronogramaVazio());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('o botão "Deslogar" fica no header, junto do "Limpar calendário"', () => {
    render(<App />);

    const header = screen.getByRole('button', { name: /limpar calendário/i }).closest('header');
    expect(screen.getByRole('button', { name: /deslogar/i }).closest('header')).toBe(header);
  });

  it('Cenário: Deslogar um usuário autenticado', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /deslogar/i }));
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('Cenário: Cancelar o deslogar mantém a sessão', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /deslogar/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(screen.getByRole('heading', { name: /cronograma pessoal/i })).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBe('token-123');
  });
});

// Só o posicionamento do ErrorBoundary no App — o comportamento do
// componente em si está em components/ErrorBoundary.test.tsx.
describe('App — erro inesperado no cronograma', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('accessToken', 'token-123');
    vi.mocked(useCronograma).mockImplementation(() => {
      throw new Error("Cannot read properties of undefined (reading 'split')");
    });
  });

  afterEach(() => {
    consoleError.mockRestore();
    localStorage.clear();
  });

  it('mostra a mensagem de erro no lugar do cronograma, sem tela em branco', () => {
    render(<App />);

    expect(screen.getByRole('alert')).toHaveTextContent(/algo deu errado/i);
  });

  // O header (com o "Deslogar") some junto com o cronograma quebrado — por
  // isso a mensagem de erro traz o próprio "Deslogar".
  it('o botão "Deslogar" continua disponível e funcionando', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /deslogar/i }));
    await userEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
