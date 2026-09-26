import { useState } from 'react'
import './App.css'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { PoolLateral } from './features/atividades/PoolLateral.tsx'
import { DeslogarButton } from './features/auth/DeslogarButton.tsx'
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
  // componente e descarta o estado do usuário anterior junto. O "Deslogar"
  // fica no header do cronograma; se o cronograma quebrar, o header some
  // junto, então a mensagem do ErrorBoundary traz o próprio "Deslogar".
  return (
    <TelaAutenticada autenticado={accessToken !== null} onAutenticado={autenticar}>
      {accessToken && (
        <ErrorBoundary acoesFallback={<DeslogarButton onDeslogar={deslogar} />}>
          <Cronograma accessToken={accessToken} onDeslogar={deslogar} />
        </ErrorBoundary>
      )}
    </TelaAutenticada>
  )
}

interface CronogramaProps {
  accessToken: string
  onDeslogar: () => void
}

// Atividades e Alocações vêm do backend (useCronograma) — cada ação é salva
// no banco, então nada se perde ao recarregar a página.
function Cronograma({ accessToken, onDeslogar }: CronogramaProps) {
  // 401 do backend (token expirado ou inválido) desloga direto, sem confirmação.
  const cronograma = useCronograma(accessToken, onDeslogar)
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
        <div className="app-header__acoes">
          <LimparCalendarioButton onLimpar={cronograma.limparCalendario} />
          <DeslogarButton onDeslogar={onDeslogar} />
        </div>
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
