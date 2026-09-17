import { useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog.tsx';

export interface LimparCalendarioButtonProps {
  onLimpar: () => void;
}

export function LimparCalendarioButton({ onLimpar }: LimparCalendarioButtonProps) {
  const [confirmando, setConfirmando] = useState(false);

  return (
    <>
      <button type="button" className="btn btn--secundario" onClick={() => setConfirmando(true)}>
        Limpar calendário
      </button>

      <ConfirmDialog
        open={confirmando}
        mensagem="Remover todas as alocações do calendário? As atividades continuam na pool."
        onConfirmar={() => {
          setConfirmando(false);
          onLimpar();
        }}
        onCancelar={() => setConfirmando(false)}
      />
    </>
  );
}
