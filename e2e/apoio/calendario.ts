import type { Locator, Page } from '@playwright/test';

// A grade do FullCalendar não expõe papéis acessíveis (é uma tabela de
// layout), então aqui — e só aqui — os seletores usam as classes e
// atributos `data-*` da própria biblioteca. O resto dos testes usa
// getByRole/getByLabel, como um usuário enxergaria a tela.

// Coluna de um dia da semana, achada pelo nome exibido no cabeçalho
// ("Quarta-feira") — o FullCalendar identifica as colunas por data, e a
// data de cada dia muda conforme a semana exibida.
export async function colunaDoDia(page: Page, nomeDoDia: string): Promise<Locator> {
  const cabecalho = page.locator('th.fc-col-header-cell').filter({ hasText: nomeDoDia });
  const data = await cabecalho.getAttribute('data-date');
  return page.locator(`td.fc-timegrid-col[data-date="${data}"]`);
}

// Clica no cruzamento entre a coluna do dia e a linha do horário ("14:00").
export async function clicarEmEspacoVazio(page: Page, nomeDoDia: string, horario: string) {
  const linha = page.locator(`td.fc-timegrid-slot-lane[data-time="${horario}:00"]`);
  await linha.scrollIntoViewIfNeeded();

  const coluna = await colunaDoDia(page, nomeDoDia);
  const caixaDaColuna = await coluna.boundingBox();
  const caixaDaLinha = await linha.boundingBox();
  if (!caixaDaColuna || !caixaDaLinha) throw new Error(`Espaço de ${nomeDoDia} às ${horario} não está visível`);

  await page.mouse.click(caixaDaColuna.x + caixaDaColuna.width / 2, caixaDaLinha.y + caixaDaLinha.height / 2);
}
