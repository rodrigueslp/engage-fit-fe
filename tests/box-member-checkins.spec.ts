import { expect, test } from '@playwright/test';

test('owner records a box member manually and generates a short-lived QR', async ({ page, context }) => {
  const appURL = `http://127.0.0.1:${process.env.E2E_FRONTEND_PORT ?? '5174'}`;
  let hasCheckin = false;
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/v1/capabilities') return route.fulfill({ json: { whatsapp: true, email: false, automation: false, workouts: false, llm: false, billing: false } });
    if (path === '/api/v1/auth/me') return route.fulfill({ json: { id: 'owner-1', box_id: 'box-1', name: 'Owner', email: 'owner@test.local', role: 'OWNER' } });
    if (path === '/api/v1/box') return route.fulfill({ json: { id: 'box-1', name: 'CrossFit Teste' } });
    if (path === '/api/v1/students') return route.fulfill({ json: [{ id: 'member-1', name: 'Maria Mensalista', email: '', phone: '5511999999999', source: 'box_member', external_id: 'self-registration:member-1', contact_status: 'opted_in' }] });
    if (path === '/api/v1/checkins/summary') return route.fulfill({ json: hasCheckin ? [{ student_id: 'member-1', student_name: 'Maria Mensalista', student_phone: '5511999999999', source: 'box_member', checkins: 1, first_checkin: '2026-08-03', last_checkin: '2026-08-03' }] : [] });
    if (path === '/api/v1/students/member-1/checkins/manual') {
      expect(request.method()).toBe('POST');
      expect(request.postDataJSON()).toMatchObject({ date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) });
      hasCheckin = true;
      return route.fulfill({ json: { student_id: 'member-1', checkin_date: '2026-08-03', already_recorded: false } });
    }
    if (path === '/api/v1/self-checkin-sessions') return route.fulfill({ status: 201, json: { token: 'uX9YpQ4T7Vw2Za6Bc8De0Fg1Hi3Jk5Lm7No9Pq2Rs4T', expires_at: '2026-08-03T23:59:00Z' } });
    return route.fulfill({ status: 404, json: { code: 'not_found', message: 'not found' } });
  });

  await context.addCookies([
    { name: 'engagefit_session', value: 'owner-session', url: appURL, httpOnly: true, sameSite: 'Lax' },
    { name: 'engagefit_session_csrf', value: 'csrf', url: appURL, sameSite: 'Lax' },
  ]);
  await page.goto('/#/checkins');

  await expect(page.getByRole('heading', { name: 'Check-in manual — plano da academia' })).toBeVisible();
  await page.getByLabel('Aluno').selectOption('member-1');
  await page.getByRole('button', { name: 'Registrar', exact: true }).click();
  await expect(page.getByText('Check-in manual registrado e campanhas recalculadas.')).toBeVisible();
  await expect(page.getByText('Maria Mensalista', { exact: true }).last()).toBeVisible();
  await expect(page.getByText('Plano da academia', { exact: true }).last()).toBeVisible();

  await page.getByRole('button', { name: 'Gerar QR de check-in' }).click();
  await expect(page.getByText(/Válido até/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gerar novo QR' })).toBeVisible();
});
