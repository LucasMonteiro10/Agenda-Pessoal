import { paraCorDeTextoComContraste } from './cor.ts';

// Cards de Atividade/Alocação usam a cor escolhida pelo usuário como fundo
// (CalendarioSemanal.tsx, PoolLateral.tsx). Sem esse cálculo, uma cor muito
// clara ou muito escura deixa o texto (branco fixo do FullCalendar)
// ilegível sobre o fundo.
describe('paraCorDeTextoComContraste', () => {
  it('retorna preto para um fundo branco', () => {
    expect(paraCorDeTextoComContraste('#FFFFFF')).toBe('#000000');
  });

  it('retorna branco para um fundo preto', () => {
    expect(paraCorDeTextoComContraste('#000000')).toBe('#ffffff');
  });

  it('retorna preto para um amarelo bem claro', () => {
    expect(paraCorDeTextoComContraste('#FFFF00')).toBe('#000000');
  });

  it('retorna branco para um azul escuro', () => {
    expect(paraCorDeTextoComContraste('#3366FF')).toBe('#ffffff');
  });

  it('aceita hex curto de 3 dígitos', () => {
    expect(paraCorDeTextoComContraste('#fff')).toBe('#000000');
    expect(paraCorDeTextoComContraste('#000')).toBe('#ffffff');
  });
});
