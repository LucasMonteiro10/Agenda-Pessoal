import { useState } from 'react'
import './App.css'
import type { Atividade } from './features/atividades/AtividadeItem.tsx'
import { PoolLateral } from './features/atividades/PoolLateral.tsx'
import { TelaAutenticada } from './features/auth/TelaAutenticada.tsx'
import { CalendarioSemanal } from './features/calendario/CalendarioSemanal.tsx'
import type { DiaSemana } from './features/calendario/dia-semana.ts'
import { LimparCalendarioButton } from './features/calendario/LimparCalendarioButton.tsx'
import { SeletorConfiguracoes } from './features/calendario/SeletorConfiguracoes.tsx'
import type { Alocacao } from './features/calendario/tipos.ts'

const CHAVE_ACCESS_TOKEN = 'accessToken'

// Composição de demonstração — estado local só nesta tela, sem Redux nem
// chamadas de API ainda para Atividade/Alocação. A integração de verdade
// (store + backend) é um passo separado; só a autenticação (TelaAutenticada)
// já fala com o backend de fato.
function App() {
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem(CHAVE_ACCESS_TOKEN))
  const [atividades, setAtividades] = useState<Atividade[]>([
    { id: 'a1', nome: 'Trabalho', cor: '#2F4B3C' },
    { id: 'a2', nome: 'Estudar Inglês', cor: '#93AFC7' },
    { id: 'a3', nome: 'Almoço', cor: '#D8A15C' },
  ])
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([])
  const [diaInicioSemana, setDiaInicioSemana] = useState<DiaSemana>('domingo')
  const [granularidadeMinutos, setGranularidadeMinutos] = useState(30)

  function autenticar(token: string) {
    localStorage.setItem(CHAVE_ACCESS_TOKEN, token)
    setAccessToken(token)
  }

  function deslogar() {
    localStorage.removeItem(CHAVE_ACCESS_TOKEN)
    setAccessToken(null)
  }

  // Botão "Excluir" da pool: remove a atividade e todas as suas alocações
  // (cascata) — a atividade some da pool também.
  function excluirAtividade(atividadeId: string) {
    setAtividades((atual) => atual.filter((item) => item.id !== atividadeId))
    setAlocacoes((atual) => atual.filter((alocacao) => alocacao.atividade.id !== atividadeId))
  }

  // "Excluir alocações" a partir do menu do card: limpa só as alocações
  // daquela atividade no calendário — a atividade continua na pool.
  function excluirAlocacoesDaAtividade(atividadeId: string) {
    setAlocacoes((atual) => atual.filter((alocacao) => alocacao.atividade.id !== atividadeId))
  }

  return (
    <TelaAutenticada autenticado={accessToken !== null} onAutenticado={autenticar} onDeslogar={deslogar}>
      <main className="app-shell">
        <header className="app-header">
          <div className="app-header__titulo">
            <span className="app-header__eyebrow">Semana recorrente</span>
            <h1>Cronograma Pessoal</h1>
          </div>
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
            nomesAtividadesExistentes={atividades.map((atividade) => atividade.nome)}
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
            onExcluirAlocacoesDaAtividade={excluirAlocacoesDaAtividade}
            onCriarAtividadeEAlocar={(nome, cor, diaSemana, horaInicio) => {
              const novaAtividade: Atividade = { id: crypto.randomUUID(), nome, cor }
              setAtividades((atual) => [...atual, novaAtividade])
              setAlocacoes((atual) => [
                ...atual,
                { id: crypto.randomUUID(), atividade: novaAtividade, diaSemana, horaInicio, duracaoMinutos: 60 },
              ])
            }}
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
    </TelaAutenticada>
  )
}

export default App
