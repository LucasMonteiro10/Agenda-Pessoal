import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.tsx';
import { useCronograma } from './features/cronograma/useCronograma.ts';

// Só o posicionamento do ErrorBoundary no App — o comportamento do
// componente em si está em components/ErrorBoundary.test.tsx.
vi.mock('./features/cronograma/useCronograma.ts');

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

  it('o botão "Deslogar" continua disponível e funcionando', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /deslogar/i }));

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
