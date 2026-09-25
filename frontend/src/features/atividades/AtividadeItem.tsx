import { useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog.tsx';
import { paraCorDeTextoComContraste } from '../../utils/cor.ts';
import { EditarAtividadeDialog } from './EditarAtividadeDialog.tsx';

export interface Atividade {
  id: string;
  nome: string;
  cor: string;
}

export interface AtividadeItemProps {
  atividade: Atividade;
  // Para a regra de nome único ao renomear (ver EditarAtividadeDialog).
  nomesExistentes: string[];
  onExcluir: (id: string) => void;
  onEditar: (id: string, nome: string, cor: string) => void;
}

export function AtividadeItem({ atividade, nomesExistentes, onExcluir, onEditar }: AtividadeItemProps) {
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [editando, setEditando] = useState(false);
  const corTexto = paraCorDeTextoComContraste(atividade.cor);

  return (
    <div className="atividade-card" style={{ backgroundColor: atividade.cor, color: corTexto }}>
      <span className="atividade-card__nome">{atividade.nome}</span>
      <button
        type="button"
        className="atividade-card__acao"
        onClick={() => setEditando(true)}
        aria-label={`Editar atividade ${atividade.nome}`}
      >
        Editar
      </button>
      <button
        type="button"
        className="atividade-card__acao"
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

      {editando && (
        <EditarAtividadeDialog
          atividade={atividade}
          nomesExistentes={nomesExistentes}
          onSalvar={(nome, cor) => {
            setEditando(false);
            onEditar(atividade.id, nome, cor);
          }}
          onCancelar={() => setEditando(false)}
        />
      )}
    </div>
  );
}
