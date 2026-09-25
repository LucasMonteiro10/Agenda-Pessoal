import { validarNomeAtividade } from './validarNomeAtividade.ts';

// Cenário Gherkin: docs/requisitos.md, Feature "Gerenciar pool de
// atividades" > "Impedir duas atividades com o mesmo nome" — regra
// compartilhada pelo formulário da pool (NovaAtividadeForm) e pelo
// formulário de criação a partir do calendário (NovaAtividadeDialog).
describe('validarNomeAtividade', () => {
  it('rejeita nome vazio', () => {
    expect(validarNomeAtividade('', [])).toBe('Digite um nome para a atividade.');
    expect(validarNomeAtividade('   ', [])).toBe('Digite um nome para a atividade.');
  });

  it('rejeita nome duplicado, ignorando maiúsculas/minúsculas', () => {
    expect(validarNomeAtividade('trabalho', ['Trabalho'])).toBe('Já existe uma atividade chamada "trabalho".');
  });

  it('aceita nome novo e não duplicado', () => {
    expect(validarNomeAtividade('Yoga', ['Trabalho', 'Almoço'])).toBeNull();
  });

  it('ignora espaços nas pontas ao validar', () => {
    expect(validarNomeAtividade('  Yoga  ', ['Trabalho'])).toBeNull();
  });
});
