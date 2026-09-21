import { Draggable } from '@fullcalendar/interaction';
import { useEffect, useRef } from 'react';
import { paraCorDeTextoComContraste } from '../../utils/cor.ts';
import { AtividadeItem, type Atividade } from './AtividadeItem.tsx';
import { NovaAtividadeForm } from './NovaAtividadeForm.tsx';

export interface PoolLateralProps {
  atividades: Atividade[];
  onExcluir: (id: string) => void;
  onCriar: (nome: string, cor: string) => void;
}

// Cenário Gherkin: "Arrastar atividade da pool para o calendário" (Feature
// "Alocar atividades no calendário"). O `Draggable` do FullCalendar observa
// este container e transforma cada `.atividade-pool-item` num item
// arrastável externo — soltar sobre o CalendarioSemanal dispara
// `eventReceive` lá.
export function PoolLateral({ atividades, onExcluir, onCriar }: PoolLateralProps) {
  const listaRef = useRef<HTMLUListElement>(null);

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

  return (
    <aside className="pool-lateral">
      <h2>Suas atividades</h2>
      <p className="pool-lateral__dica">Adicione e arraste uma atividade para o calendário.</p>
      <NovaAtividadeForm nomesExistentes={atividades.map((atividade) => atividade.nome)} onCriar={onCriar} />
      <ul ref={listaRef} className="pool-lateral__lista">
        {atividades.map((atividade) => (
          <li
            key={atividade.id}
            className="atividade-pool-item"
            data-atividade-id={atividade.id}
            data-nome={atividade.nome}
            data-cor={atividade.cor}
          >
            <AtividadeItem atividade={atividade} onExcluir={onExcluir} />
          </li>
        ))}
      </ul>
    </aside>
  );
}
