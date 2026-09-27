import { clicarEmEspacoVazio, colunaDoDia } from '../apoio/calendario';
import { expect, test } from '../apoio/fixtures';

// Feature "Criar atividade a partir de um espaço vazio do calendário"
// (docs/requisitos.md). O E2E cobre a jornada principal, de ponta a ponta
// (navegador → API → banco); os demais cenários da Feature (nome duplicado,
// cancelar) ficam nos testes de componente, mais rápidos
// (NovaAtividadeDialog.test.tsx). Cada `test.step` é um passo do Gherkin.
test.describe('Funcionalidade: Criar atividade diretamente no calendário', () => {
  test('Cenário: Confirmar o formulário cria a atividade e já aloca no horário clicado', async ({
    paginaAutenticada: page,
  }) => {
    const formulario = page.getByRole('dialog', { name: 'Nova atividade' });

    await test.step('Dado que cliquei em um espaço vazio do calendário na quarta-feira às 14:00', async () => {
      await page.goto('/');
      await clicarEmEspacoVazio(page, 'Quarta-feira', '14:00');
      await expect(formulario).toBeVisible();
    });

    await test.step('Quando eu preencho o nome "Yoga" e a cor "#4B6B4F" e confirmo', async () => {
      await formulario.getByLabel('Nome da nova atividade').fill('Yoga');
      await formulario.getByLabel('Cor da nova atividade').fill('#4b6b4f');
      await formulario.getByRole('button', { name: 'Criar e alocar' }).click();
    });

    await test.step('Então a atividade "Yoga" deve aparecer na pool', async () => {
      const pool = page.getByRole('complementary');
      await expect(pool.getByRole('listitem').filter({ hasText: 'Yoga' })).toBeVisible();
    });

    await test.step('E uma alocação de "Yoga" deve aparecer na quarta-feira às 14:00', async () => {
      const quarta = await colunaDoDia(page, 'Quarta-feira');
      const alocacao = quarta.locator('.fc-event').filter({ hasText: 'Yoga' });
      await expect(alocacao).toBeVisible();
      await expect(alocacao).toContainText('14:00 - 15:00');
      await expect(alocacao).toHaveCSS('background-color', 'rgb(75, 107, 79)');
    });
  });
});
