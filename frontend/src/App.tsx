import { useState } from 'react'
import './App.css'
import type { Atividade } from './features/atividades/AtividadeItem.tsx'
import { PoolLateral } from './features/atividades/PoolLateral.tsx'
import { CalendarioSemanal } from './features/calendario/CalendarioSemanal.tsx'
import type { DiaSemana } from './features/calendario/dia-semana.ts'
import { LimparCalendarioButton } from './features/calendario/LimparCalendarioButton.tsx'
import { SeletorConfiguracoes } from './features/calendario/SeletorConfiguracoes.tsx'
import type { Alocacao } from './features/calendario/tipos.ts'

// Composição de demonstração — estado local só nesta tela, sem Redux nem
// chamadas de API ainda. A integração de verdade (store + backend) é um
// passo separado.
function App() {
  const [atividades, setAtividades] = useState<Atividade[]>([
    { id: 'a1', nome: 'Trabalho', cor: '#3366FF' },
    { id: 'a2', nome: 'Estudar Inglês', cor: '#33AA55' },
    { id: 'a3', nome: 'Almoço', cor: '#FFAA00' },
  ])
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([])
  const [diaInicioSemana, setDiaInicioSemana] = useState<DiaSemana>('domingo')
  const [granularidadeMinutos, setGranularidadeMinutos] = useState(30)

  function excluirAtividade(atividadeId: string) {
    setAtividades((atual) => atual.filter((item) => item.id !== atividadeId))
    setAlocacoes((atual) => atual.filter((alocacao) => alocacao.atividade.id !== atividadeId))
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Cronograma Pessoal</h1>
        <SeletorConfiguracoes
          diaInicioSemana={diaInicioSemana}
          granularidadeMinutos={granularidadeMinutos}
          onAlterarDiaInicioSemana={setDiaInicioSemana}
          onAlterarGranularidade={setGranularidadeMinutos}
        />
        <LimparCalendarioButton onLimpar={() => setAlocacoes([])} />
      </header>

      <div className="app-corpo">
        <CalendarioSemanal
          diaInicioSemana={diaInicioSemana}
          granularidadeMinutos={granularidadeMinutos}
          alocacoes={alocacoes}
          onCriarAlocacao={(atividadeId, diaSemana, horaInicio) => {
            const atividade = atividades.find((item) => item.id === atividadeId)
            if (!atividade) return
            setAlocacoes((atual) => [
              ...atual,
              { id: crypto.randomUUID(), atividade, diaSemana, horaInicio, duracaoMinutos: 60 },
            ])
          }}
          onMoverAlocacao={(id, diaSemana, horaInicio) => {
            setAlocacoes((atual) =>
              atual.map((alocacao) => (alocacao.id === id ? { ...alocacao, diaSemana, horaInicio } : alocacao)),
            )
          }}
          onRedimensionarAlocacao={(id, duracaoMinutos) => {
            setAlocacoes((atual) =>
              atual.map((alocacao) => (alocacao.id === id ? { ...alocacao, duracaoMinutos } : alocacao)),
            )
          }}
          onDuplicar={(id) => {
            const original = alocacoes.find((alocacao) => alocacao.id === id)
            if (!original) return
            setAlocacoes((atual) => [...atual, { ...original, id: crypto.randomUUID() }])
          }}
          onExcluir={(id) => setAlocacoes((atual) => atual.filter((alocacao) => alocacao.id !== id))}
          onExcluirAtividade={excluirAtividade}
        />

        <PoolLateral
          atividades={atividades}
          onExcluir={excluirAtividade}
          onCriar={(nome, cor) => {
            setAtividades((atual) => [...atual, { id: crypto.randomUUID(), nome, cor }])
          }}
        />
      </div>
    </main>
  )
}

export default App
