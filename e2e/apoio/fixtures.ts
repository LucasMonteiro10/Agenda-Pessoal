import { randomUUID } from 'node:crypto';
import { test as base, expect, type Page } from '@playwright/test';
import { URL_BACKEND } from './ambiente';

interface Fixtures {
  paginaAutenticada: Page;
}

// Só no modo demonstração (DEMO=1): desenha um cursor na página, já que o
// vídeo gravado pelo Playwright não mostra o ponteiro do mouse.
function desenharCursor() {
  window.addEventListener('DOMContentLoaded', () => {
    const cursor = document.createElement('div');
    cursor.style.cssText =
      'position:fixed;z-index:99999;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;' +
      'background:rgba(217,138,76,.45);border:2px solid #b5652b;pointer-events:none;transition:transform .15s;left:-50px;top:-50px';
    document.body.appendChild(cursor);
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    });
    document.addEventListener('mousedown', () => (cursor.style.transform = 'scale(.6)'));
    document.addEventListener('mouseup', () => (cursor.style.transform = 'scale(1)'));
  });
}

export const test = base.extend<Fixtures>({
  page: async ({ page }, use) => {
    if (process.env.DEMO) await page.addInitScript(desenharCursor);
    await use(page);
  },

  // "Dado que estou autenticado": cada teste cria o próprio usuário pela API
  // (dados isolados, sem depender da ordem dos testes) e já abre a página
  // com o token salvo. A tela de login em si é coberta pelos testes de
  // componente (TelaAutenticada.test.tsx) — repeti-la em todo cenário E2E
  // só deixaria a suíte mais lenta.
  paginaAutenticada: async ({ page, request }, use) => {
    const usuario = {
      nomeCompleto: 'Usuária E2E',
      email: `e2e-${randomUUID()}@teste.local`,
      senha: 'senha-forte-123',
    };
    const cadastro = await request.post(`${URL_BACKEND}/auth/registrar`, { data: usuario });
    expect(cadastro.ok()).toBeTruthy();

    const login = await request.post(`${URL_BACKEND}/auth/login`, {
      data: { email: usuario.email, senha: usuario.senha },
    });
    const { accessToken } = await login.json();

    await page.addInitScript((token) => localStorage.setItem('accessToken', token), accessToken);
    await use(page);
  },
});

export { expect };
