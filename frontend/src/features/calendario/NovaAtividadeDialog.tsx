import { useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { validarNomeAtividade } from '../atividades/validarNomeAtividade.ts';

export interface NovaAtividadeDialogProps {
  open: boolean;
  nomesExistentes: string[];
  onCriar: (nome: string, cor: string) => void;
  onCancelar: () => void;
}

const COR_PADRAO = '#b5652b';

// Cenários Gherkin: docs/requisitos.md, Feature "Criar atividade a partir de
// um espaço vazio do calendário". Reaproveita a mesma regra de nome único
// (validarNomeAtividade) do formulário da pool (NovaAtividadeForm).
export function NovaAtividadeDialog({ open, nomesExistentes, onCriar, onCancelar }: NovaAtividadeDialogProps) {
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState(COR_PADRAO);
  const [erro, setErro] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  function fecharEResetar() {
    setNome('');
    setCor(COR_PADRAO);
    setErro(null);
    onCancelar();
  }

  function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    const mensagemDeErro = validarNomeAtividade(nome, nomesExistentes);
    if (mensagemDeErro) {
      setErro(mensagemDeErro);
      return;
    }

    onCriar(nome.trim(), cor);
    setNome('');
    setCor(COR_PADRAO);
    setErro(null);
  }

  // Mesmo portal pro <body> do ConfirmDialog (components/ConfirmDialog.tsx)
  // e pelo mesmo motivo: um clique num espaço vazio do calendário nasce
  // dentro da árvore do FullCalendar, sujeita ao contexto de empilhamento
  // interno da lib.
  return createPortal(
    <div className="confirm-dialog__backdrop">
      <div role="dialog" aria-modal="true" aria-label="Nova atividade" className="confirm-dialog confirm-dialog--form">
        <h2>Nova atividade</h2>
        <form onSubmit={aoSubmeter}>
          <div className="nova-atividade-form__linha">
            <input
              type="color"
              value={cor}
              onChange={(evento) => setCor(evento.target.value)}
              aria-label="Cor da nova atividade"
              className="nova-atividade-form__cor"
            />
            <input
              type="text"
              value={nome}
              onChange={(evento) => {
                setNome(evento.target.value);
                setErro(null);
              }}
              placeholder="Nome da atividade"
              aria-label="Nome da nova atividade"
              className="nova-atividade-form__nome"
              autoFocus
            />
          </div>
          {erro && (
            <p role="alert" className="nova-atividade-form__erro">
              {erro}
            </p>
          )}
          <div className="confirm-dialog__acoes">
            <button type="button" className="btn btn--secundario" onClick={fecharEResetar}>
              Cancelar
            </button>
            <button type="submit" className="btn">
              Criar e alocar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
