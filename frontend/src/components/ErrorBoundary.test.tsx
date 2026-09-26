import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary.tsx';

// Motivação: CLAUDE.md, seção 7.17 — um erro de render sem Error Boundary
// desmontava a árvore React inteira e a página ficava em branco.
describe('ErrorBoundary', () => {
  // O React (e o próprio ErrorBoundary) registram o erro no console — aqui
  // é esperado, então silenciamos para não poluir a saída dos testes.
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  function ComponenteQueQuebra(): never {
    throw new Error('Cannot read properties of undefined');
  }

  it('renderiza os filhos normalmente quando não há erro', () => {
    render(
      <ErrorBoundary>
        <p>Minha agenda</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Minha agenda')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('um erro de render nos filhos mostra uma mensagem de erro em vez de uma tela em branco', () => {
    render(
      <ErrorBoundary>
        <ComponenteQueQuebra />
      </ErrorBoundary>,
    );

    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent(/algo deu errado/i);
    // Tranquiliza o usuário: tudo é salvo no backend antes de ir pra tela.
    expect(alerta).toHaveTextContent(/continuam salvas/i);
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });

  it('registra o erro no console para facilitar a investigação', () => {
    render(
      <ErrorBoundary>
        <ComponenteQueQuebra />
      </ErrorBoundary>,
    );

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('ErrorBoundary'),
      expect.objectContaining({ message: 'Cannot read properties of undefined' }),
      expect.any(String),
    );
  });

  it('"Tentar novamente" remonta os filhos do zero', async () => {
    let deveQuebrar = true;
    function QuebraNaPrimeiraVez() {
      if (deveQuebrar) throw new Error('falha momentânea');
      return <p>Minha agenda</p>;
    }

    render(
      <ErrorBoundary>
        <QuebraNaPrimeiraVez />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();

    deveQuebrar = false;
    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));

    expect(screen.getByText('Minha agenda')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('mostra as ações extras (acoesFallback) junto do "Tentar novamente"', () => {
    render(
      <ErrorBoundary acoesFallback={<button type="button">Deslogar</button>}>
        <ComponenteQueQuebra />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /deslogar/i })).toBeInTheDocument();
  });

  it('se o erro persistir, "Tentar novamente" volta a mostrar a mensagem (sem tela em branco)', async () => {
    render(
      <ErrorBoundary>
        <ComponenteQueQuebra />
      </ErrorBoundary>,
    );

    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/algo deu errado/i);
  });
});
