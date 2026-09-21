// Luminância relativa da WCAG 2.0 (https://www.w3.org/TR/WCAG20/#relativeluminancedef)
// — a mesma métrica usada para calcular razão de contraste de acessibilidade.
// Acima do limiar, a cor de fundo é "clara" o suficiente pra pedir texto
// preto; abaixo dele, é "escura" o suficiente pra pedir texto branco.
const LIMIAR_LUMINANCIA = 0.179;

function paraHexCompleto(corHex: string): string {
  const hex = corHex.replace('#', '');
  return hex.length === 3
    ? hex
        .split('')
        .map((digito) => digito + digito)
        .join('')
    : hex;
}

function paraCanalLinear(canal8bits: number): number {
  const canalNormalizado = canal8bits / 255;
  return canalNormalizado <= 0.03928
    ? canalNormalizado / 12.92
    : ((canalNormalizado + 0.055) / 1.055) ** 2.4;
}

function luminanciaRelativa(corHex: string): number {
  const hexCompleto = paraHexCompleto(corHex);
  const r = parseInt(hexCompleto.slice(0, 2), 16);
  const g = parseInt(hexCompleto.slice(2, 4), 16);
  const b = parseInt(hexCompleto.slice(4, 6), 16);

  return 0.2126 * paraCanalLinear(r) + 0.7152 * paraCanalLinear(g) + 0.0722 * paraCanalLinear(b);
}

// Escolhe preto ou branco como cor de texto sobre `corFundo`, garantindo
// leitura tanto em cards muito claros quanto muito escuros (ex.: cards de
// Alocação no calendário e o card "fantasma" de arraste da pool, ambos
// pintados com a cor da Atividade escolhida pelo usuário).
export function paraCorDeTextoComContraste(corFundo: string): '#000000' | '#ffffff' {
  return luminanciaRelativa(corFundo) > LIMIAR_LUMINANCIA ? '#000000' : '#ffffff';
}
