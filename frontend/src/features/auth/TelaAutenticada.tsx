import type { ReactNode } from 'react';

export interface TelaAutenticadaProps {
  autenticado: boolean;
  onDeslogar: () => void;
  children: ReactNode;
}

// Sem biblioteca de rotas decidida ainda (CLAUDE.md, seção 7), este
// componente representa a alternância "cronograma" / "tela de login" a
// partir de uma flag, sem navegação de URL de fato.
export function TelaAutenticada({ autenticado, onDeslogar, children }: TelaAutenticadaProps) {
  if (!autenticado) {
    return (
      <main>
        <h1>Login</h1>
      </main>
    );
  }

  return (
    <div>
      <button type="button" onClick={onDeslogar}>
        Deslogar
      </button>
      {children}
    </div>
  );
}
