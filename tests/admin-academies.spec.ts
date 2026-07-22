import { expect, test } from '@playwright/test';

test('platform admin creates and suspends an academy from the UI', async ({ page, context }) => {
  const appURL = `http://127.0.0.1:${process.env.E2E_FRONTEND_PORT ?? '5174'}`;
  const policy = {
    id: 'policy-1', scope: 'box', daily_message_limit: 100, monthly_message_limit: 1000, per_dispatch_limit: 50,
    estimated_cost_micros_per_message: 1000, daily_cost_limit_micros: 100000, monthly_cost_limit_micros: 1000000,
    currency: 'USD', warning_percent: 80, timezone: 'America/Sao_Paulo', blocked: false,
  };
  const usage = { daily_accepted: 0, daily_reserved: 0, monthly_accepted: 0, monthly_reserved: 0, daily_estimated_cost_micros: 0, daily_reserved_cost_micros: 0, monthly_estimated_cost_micros: 0, monthly_reserved_cost_micros: 0 };
  const academies = [{ id: 'box-1', name: 'Academia Inicial', status: 'active', status_reason: '', owner_id: 'owner-1', owner_name: 'Owner Inicial', owner_email: 'owner@inicial.test', created_at: '2026-07-22T12:00:00Z' }];

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/v1/capabilities') return route.fulfill({ json: { whatsapp: true, email: false, automation: false, workouts: false, llm: false } });
    if (path === '/api/v1/auth/login') {
      await context.addCookies([{ name: 'engagefit_session', value: 'admin-session', url: appURL, httpOnly: true, sameSite: 'Lax' }]);
      return route.fulfill({ json: { access_token: 'admin-token' } });
    }
    if (path === '/api/v1/auth/me') {
      if (!request.headers().cookie?.includes('engagefit_session=')) return route.fulfill({ status: 401, json: { code: 'session_missing', message: 'missing session' } });
      return route.fulfill({ json: { id: 'admin-1', box_id: '', name: 'Admin', email: 'admin@engagefit.test', role: 'PLATFORM_ADMIN' } });
    }
    if (path === '/api/v1/admin/boxes' && request.method() === 'GET') return route.fulfill({ json: academies });
    if (path === '/api/v1/admin/boxes' && request.method() === 'POST') {
      const payload = request.postDataJSON();
      const created = { id: 'box-2', name: payload.box_name, status: 'active', status_reason: '', owner_id: 'owner-2', owner_name: payload.owner_name, owner_email: payload.owner_email, created_at: '2026-07-22T13:00:00Z' };
      academies.push(created);
      return route.fulfill({ status: 201, json: created });
    }
    if (path === '/api/v1/admin/boxes/box-2/suspend') {
      academies[1] = { ...academies[1], status: 'suspended', status_reason: request.postDataJSON().reason };
      return route.fulfill({ json: academies[1] });
    }
    if (path === '/api/v1/admin/messaging/boxes') return route.fulfill({ json: academies.map((academy) => ({ box_id: academy.id, box_name: academy.name, connection_mode: 'platform', policy: { ...policy, box_id: academy.id }, usage })) });
    if (path === '/api/v1/admin/messaging/platform/policy') return route.fulfill({ json: { policy: { ...policy, scope: 'platform' }, usage } });
    if (path.endsWith('/whatsapp-settings')) return route.fulfill({ json: { id: 'settings-1', box_id: 'box-1', connection_mode: 'platform', provider: 'twilio', base_url: 'https://api.twilio.com', instance_name: '', has_api_key: false, enabled: false, platform_available: false } });
    return route.fulfill({ status: 404, json: { code: 'not_found', message: 'not found' } });
  });

  await page.goto('/');
  await page.getByLabel('Email').fill('admin@engagefit.test');
  await page.getByLabel('Senha').fill('admin-password');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Administração da plataforma' })).toBeVisible();

  await page.getByRole('button', { name: 'Nova academia' }).click();
  await page.getByLabel('Nome da academia').fill('CrossFit Alados');
  await page.getByLabel('Nome do proprietário').fill('Responsável Alados');
  await page.getByLabel('E-mail do proprietário').fill('owner@alados.test');
  await page.getByLabel('Senha inicial').fill('Owner-Alados-2026!');
  await page.getByLabel('Confirmar senha').fill('Owner-Alados-2026!');
  await page.getByRole('button', { name: 'Criar academia' }).click();
  await expect(page.getByText('Academia e proprietário criados com sucesso')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'CrossFit Alados' })).toBeVisible();

  await page.getByLabel('Motivo da ação').fill('Pausa contratual solicitada');
  await page.getByRole('button', { name: 'Suspender academia' }).click();
  await expect(page.getByText(/Academia suspensa/)).toBeVisible();
  await expect(page.getByText('Suspensa').first()).toBeVisible();
});
