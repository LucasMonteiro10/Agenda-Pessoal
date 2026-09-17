import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TelaAutenticada } from './TelaAutenticada.tsx';

// Cenário Gherkin: docs/requisitos.md, Feature "Autenticação" > "Deslogar um
// usuário autenticado". Sem uma biblioteca de rotas decidida ainda, este
// componente representa a alternância entre "cronograma" e "tela de login"
// a partir de uma flag de autenticação — não faz navegação de URL de fato.
describe('TelaAutenticada', () => {
  it('Cenário: Deslogar um usuário autenticado', async () => {
    // Dado que estou autenticado
    const onDeslogar = vi.fn();
    render(
      <TelaAutenticada autenticado={true} onDeslogar={onDeslogar}>
        <p>Meu cronograma</p>
      </TelaAutenticada>,
    );
    expect(screen.getByText('Meu cronograma')).toBeInTheDocument();

    // Quando eu clico na opção de deslogar
    await userEvent.click(screen.getByRole('button', { name: /deslogar/i }));

    expect(onDeslogar).toHaveBeenCalledTimes(1);
  });

  it('Então eu devo voltar para a tela de login quando não autenticado', () => {
    render(
      <TelaAutenticada autenticado={false} onDeslogar={vi.fn()}>
        <p>Meu cronograma</p>
      </TelaAutenticada>,
    );

    expect(screen.queryByText('Meu cronograma')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
  });
});
