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
import { useAgenda } from './features/agenda/useAgenda.ts'

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

  // `Agenda` só é montada com um token em mãos — deslogar desmonta o
  // componente e descarta o estado do usuário anterior junto. O "Deslogar"
  // fica no header da agenda; se a agenda quebrar, o header some
  // junto, então a mensagem do ErrorBoundary traz o próprio "Deslogar".
  return (
    <TelaAutenticada autenticado={accessToken !== null} onAutenticado={autenticar}>
      {accessToken && (
        <ErrorBoundary acoesFallback={<DeslogarButton onDeslogar={deslogar} />}>
          <Agenda accessToken={accessToken} onDeslogar={deslogar} />
        </ErrorBoundary>
      )}
    </TelaAutenticada>
  )
}

interface AgendaProps {
  accessToken: string
  onDeslogar: () => void
}

// Atividades e Alocações vêm do backend (useAgenda) — cada ação é salva
// no banco, então nada se perde ao recarregar a página.
function Agenda({ accessToken, onDeslogar }: AgendaProps) {
  // 401 do backend (token expirado ou inválido) desloga direto, sem confirmação.
  const agenda = useAgenda(accessToken, onDeslogar)
  const [diaInicioSemana, setDiaInicioSemana] = useState<DiaSemana>('domingo')
  const [granularidadeMinutos, setGranularidadeMinutos] = useState(30)

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="app-header__titulo">
          <span className="app-header__eyebrow">Semana recorrente</span>
          <h1>Agenda Pessoal</h1>
        </div>
        <SeletorConfiguracoes
          diaInicioSemana={diaInicioSemana}
          granularidadeMinutos={granularidadeMinutos}
          onAlterarDiaInicioSemana={setDiaInicioSemana}
          onAlterarGranularidade={setGranularidadeMinutos}
        />
        <div className="app-header__acoes">
          <LimparCalendarioButton onLimpar={agenda.limparCalendario} />
          <DeslogarButton onDeslogar={onDeslogar} />
        </div>
      </header>

      {agenda.erro && (
        <p role="alert" className="app-erro">
          {agenda.erro}
        </p>
      )}

      <div className="app-corpo">
        <CalendarioSemanal
          diaInicioSemana={diaInicioSemana}
          granularidadeMinutos={granularidadeMinutos}
          alocacoes={agenda.alocacoes}
          nomesAtividadesExistentes={agenda.atividades.map((atividade) => atividade.nome)}
          onCriarAlocacao={agenda.criarAlocacao}
          onMoverAlocacao={agenda.moverAlocacao}
          onRedimensionarAlocacao={agenda.redimensionarAlocacao}
          onDuplicar={agenda.duplicarAlocacao}
          onExcluir={agenda.excluirAlocacao}
          onExcluirAlocacoesDaAtividade={agenda.excluirAlocacoesDaAtividade}
          onCriarAtividadeEAlocar={agenda.criarAtividadeEAlocar}
          onEditarAtividade={agenda.editarAtividade}
        />

        <PoolLateral
          atividades={agenda.atividades}
          onExcluir={agenda.excluirAtividade}
          onEditar={agenda.editarAtividade}
          onCriar={agenda.criarAtividade}
        />
      </div>
    </main>
  )
}

export default App
