// Regra de negócio: docs/requisitos.md, "Suposições e decisões de negócio",
// item 5 — nome único por Atividade (comparação sem diferenciar maiúsculas
// de minúsculas). Compartilhada entre os dois formulários de criação de
// Atividade (NovaAtividadeForm, na pool, e NovaAtividadeDialog, a partir de
// um clique no calendário) para não divergir a regra entre eles.
export function validarNomeAtividade(nome: string, nomesExistentes: string[]): string | null {
  const nomeLimpo = nome.trim();

  if (!nomeLimpo) {
    return 'Digite um nome para a atividade.';
  }

  const jaExiste = nomesExistentes.some(
    (existente) => existente.localeCompare(nomeLimpo, undefined, { sensitivity: 'base' }) === 0,
  );
  if (jaExiste) {
    return `Já existe uma atividade chamada "${nomeLimpo}".`;
  }

  return null;
}
