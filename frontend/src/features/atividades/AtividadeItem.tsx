import { useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog.tsx';
import { paraCorDeTextoComContraste } from '../../utils/cor.ts';

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
  const corTexto = paraCorDeTextoComContraste(atividade.cor);

  return (
    <div className="atividade-card" style={{ backgroundColor: atividade.cor, color: corTexto }}>
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
