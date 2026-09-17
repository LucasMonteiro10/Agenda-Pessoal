import { useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog.tsx';

export interface Atividade {
  id: string;
  nome: string;
  cor: string;
}

export interface AtividadeItemProps {
  atividade: Atividade;
  onExcluir: (id: string) => void;
}

export function AtividadeItem({ atividade, onExcluir }: AtividadeItemProps) {
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  return (
    <div className="atividade-card" style={{ borderLeftColor: atividade.cor }}>
      <span className="atividade-card__ponto" style={{ backgroundColor: atividade.cor }} aria-hidden="true" />
      <span className="atividade-card__nome">{atividade.nome}</span>
      <button
        type="button"
        className="atividade-card__excluir"
        onClick={() => setConfirmandoExclusao(true)}
        aria-label={`Excluir atividade ${atividade.nome}`}
      >
        Excluir
      </button>

      <ConfirmDialog
        open={confirmandoExclusao}
        mensagem={`Excluir a atividade "${atividade.nome}"? Todas as suas alocações no calendário também serão removidas.`}
        onConfirmar={() => {
          setConfirmandoExclusao(false);
          onExcluir(atividade.id);
        }}
        onCancelar={() => setConfirmandoExclusao(false)}
      />
    </div>
  );
}
