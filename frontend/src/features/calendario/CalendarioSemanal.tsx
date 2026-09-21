import type { EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core';
import type { DateClickArg, EventReceiveArg, EventResizeDoneArg } from '@fullcalendar/interaction';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog.tsx';
import { paraCorDeTextoComContraste } from '../../utils/cor.ts';
import { NOME_EXIBICAO_DIA_SEMANA, paraDiaSemana, paraNumeroDiaSemana, type DiaSemana } from './dia-semana.ts';
import { NovaAtividadeDialog } from './NovaAtividadeDialog.tsx';
import type { Alocacao } from './tipos.ts';

// Um domingo fixo e arbitrário, só como referência absoluta (nunca exibido
// — os números de data ficam escondidos via dayHeaderContent). O calendário
// não representa datas reais (ver docs/requisitos.md, "Visão geral"): é um
// quadro semanal recorrente.
//
// Importante: a "semana" que o FullCalendar exibe é sempre calculada como
// "os 7 dias a partir de `firstDay`". Isso significa que os 7 dias de
// calendário que representam cada dia da semana MUDAM conforme
// `diaInicioSemana` muda (ex.: se início = segunda, a data que representa
// "domingo" passa a ser uma segunda depois da que representava quando início
// = domingo). Por isso as datas dos eventos são recalculadas a partir do
// `diaInicioSemana` atual, não de uma âncora fixa — do contrário, o
// cabeçalho e os eventos saem de sincronia (dias errados, alocações
// "sumindo" por caírem fora da semana exibida).
const ANCORA_DOMINGO = new Date(2024, 0, 7); // 7 de janeiro de 2024, um domingo

// Data absoluta e fixa pra cada dia da semana — o dia de início NÃO entra
// aqui. `getDay()` desse resultado é sempre exatamente `paraNumeroDiaSemana(dia)`,
// não importa o que mais mude no app.
function dataAbsolutaDoDia(dia: DiaSemana): Date {
  const data = new Date(ANCORA_DOMINGO);
  data.setDate(data.getDate() + paraNumeroDiaSemana(dia));
  return data;
}

function inicioDaSemanaExibida(diaInicioSemana: DiaSemana): Date {
  return dataAbsolutaDoDia(diaInicioSemana);
}

// A data de um dia da semana DENTRO da janela de 7 dias que o FullCalendar
// está exibindo (que começa em `diaInicioSemana`). Isso pode ser uma data
// diferente de `dataAbsolutaDoDia(dia)` (ex.: "domingo" pode cair uma semana
// depois quando a semana exibida começa na segunda) — mas o dia da semana
// resultante (`.getDay()`) é sempre `dia`, nunca outro, garantindo que um
// card marcado como "segunda-feira" sempre caia na coluna de segunda-feira.
function dataDeReferencia(dia: DiaSemana, diaInicioSemana: DiaSemana): Date {
  const inicio = inicioDaSemanaExibida(diaInicioSemana);
  const deslocamento = (paraNumeroDiaSemana(dia) - paraNumeroDiaSemana(diaInicioSemana) + 7) % 7;
  const data = new Date(inicio);
  data.setDate(data.getDate() + deslocamento);
  return data;
}

function minutosParaHoraEstendida(totalMinutos: number): string {
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:00`;
}

function paraDataDoEvento(
  alocacao: Pick<Alocacao, 'diaSemana' | 'horaInicio'>,
  diaInicioSemana: DiaSemana,
): Date {
  const data = dataDeReferencia(alocacao.diaSemana, diaInicioSemana);
  const [horas, minutos] = alocacao.horaInicio.split(':').map(Number);
  data.setHours(horas, minutos, 0, 0);
  return data;
}

function paraEventoFullCalendar(alocacao: Alocacao, diaInicioSemana: DiaSemana): EventInput {
  const inicio = paraDataDoEvento(alocacao, diaInicioSemana);
  const fim = new Date(inicio);
  fim.setMinutes(fim.getMinutes() + alocacao.duracaoMinutos);

  return {
    id: alocacao.id,
    title: alocacao.atividade.nome,
    start: inicio,
    end: fim,
    backgroundColor: alocacao.atividade.cor,
    borderColor: alocacao.atividade.cor,
    textColor: paraCorDeTextoComContraste(alocacao.atividade.cor),
    extendedProps: { atividadeId: alocacao.atividade.id },
  };
}

// A partir de um horário real (pós drag/resize do FullCalendar), extrai só
// dia-da-semana + hora — a data em si é descartada, é só a "folha de papel"
// da âncora.
function extrairDiaEHora(data: Date): { diaSemana: DiaSemana; horaInicio: string } {
  const diaSemana = paraDiaSemana(data.getDay());
  const horaInicio = `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
  return { diaSemana, horaInicio };
}

export interface CalendarioSemanalProps {
  diaInicioSemana: DiaSemana;
  granularidadeMinutos: number;
  alocacoes: Alocacao[];
  nomesAtividadesExistentes: string[];
  onCriarAlocacao: (atividadeId: string, diaSemana: DiaSemana, horaInicio: string) => void;
  onMoverAlocacao: (alocacaoId: string, diaSemana: DiaSemana, horaInicio: string) => void;
  onRedimensionarAlocacao: (alocacaoId: string, novaDuracaoMinutos: number) => void;
  onDuplicar: (alocacaoId: string) => void;
  onExcluir: (alocacaoId: string) => void;
  // "Excluir alocações": remove todos os clones da atividade, mas mantém a
  // atividade na pool (diferente do "Excluir" da pool, que cascateia e some
  // com a atividade também — ver AtividadeItem).
  onExcluirAlocacoesDaAtividade: (atividadeId: string) => void;
  // Clicar num espaço vazio do grid: cria uma Atividade nova e já aloca no
  // dia/horário clicado, numa única ação (docs/requisitos.md, Feature
  // "Criar atividade a partir de um espaço vazio do calendário").
  onCriarAtividadeEAlocar: (nome: string, cor: string, diaSemana: DiaSemana, horaInicio: string) => void;
}

interface MenuAberto {
  alocacaoId: string;
  atividadeId: string;
  x: number;
  y: number;
}

export function CalendarioSemanal({
  diaInicioSemana,
  granularidadeMinutos,
  alocacoes,
  nomesAtividadesExistentes,
  onCriarAlocacao,
  onMoverAlocacao,
  onRedimensionarAlocacao,
  onDuplicar,
  onExcluir,
  onExcluirAlocacoesDaAtividade,
  onCriarAtividadeEAlocar,
}: CalendarioSemanalProps) {
  const [menu, setMenu] = useState<MenuAberto | null>(null);
  const [confirmandoExclusaoDeAlocacoes, setConfirmandoExclusaoDeAlocacoes] = useState<string | null>(null);
  const [espacoVazioClicado, setEspacoVazioClicado] = useState<{ diaSemana: DiaSemana; horaInicio: string } | null>(
    null,
  );
  const calendarioRef = useRef<FullCalendar>(null);

  // `initialDate`/`initialView` só se aplicam na primeira renderização — o
  // FullCalendar não "escuta" mudanças nessas props depois de montado (por
  // isso o nome "initial"). Trocar o início da semana depois de montado
  // precisa de uma navegação explícita via API (`gotoDate`), senão o
  // cabeçalho e o `firstDay` novo ficam calculando a semana a partir da data
  // antiga, saindo de sincronia com os dias que a gente calcula pros eventos.
  useEffect(() => {
    calendarioRef.current?.getApi().gotoDate(inicioDaSemanaExibida(diaInicioSemana));
  }, [diaInicioSemana]);

  const eventos = useMemo(
    () => alocacoes.map((alocacao) => paraEventoFullCalendar(alocacao, diaInicioSemana)),
    [alocacoes, diaInicioSemana],
  );

  function aoClicarEvento(arg: EventClickArg) {
    setMenu({
      alocacaoId: arg.event.id,
      atividadeId: String(arg.event.extendedProps.atividadeId),
      x: arg.jsEvent.clientX,
      y: arg.jsEvent.clientY,
    });
  }

  function aoMover(arg: EventDropArg) {
    const { diaSemana, horaInicio } = extrairDiaEHora(arg.event.start!);
    onMoverAlocacao(arg.event.id, diaSemana, horaInicio);
  }

  function aoRedimensionar(arg: EventResizeDoneArg) {
    const duracaoMinutos = Math.round((arg.event.end!.getTime() - arg.event.start!.getTime()) / 60000);
    onRedimensionarAlocacao(arg.event.id, duracaoMinutos);
  }

  function aoReceberDaPool(arg: EventReceiveArg) {
    const atividadeId = String(arg.event.extendedProps.atividadeId);
    const { diaSemana, horaInicio } = extrairDiaEHora(arg.event.start!);
    // Este componente não guarda estado próprio de eventos — quem manda é
    // `alocacoes` (prop). Removemos a cópia interna do FullCalendar pra não
    // duplicar: o card "de verdade" vem do próximo render, via onCriarAlocacao.
    arg.event.remove();
    onCriarAlocacao(atividadeId, diaSemana, horaInicio);
  }

  // dateClick (interactionPlugin) só dispara num espaço vazio do grid — um
  // clique em cima de um card dispara eventClick (aoClicarEvento) em vez
  // disso, sem também disparar este handler. `allDay` nunca deveria vir
  // true aqui (allDaySlot={false} remove essa linha), mas a guarda evita
  // abrir o formulário sem um horário de verdade caso a lib dispare a partir
  // de outra região clicável (ex.: cabeçalho do dia) no futuro.
  function aoClicarEspacoVazio(arg: DateClickArg) {
    if (arg.allDay) return;
    setEspacoVazioClicado(extrairDiaEHora(arg.date));
  }

  return (
    <div className="calendario-semanal">
      <FullCalendar
        ref={calendarioRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        initialDate={inicioDaSemanaExibida(diaInicioSemana)}
        headerToolbar={false}
        firstDay={paraNumeroDiaSemana(diaInicioSemana)}
        slotDuration={minutosParaHoraEstendida(granularidadeMinutos)}
        slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        // Sem isso, o horário exibido dentro do card (ex.: "9:00 - 10:00")
        // usa o formato de 12h do locale padrão, que pra horas depois do
        // meio-dia fica ambíguo (ex.: "1:30" sem indicar se é da tarde).
        eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        scrollTime="07:00:00"
        // Sem isso, o FullCalendar volta o scroll pro `scrollTime` sempre
        // que os dados mudam — ou seja, a cada mover/redimensionar/criar
        // card, perdendo a posição de scroll do usuário.
        scrollTimeReset={false}
        allDaySlot={false}
        nowIndicator={false}
        height={720}
        dayHeaderContent={(arg) => NOME_EXIBICAO_DIA_SEMANA[paraDiaSemana(arg.date.getDay())]}
        events={eventos}
        editable
        eventStartEditable
        eventResizableFromStart={false}
        eventDurationEditable
        droppable
        eventReceive={aoReceberDaPool}
        eventDrop={aoMover}
        eventResize={aoRedimensionar}
        eventClick={aoClicarEvento}
        dateClick={aoClicarEspacoVazio}
      />

      {menu &&
        createPortal(
          <>
            {/* Backdrop: fecha o menu ao clicar fora dele. Portal pro
                <body> pelo mesmo motivo do ConfirmDialog — evita ficar preso
                atrás do calendário. */}
            <div className="menu-card__backdrop" onClick={() => setMenu(null)} />
            <ul className="menu-card" role="menu" style={{ left: menu.x, top: menu.y }}>
              <li
                role="menuitem"
                onClick={() => {
                  onDuplicar(menu.alocacaoId);
                  setMenu(null);
                }}
              >
                Duplicar
              </li>
              <li
                role="menuitem"
                onClick={() => {
                  onExcluir(menu.alocacaoId);
                  setMenu(null);
                }}
              >
                Excluir
              </li>
              <li
                role="menuitem"
                onClick={() => {
                  setConfirmandoExclusaoDeAlocacoes(menu.atividadeId);
                  setMenu(null);
                }}
              >
                Excluir alocações
              </li>
            </ul>
          </>,
          document.body,
        )}

      <ConfirmDialog
        open={confirmandoExclusaoDeAlocacoes !== null}
        mensagem="Excluir todas as alocações desta atividade no calendário? A atividade continua na pool."
        onConfirmar={() => {
          if (confirmandoExclusaoDeAlocacoes) {
            onExcluirAlocacoesDaAtividade(confirmandoExclusaoDeAlocacoes);
          }
          setConfirmandoExclusaoDeAlocacoes(null);
        }}
        onCancelar={() => setConfirmandoExclusaoDeAlocacoes(null)}
      />

      <NovaAtividadeDialog
        open={espacoVazioClicado !== null}
        nomesExistentes={nomesAtividadesExistentes}
        onCriar={(nome, cor) => {
          if (espacoVazioClicado) {
            onCriarAtividadeEAlocar(nome, cor, espacoVazioClicado.diaSemana, espacoVazioClicado.horaInicio);
          }
          setEspacoVazioClicado(null);
        }}
        onCancelar={() => setEspacoVazioClicado(null)}
      />
    </div>
  );
}
