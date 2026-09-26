import { Component, type ErrorInfo, type ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  // Botões extras exibidos ao lado do "Tentar novamente" (ex.: "Deslogar",
  // que no cronograma fica no header — desmontado junto com o erro).
  acoesFallback?: ReactNode;
}

interface ErrorBoundaryState {
  erro: Error | null;
}

// Sem isto, um erro durante o render desmonta a árvore React inteira e a
// página fica em branco (CLAUDE.md, seção 7.17). Com ele, só a parte da
// tela embrulhada é trocada por uma mensagem — com `acoesFallback`, a
// mensagem pode oferecer ações que ficavam na parte quebrada (ex.: o
// "Deslogar" do header do cronograma).
//
// Precisa ser class component: o React (19) ainda não oferece hook para
// capturar erros de render (`getDerivedStateFromError`/`componentDidCatch`).
//
// Só captura erros de render/ciclo de vida — erros em handlers de evento e
// em código assíncrono não passam por aqui (falhas de API já viram o aviso
// `.app-erro` em useCronograma).
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { erro: null };

  static getDerivedStateFromError(erro: Error): ErrorBoundaryState {
    return { erro };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Erro inesperado ao renderizar a tela:', erro, info.componentStack ?? '');
  }

  // Os filhos já foram desmontados quando o erro aconteceu — limpar o erro
  // os monta de novo do zero. No cronograma, isso recarrega atividades e
  // alocações do backend (useCronograma), descartando o estado que quebrou.
  private tentarNovamente = () => {
    this.setState({ erro: null });
  };

  render() {
    if (!this.state.erro) {
      return this.props.children;
    }

    return (
      <div role="alert" className="erro-tela">
        <h2>Algo deu errado ao exibir esta tela</h2>
        <p>
          Suas atividades e alocações continuam salvas. Tente novamente — se o problema persistir, recarregue a
          página.
        </p>
        <div className="erro-tela__acoes">
          <button type="button" className="btn" onClick={this.tentarNovamente}>
            Tentar novamente
          </button>
          {this.props.acoesFallback}
        </div>
      </div>
    );
  }
}
