import { Draggable } from '@fullcalendar/interaction';
import { useEffect, useRef, useState } from 'react';
import { paraCorDeTextoComContraste } from '../../utils/cor.ts';
import { AtividadeItem, type Atividade } from './AtividadeItem.tsx';
import { NovaAtividadeForm } from './NovaAtividadeForm.tsx';

export interface PoolLateralProps {
  atividades: Atividade[];
  onExcluir: (id: string) => void;
  onEditar: (id: string, nome: string, cor: string) => void;
  onCriar: (nome: string, cor: string) => void;
}

const CHAVE_BARRA_RECOLHIDA = 'poolLateralRecolhida';

// Cenários Gherkin: docs/requisitos.md, Feature "Exibir ou ocultar a barra
// de atividades". É só uma preferência visual deste navegador — por isso
// localStorage, e não o backend. O acesso fica em try/catch: com o
// armazenamento bloqueado (ex.: navegação privada em alguns navegadores), a
// barra continua funcionando, só não lembra a escolha.
function useBarraRecolhida() {
  const [recolhida, setRecolhida] = useState(() => {
    try {
      return localStorage.getItem(CHAVE_BARRA_RECOLHIDA) === 'true';
    } catch {
      return false;
    }
  });

  function alternar() {
    const nova = !recolhida;
    setRecolhida(nova);
    try {
      localStorage.setItem(CHAVE_BARRA_RECOLHIDA, String(nova));
    } catch {
      // Sem armazenamento disponível: a escolha vale só até recarregar.
    }
  }

  return [recolhida, alternar] as const;
}

// Cenário Gherkin: "Arrastar atividade da pool para o calendário" (Feature
// "Alocar atividades no calendário"). O `Draggable` do FullCalendar observa
// este container e transforma cada `.atividade-pool-item` num item
// arrastável externo — soltar sobre o CalendarioSemanal dispara
// `eventReceive` lá.
export function PoolLateral({ atividades, onExcluir, onEditar, onCriar }: PoolLateralProps) {
  const nomesExistentes = atividades.map((atividade) => atividade.nome);
  const listaRef = useRef<HTMLUListElement>(null);
  const [recolhida, alternarRecolhida] = useBarraRecolhida();

  useEffect(() => {
    if (!listaRef.current) {
      return;
    }

    const draggable = new Draggable(listaRef.current, {
      itemSelector: '.atividade-pool-item',
      eventData: (el) => ({
        title: el.dataset.nome,
        backgroundColor: el.dataset.cor,
        borderColor: el.dataset.cor,
        textColor: el.dataset.cor ? paraCorDeTextoComContraste(el.dataset.cor) : undefined,
        duration: '01:00',
        extendedProps: { atividadeId: el.dataset.atividadeId },
      }),
    });

    return () => draggable.destroy();
  }, []);

  // Recolhida, o conteúdo só fica `hidden` (não é desmontado): o Draggable
  // acima continua preso à mesma <ul>, e um nome digitado pela metade no
  // formulário não se perde ao ocultar/exibir.
  return (
    <aside className={recolhida ? 'pool-lateral pool-lateral--recolhida' : 'pool-lateral'}>
      <div className="pool-lateral__cabecalho">
        <h2>Suas atividades</h2>
        <button
          type="button"
          className="pool-lateral__alternar"
          onClick={alternarRecolhida}
          aria-expanded={!recolhida}
          aria-controls="pool-lateral-conteudo"
          aria-label={recolhida ? 'Exibir atividades' : 'Ocultar atividades'}
          title={recolhida ? 'Exibir atividades' : 'Ocultar atividades'}
        >
          {recolhida ? '«' : '»'}
        </button>
      </div>
      <div id="pool-lateral-conteudo" hidden={recolhida}>
        <p className="pool-lateral__dica">Adicione e arraste uma atividade para o calendário.</p>
        <NovaAtividadeForm nomesExistentes={nomesExistentes} onCriar={onCriar} />
        <ul ref={listaRef} className="pool-lateral__lista">
          {atividades.map((atividade) => (
            <li
              key={atividade.id}
              className="atividade-pool-item"
              data-atividade-id={atividade.id}
              data-nome={atividade.nome}
              data-cor={atividade.cor}
            >
              <AtividadeItem
                atividade={atividade}
                nomesExistentes={nomesExistentes}
                onExcluir={onExcluir}
                onEditar={onEditar}
              />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
