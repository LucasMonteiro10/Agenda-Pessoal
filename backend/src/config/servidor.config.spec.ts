import { origemPermitida, portaDoServidor } from './servidor.config.js';

// Motivação: CLAUDE.md, seção 7.26 — a Vercel informa a porta em PORT, e
// cada preview deployment do frontend tem uma URL própria.
describe('portaDoServidor', () => {
  it('usa PORT quando definida (Vercel)', () => {
    expect(portaDoServidor({ PORT: '8080', BACKEND_PORT: '1002' })).toBe(8080);
  });

  it('sem PORT, usa BACKEND_PORT (Docker local)', () => {
    expect(portaDoServidor({ BACKEND_PORT: '1002' })).toBe(1002);
  });

  it('sem nenhuma das duas, usa 3000', () => {
    expect(portaDoServidor({})).toBe(3000);
  });
});

describe('origemPermitida (CORS)', () => {
  it('sem FRONTEND_URL, libera só o frontend local padrão', () => {
    expect(origemPermitida('http://localhost:5173', {})).toBe(true);
    expect(origemPermitida('https://agenda-pessoal.vercel.app', {})).toBe(false);
  });

  it('libera exatamente a origem configurada em FRONTEND_URL, mesmo com barra no final', () => {
    const env = { FRONTEND_URL: 'https://agenda-pessoal.vercel.app/' };

    expect(origemPermitida('https://agenda-pessoal.vercel.app', env)).toBe(true);
    expect(origemPermitida('https://outro-site.vercel.app', env)).toBe(false);
  });

  it('aceita várias origens separadas por vírgula', () => {
    const env = { FRONTEND_URL: 'https://agenda-pessoal.vercel.app, http://localhost:1003' };

    expect(origemPermitida('https://agenda-pessoal.vercel.app', env)).toBe(true);
    expect(origemPermitida('http://localhost:1003', env)).toBe(true);
  });

  it('"*" libera as URLs de preview da Vercel (um trecho de letras, números e hífens)', () => {
    const env = { FRONTEND_URL: 'https://agenda-pessoal-*-lucas.vercel.app' };

    expect(origemPermitida('https://agenda-pessoal-8f3k2l1qa-lucas.vercel.app', env)).toBe(true);
    expect(origemPermitida('https://agenda-pessoal-git-main-lucas.vercel.app', env)).toBe(true);
  });

  it('"*" não atravessa pontos nem aceita outro domínio no fim', () => {
    const env = { FRONTEND_URL: 'https://agenda-pessoal-*-lucas.vercel.app' };

    expect(origemPermitida('https://agenda-pessoal-x.site-malicioso.com-lucas.vercel.app', env)).toBe(false);
    expect(origemPermitida('https://agenda-pessoal-abc-lucas.vercel.app.site-malicioso.com', env)).toBe(false);
    expect(origemPermitida('http://agenda-pessoal-abc-lucas.vercel.app', env)).toBe(false);
  });
});
