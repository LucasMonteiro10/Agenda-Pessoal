import { useState } from 'react'
import './App.css'
import { PoolLateral } from './features/atividades/PoolLateral.tsx'
import { TelaAutenticada } from './features/auth/TelaAutenticada.tsx'
import { CalendarioSemanal } from './features/calendario/CalendarioSemanal.tsx'
import type { DiaSemana } from './features/calendario/dia-semana.ts'
import { LimparCalendarioButton } from './features/calendario/LimparCalendarioButton.tsx'
import { SeletorConfiguracoes } from './features/calendario/SeletorConfiguracoes.tsx'
import { useCronograma } from './features/cronograma/useCronograma.ts'

const CHAVE_ACCESS_TOKEN = 'accessToken'

function App() {
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem(CHAVE_ACCESS_TOKEN))

  function autenticar(token: string) {
    localStorage.setItem(CHAVE_ACCESS_TOKEN, token)
    setAccessToken(token)
  }

  function deslogar() {
    localStorage.removeItem(CHAVE_ACCESS_TOKEN)
    setAccessToken(null)
  }

  // `Cronograma` só é montado com um token em mãos — deslogar desmonta o
  // componente e descarta o estado do usuário anterior junto.
  return (
    <TelaAutenticada autenticado={accessToken !== null} onAutenticado={autenticar} onDeslogar={deslogar}>
      {accessToken && <Cronograma accessToken={accessToken} onNaoAutorizado={deslogar} />}
    </TelaAutenticada>
  )
}

interface CronogramaProps {
  accessToken: string
  onNaoAutorizado: () => void
}

// Atividades e Alocações vêm do backend (useCronograma) — cada ação é salva
// no banco, então nada se perde ao recarregar a página.
function Cronograma({ accessToken, onNaoAutorizado }: CronogramaProps) {
  const cronograma = useCronograma(accessToken, onNaoAutorizado)
  const [diaInicioSemana, setDiaInicioSemana] = useState<DiaSemana>('domingo')
  const [granularidadeMinutos, setGranularidadeMinutos] = useState(30)

  return (
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
        <LimparCalendarioButton onLimpar={cronograma.limparCalendario} />
      </header>

      {cronograma.erro && (
        <p role="alert" className="app-erro">
          {cronograma.erro}
        </p>
      )}

      <div className="app-corpo">
        <CalendarioSemanal
          diaInicioSemana={diaInicioSemana}
          granularidadeMinutos={granularidadeMinutos}
          alocacoes={cronograma.alocacoes}
          nomesAtividadesExistentes={cronograma.atividades.map((atividade) => atividade.nome)}
          onCriarAlocacao={cronograma.criarAlocacao}
          onMoverAlocacao={cronograma.moverAlocacao}
          onRedimensionarAlocacao={cronograma.redimensionarAlocacao}
          onDuplicar={cronograma.duplicarAlocacao}
          onExcluir={cronograma.excluirAlocacao}
          onExcluirAlocacoesDaAtividade={cronograma.excluirAlocacoesDaAtividade}
          onCriarAtividadeEAlocar={cronograma.criarAtividadeEAlocar}
          onEditarAtividade={cronograma.editarAtividade}
        />

        <PoolLateral
          atividades={cronograma.atividades}
          onExcluir={cronograma.excluirAtividade}
          onEditar={cronograma.editarAtividade}
          onCriar={cronograma.criarAtividade}
        />
      </div>
    </main>
  )
}

export default App
