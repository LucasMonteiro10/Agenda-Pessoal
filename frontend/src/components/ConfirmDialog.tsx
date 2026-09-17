import { createPortal } from 'react-dom';

export interface ConfirmDialogProps {
  open: boolean;
  titulo?: string;
  mensagem: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function ConfirmDialog({ open, titulo, mensagem, onConfirmar, onCancelar }: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  // Portal direto pro <body>: um ConfirmDialog aberto a partir de um card do
  // calendário (dentro da árvore do FullCalendar) fica sujeito ao contexto
  // de empilhamento interno da lib — mesmo com z-index alto, ele podia ficar
  // atrás do calendário. Renderizar fora dessa árvore resolve de vez.
  return createPortal(
    <div className="confirm-dialog__backdrop">
      <div role="dialog" aria-modal="true" aria-label={titulo ?? 'Confirmação'} className="confirm-dialog">
        {titulo && <h2>{titulo}</h2>}
        <p>{mensagem}</p>
        <div className="confirm-dialog__acoes">
          <button type="button" className="btn btn--perigo" onClick={onConfirmar}>
            Confirmar
          </button>
          <button type="button" className="btn btn--secundario" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
