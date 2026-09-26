import { useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog.tsx';

export interface DeslogarButtonProps {
  onDeslogar: () => void;
}

// Mesmo padrão do LimparCalendarioButton: o clique só abre a confirmação.
// Usado em dois lugares (App.tsx): no header da agenda e na mensagem do
// ErrorBoundary — se a agenda quebra, o header some junto com ela.
export function DeslogarButton({ onDeslogar }: DeslogarButtonProps) {
  const [confirmando, setConfirmando] = useState(false);

  return (
    <>
      <button type="button" className="btn btn--secundario" onClick={() => setConfirmando(true)}>
        Deslogar
      </button>

      <ConfirmDialog
        open={confirmando}
        titulo="Deslogar"
        mensagem="Sair da sua conta? Suas atividades e alocações continuam salvas."
        onConfirmar={() => {
          setConfirmando(false);
          onDeslogar();
        }}
        onCancelar={() => setConfirmando(false)}
      />
    </>
  );
}
