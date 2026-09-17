import { useCallback, useState } from 'react';

export type Tema = 'claro' | 'escuro';

const CHAVE_LOCAL_STORAGE = 'cronograma-pessoal:tema';

function lerTemaEscolhidoManualmente(): Tema | null {
  try {
    const valor = localStorage.getItem(CHAVE_LOCAL_STORAGE);
    return valor === 'claro' || valor === 'escuro' ? valor : null;
  } catch {
    return null;
  }
}

function temaDoSistemaOperacional(): Tema {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
}

// Cenários "Tema segue o sistema operacional por padrão" e "Usuário
// sobrescreve o tema do sistema", em docs/requisitos.md, Feature
// "Configurações do calendário".
export function useTema() {
  const [tema, setTemaState] = useState<Tema>(
    () => lerTemaEscolhidoManualmente() ?? temaDoSistemaOperacional(),
  );

  const setTema = useCallback((novoTema: Tema) => {
    setTemaState(novoTema);
    try {
      localStorage.setItem(CHAVE_LOCAL_STORAGE, novoTema);
    } catch {
      // localStorage indisponível (ex.: modo privado): a escolha vale só
      // para a sessão atual, sem sobreviver a um reload.
    }
  }, []);

  return { tema, setTema };
}
