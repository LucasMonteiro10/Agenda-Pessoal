import { ErroHttp, requisitar } from './http.ts';

// Cliente HTTP compartilhado por authApi/atividadesApi/alocacoesApi — aqui
// só o `fetch` é mockado; o contrato real da API é coberto pelos testes e2e
// do backend (backend/test/*.e2e-spec.ts).
describe('requisitar', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', 'http://api.teste');
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('faz GET na URL da API por padrão e devolve o JSON da resposta', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify([{ id: 'a1' }]), { status: 200 }));

    const resposta = await requisitar('/atividades');

    expect(resposta).toEqual([{ id: 'a1' }]);
    expect(fetchMock).toHaveBeenCalledWith('http://api.teste/atividades', expect.objectContaining({ method: 'GET' }));
  });

  it('envia o corpo como JSON e o accessToken no header Authorization', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: 'a1' }), { status: 201 }));

    await requisitar('/atividades', { metodo: 'POST', corpo: { nome: 'Trabalho' }, accessToken: 'token-123' });

    const [, opcoes] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(opcoes.method).toBe('POST');
    expect(opcoes.body).toBe(JSON.stringify({ nome: 'Trabalho' }));
    expect(opcoes.headers).toEqual({ 'Content-Type': 'application/json', Authorization: 'Bearer token-123' });
  });

  it('não envia Authorization quando não há accessToken (ex.: login)', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ accessToken: 'x' }), { status: 200 }));

    await requisitar('/auth/login', { metodo: 'POST', corpo: {} });

    const [, opcoes] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(opcoes.headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('resposta 204 (sem corpo) resolve sem tentar ler JSON', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(requisitar('/atividades/a1', { metodo: 'DELETE', accessToken: 'token-123' })).resolves.toBeUndefined();
  });

  it('erro do backend vira ErroHttp com a mensagem do NestJS e o status', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Já existe uma atividade com esse nome' }), { status: 409 }),
    );

    const erro = await requisitar('/atividades', { metodo: 'POST', corpo: {} }).catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(ErroHttp);
    expect(erro).toMatchObject({ message: 'Já existe uma atividade com esse nome', status: 409 });
  });

  it('lista de mensagens de validação é juntada numa só', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: ['nome é obrigatório', 'cor inválida'] }), { status: 400 }),
    );

    await expect(requisitar('/atividades', { metodo: 'POST', corpo: {} })).rejects.toThrow(
      'nome é obrigatório, cor inválida',
    );
  });
});
