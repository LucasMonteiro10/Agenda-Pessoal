import { useState, type FormEvent } from 'react';
import { validarNomeAtividade } from './validarNomeAtividade.ts';

export interface NovaAtividadeFormProps {
  nomesExistentes: string[];
  onCriar: (nome: string, cor: string) => void;
}

const COR_PADRAO = '#b5652b';

// Cenário Gherkin: docs/requisitos.md, Feature "Gerenciar pool de
// atividades" > "Criar uma nova atividade" e "Impedir duas atividades com o
// mesmo nome" (Suposições e decisões de negócio, item 5 — nome único).
export function NovaAtividadeForm({ nomesExistentes, onCriar }: NovaAtividadeFormProps) {
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState(COR_PADRAO);
  const [erro, setErro] = useState<string | null>(null);

  function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    const mensagemDeErro = validarNomeAtividade(nome, nomesExistentes);
    if (mensagemDeErro) {
      setErro(mensagemDeErro);
      return;
    }

    onCriar(nome.trim(), cor);
    setNome('');
    setCor(COR_PADRAO);
    setErro(null);
  }

  return (
    <form className="nova-atividade-form" onSubmit={aoSubmeter}>
      <div className="nova-atividade-form__linha">
        <input
          type="color"
          value={cor}
          onChange={(evento) => setCor(evento.target.value)}
          aria-label="Cor da nova atividade"
          className="nova-atividade-form__cor"
        />
        <input
          type="text"
          value={nome}
          onChange={(evento) => {
            setNome(evento.target.value);
            setErro(null);
          }}
          placeholder="Nome da atividade"
          aria-label="Nome da nova atividade"
          className="nova-atividade-form__nome"
        />
        <button type="submit" className="btn">
          Adicionar
        </button>
      </div>
      {erro && (
        <p role="alert" className="nova-atividade-form__erro">
          {erro}
        </p>
      )}
    </form>
  );
}
