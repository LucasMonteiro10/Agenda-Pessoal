import { renderHook, act } from '@testing-library/react';
import { useTema } from './useTema.ts';

// Cenários Gherkin: docs/requisitos.md, Feature "Configurações do
// calendário" > tema claro/escuro.
function mockPrefersDarkMode(prefersDark: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' && prefersDark,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('useTema', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('Cenário: Tema segue o sistema operacional por padrão (SO escuro)', () => {
    // Dado que o usuário não escolheu um tema manualmente
    // E o sistema operacional está em modo escuro
    mockPrefersDarkMode(true);

    const { result } = renderHook(() => useTema());

    // Então a interface deve ser exibida no tema escuro
    expect(result.current.tema).toBe('escuro');
  });

  it('tema segue o sistema operacional por padrão (SO claro)', () => {
    mockPrefersDarkMode(false);

    const { result } = renderHook(() => useTema());

    expect(result.current.tema).toBe('claro');
  });

  it('Cenário: Usuário sobrescreve o tema do sistema', () => {
    // Dado que o sistema operacional está em modo escuro
    mockPrefersDarkMode(true);
    const { result } = renderHook(() => useTema());
    expect(result.current.tema).toBe('escuro');

    // Quando o usuário seleciona manualmente o tema claro
    act(() => {
      result.current.setTema('claro');
    });

    // Então a interface deve permanecer no tema claro até ele mudar novamente
    expect(result.current.tema).toBe('claro');

    // Mesmo remontando o hook (simulando reabrir a aplicação), a escolha
    // manual persiste e não volta a seguir o SO.
    const { result: resultAposReabrir } = renderHook(() => useTema());
    expect(resultAposReabrir.current.tema).toBe('claro');
  });
});
