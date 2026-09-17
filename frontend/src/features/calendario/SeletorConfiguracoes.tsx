import type { DiaSemana } from './dia-semana.ts';

export interface SeletorConfiguracoesProps {
  diaInicioSemana: DiaSemana;
  granularidadeMinutos: number;
  onAlterarDiaInicioSemana: (dia: DiaSemana) => void;
  onAlterarGranularidade: (minutos: number) => void;
}

// Cenários Gherkin: docs/requisitos.md, Feature "Configurações do
// calendário" — só os dois dias de início já especificados nos cenários.
export function SeletorConfiguracoes({
  diaInicioSemana,
  granularidadeMinutos,
  onAlterarDiaInicioSemana,
  onAlterarGranularidade,
}: SeletorConfiguracoesProps) {
  return (
    <div className="config-toolbar">
      <label className="config-toolbar__campo">
        Início da semana
        <select
          value={diaInicioSemana}
          onChange={(evento) => onAlterarDiaInicioSemana(evento.target.value as DiaSemana)}
        >
          <option value="domingo">Domingo</option>
          <option value="segunda-feira">Segunda-feira</option>
        </select>
      </label>

      <label className="config-toolbar__campo">
        Granularidade
        <select
          value={granularidadeMinutos}
          onChange={(evento) => onAlterarGranularidade(Number(evento.target.value))}
        >
          <option value={15}>15 minutos</option>
          <option value={30}>30 minutos</option>
          <option value={60}>1 hora</option>
        </select>
      </label>
    </div>
  );
}
