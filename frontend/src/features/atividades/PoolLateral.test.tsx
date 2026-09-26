import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Atividade } from './AtividadeItem.tsx';
import { PoolLateral } from './PoolLateral.tsx';

const atividades: Atividade[] = [{ id: 'atividade-1', nome: 'Trabalho', cor: '#3b7a57' }];

function renderizarPool() {
  return render(<PoolLateral atividades={atividades} onExcluir={vi.fn()} onEditar={vi.fn()} onCriar={vi.fn()} />);
}

// Cenários Gherkin: docs/requisitos.md, Feature "Exibir ou ocultar a barra
// de atividades". "O calendário deve ocupar o espaço liberado" depende de
// layout real (largura renderizada), que o jsdom não reproduz — verificado
// no navegador (CLAUDE.md, seção 7.20).
describe('PoolLateral — exibir ou ocultar a barra', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('Cenário: Ocultar a barra amplia o calendário', async () => {
    // Dado que a barra "Suas atividades" está exibida
    renderizarPool();
    expect(screen.getByLabelText(/nome da nova atividade/i)).toBeVisible();
    expect(screen.getByText('Trabalho')).toBeVisible();

    // Quando eu clico em "Ocultar atividades"
    await userEvent.click(screen.getByRole('button', { name: /ocultar atividades/i }));

    // Então a barra deve ser recolhida
    expect(screen.getByLabelText(/nome da nova atividade/i)).not.toBeVisible();
    expect(screen.getByText('Trabalho')).not.toBeVisible();
    expect(screen.getByRole('button', { name: /exibir atividades/i })).toHaveAttribute('aria-expanded', 'false');
  });

  it('Cenário: Exibir a barra novamente', async () => {
    // Dado que a barra "Suas atividades" está oculta
    renderizarPool();
    await userEvent.click(screen.getByRole('button', { name: /ocultar atividades/i }));

    // Quando eu clico em "Exibir atividades"
    await userEvent.click(screen.getByRole('button', { name: /exibir atividades/i }));

    // Então a barra deve voltar a mostrar o formulário e a lista
    expect(screen.getByLabelText(/nome da nova atividade/i)).toBeVisible();
    expect(screen.getByText('Trabalho')).toBeVisible();
    expect(screen.getByRole('button', { name: /ocultar atividades/i })).toHaveAttribute('aria-expanded', 'true');
  });

  it('Cenário: A escolha é lembrada ao recarregar a página', async () => {
    // Dado que eu ocultei a barra "Suas atividades"
    const { unmount } = renderizarPool();
    await userEvent.click(screen.getByRole('button', { name: /ocultar atividades/i }));

    // Quando eu recarrego a página
    unmount();
    renderizarPool();

    // Então a barra deve continuar oculta
    expect(screen.getByRole('button', { name: /exibir atividades/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nome da nova atividade/i)).not.toBeVisible();
  });

  it('no primeiro acesso (nada salvo), a barra aparece exibida', () => {
    renderizarPool();

    expect(screen.getByRole('button', { name: /ocultar atividades/i })).toBeInTheDocument();
  });

  it('se o localStorage estiver indisponível, a barra continua funcionando (exibida)', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    renderizarPool();
    await userEvent.click(screen.getByRole('button', { name: /ocultar atividades/i }));

    expect(screen.getByRole('button', { name: /exibir atividades/i })).toBeInTheDocument();
    getItem.mockRestore();
    setItem.mockRestore();
  });
});
