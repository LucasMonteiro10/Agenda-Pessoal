import { useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import type { Atividade } from './AtividadeItem.tsx';
import { validarNomeAtividade } from './validarNomeAtividade.ts';

export interface EditarAtividadeDialogProps {
  atividade: Atividade;
  // Nomes de todas as atividades da pool — incluindo o da própria
  // atividade, que é descontado aqui (manter o nome não é "duplicar").
  nomesExistentes: string[];
  onSalvar: (nome: string, cor: string) => void;
  onCancelar: () => void;
}

// Cenários Gherkin: docs/requisitos.md, Feature "Gerenciar pool de
// atividades" > "Editar nome e cor propaga para todos os clones" (a partir
// da pool) e Feature "Interagir com um card de alocação" > "Editar a
// atividade a partir de um card..." — o mesmo formulário nos dois lugares.
//
// Diferente do NovaAtividadeDialog, não há prop `open`: quem usa monta este
// componente só enquanto a edição está aberta. Assim o formulário sempre
// nasce com o nome/cor atuais da atividade, sem precisar resetar estado à
// mão ao fechar/reabrir.
export function EditarAtividadeDialog({ atividade, nomesExistentes, onSalvar, onCancelar }: EditarAtividadeDialogProps) {
  const [nome, setNome] = useState(atividade.nome);
  const [cor, setCor] = useState(atividade.cor);
  const [erro, setErro] = useState<string | null>(null);

  function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    const outrosNomes = nomesExistentes.filter((existente) => existente !== atividade.nome);
    const mensagemDeErro = validarNomeAtividade(nome, outrosNomes);
    if (mensagemDeErro) {
      setErro(mensagemDeErro);
      return;
    }

    onSalvar(nome.trim(), cor);
  }

  // Portal pro <body> pelo mesmo motivo do ConfirmDialog: aberto a partir
  // de um card, nasceria dentro da árvore do FullCalendar, sujeita ao
  // contexto de empilhamento interno da lib.
  return createPortal(
    <div className="confirm-dialog__backdrop">
      <div role="dialog" aria-modal="true" aria-label="Editar atividade" className="confirm-dialog confirm-dialog--form">
        <h2>Editar atividade</h2>
        <p>A mudança vale para a pool e para todas as alocações desta atividade no calendário.</p>
        <form onSubmit={aoSubmeter}>
          <div className="nova-atividade-form__linha">
            <input
              type="color"
              value={cor}
              onChange={(evento) => setCor(evento.target.value)}
              aria-label="Cor da atividade"
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
              aria-label="Nome da atividade"
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
            <button type="button" className="btn btn--secundario" onClick={onCancelar}>
              Cancelar
            </button>
            <button type="submit" className="btn">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
