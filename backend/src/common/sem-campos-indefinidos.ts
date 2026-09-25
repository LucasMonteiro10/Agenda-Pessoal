// Com `target: ES2023` (tsconfig.json), o TypeScript liga
// `useDefineForClassFields`: todo campo declarado numa classe — inclusive os
// opcionais de um DTO de PATCH, como `diaSemana?: DiaSemana` — vira uma
// propriedade própria da instância valendo `undefined`. Um PATCH só com
// `{ duracaoMinutos }` chega como `{ diaSemana: undefined, horaInicio:
// undefined, duracaoMinutos }`, e um `Object.assign(entidade, dto)` apagava
// os valores atuais da entidade. O banco não sofria (o TypeORM ignora
// `undefined` no UPDATE), mas a resposta saía incompleta — e o frontend, que
// usa essa resposta direto na tela, quebrava (CLAUDE.md, seção 7.17).
export function semCamposIndefinidos<T extends object>(objeto: T): Partial<T> {
  return Object.fromEntries(Object.entries(objeto).filter(([, valor]) => valor !== undefined)) as Partial<T>;
}
