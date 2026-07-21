import { expect, test } from '@playwright/test';

test('cookie session, disabled capabilities and support request id', async ({ page, context }) => {
  const appURL = `http://127.0.0.1:${process.env.E2E_FRONTEND_PORT ?? '5174'}`;
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/v1/capabilities') return route.fulfill({ json: { whatsapp: false, email: false, automation: false, workouts: false, llm: false } });
    if (path === '/api/v1/auth/login') {
      await context.addCookies([
        { name: 'engagefit_session', value: 'mock-session', url: appURL, httpOnly: true, sameSite: 'Lax' },
        { name: 'engagefit_session_csrf', value: 'mock-csrf', url: appURL, sameSite: 'Lax' },
      ]);
      return route.fulfill({ json: { access_token: 'not-persisted' } });
    }
    if (path === '/api/v1/auth/me') {
      if (!route.request().headers().cookie?.includes('engagefit_session=')) return route.fulfill({ status: 401, json: { code: 'session_missing', message: 'missing session', request_id: 'mock-auth' } });
      return route.fulfill({ json: { id: 'user-1', box_id: 'box-1', name: 'Owner', email: 'owner@example.test', role: 'OWNER' } });
    }
    if (path === '/api/v1/box') return route.fulfill({ json: { id: 'box-1', name: 'Academia Teste', risk_inactive_days: 7, risk_message_cooldown_days: 14 } });
    if (path === '/api/v1/dashboard/summary') return route.fulfill({ status: 500, headers: { 'content-type': 'application/json', 'x-request-id': 'support-browser-123' }, body: JSON.stringify({ code: 'internal_error', message: 'internal server error', request_id: 'support-browser-123' }) });
    if (path.startsWith('/api/v1/dashboard/')) return route.fulfill({ json: [] });
    if (path === '/api/v1/auth/logout') return route.fulfill({ status: 204 });
    return route.fulfill({ status: 404, json: { code: 'not_found', message: 'not found', request_id: 'mock-request' } });
  });

  await page.goto('/');
  await page.getByLabel('Email').fill('owner@example.test');
  await page.getByLabel('Senha').fill('valid-password');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('owner@example.test')).toBeVisible();
  await expect(page.getByRole('button', { name: 'WhatsApp' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Automação' })).toHaveCount(0);
  await expect(page.getByText(/support-browser-123/)).toBeVisible();
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await page.evaluate(() => { window.location.hash = 'whatsapp'; });
  await expect(page).toHaveURL(/#dashboard$/);
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
});
