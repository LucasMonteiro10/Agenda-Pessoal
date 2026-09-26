import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Rede de segurança: nenhum erro de render (nem na tela de login)
        deixa a página em branco. A agenda tem o seu próprio, mais
        interno, que preserva o botão "Deslogar" — ver App.tsx. */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
