import { expect, test } from '@playwright/test';

test('owner can create a plan student or discard a review without candidates', async ({ page, context }) => {
  const appURL = `http://127.0.0.1:${process.env.E2E_FRONTEND_PORT ?? '5174'}`;
  let activations = [
    { id: 'activation-create', claimed_name: 'Marcio Estevans', source: 'box_member', recent_checkin_date: '2026-08-03T00:00:00Z', phone: '5511999995471', status: 'needs_review', is_new_student: false, expires_at: '2026-08-03T23:00:00Z', created_at: '2026-08-03T20:00:00Z' },
    { id: 'activation-discard', claimed_name: 'Solicitação Incorreta', source: 'box_member', recent_checkin_date: '2026-08-03T00:00:00Z', phone: '5511999991111', status: 'needs_review', is_new_student: false, expires_at: '2026-08-03T23:00:00Z', created_at: '2026-08-03T20:01:00Z' },
  ];
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/v1/capabilities') return route.fulfill({ json: { whatsapp: true, email: false, automation: false, workouts: false, llm: false, billing: false } });
    if (path === '/api/v1/auth/me') return route.fulfill({ json: { id: 'owner-1', box_id: 'box-1', name: 'Owner', email: 'owner@test.local', role: 'OWNER' } });
    if (path === '/api/v1/box') return route.fulfill({ json: { id: 'box-1', name: 'CrossFit Teste' } });
    if (path === '/api/v1/dashboard/summary') return route.fulfill({ json: { total_students: 0, total_checkins: 0, eligible_students: 0, near_goal_students: 0, pending_rewards: 0, delivered_rewards: 0, checkins_by_platform: {} } });
    if (path === '/api/v1/dashboard/active-campaigns' || path === '/api/v1/dashboard/near-goal-students' || path === '/api/v1/dashboard/pending-rewards' || path === '/api/v1/retention/radar' || path === '/api/v1/retention/onboarding') return route.fulfill({ json: [] });
    if (path === '/api/v1/students') return route.fulfill({ json: [] });
    if (path === '/api/v1/contact-activations/summary') return route.fulfill({ json: { total_students: 0, with_phone: 0, opted_in: 0, opted_out: 0, pending_review: activations.length, pending_sync: 0, awaiting_message: 0, activation_code: 'code-1', sender_phone: '5511999999999', whatsapp_ready: true } });
    if (path === '/api/v1/contact-activations') return route.fulfill({ json: activations });
    if (path === '/api/v1/contact-activations/activation-create/create-student') {
      expect(request.method()).toBe('POST');
      activations = activations.filter((item) => item.id !== 'activation-create');
      return route.fulfill({ status: 201, json: { id: 'activation-create', claimed_name: 'Marcio Estevans', student_id: 'student-1', student_name: 'Marcio Estevans', source: 'box_member', status: 'confirmed' } });
    }
    if (path === '/api/v1/contact-activations/activation-discard/cancel') {
      expect(request.method()).toBe('POST');
      activations = activations.filter((item) => item.id !== 'activation-discard');
      return route.fulfill({ json: { id: 'activation-discard', claimed_name: 'Solicitação Incorreta', source: 'box_member', status: 'cancelled' } });
    }
    return route.fulfill({ status: 404, json: { code: 'not_found', message: `not found ${path}` } });
  });
  await context.addCookies([
    { name: 'engagefit_session', value: 'owner-session', url: appURL, httpOnly: true, sameSite: 'Lax' },
    { name: 'engagefit_session_csrf', value: 'csrf', url: appURL, sameSite: 'Lax' },
  ]);
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('/');
  await page.getByRole('button', { name: 'Ativação WhatsApp' }).click();

  await expect(page.getByText('Nenhum cadastro de Plano da academia foi encontrado para vincular.')).toHaveCount(2);
  await page.getByRole('button', { name: 'Criar novo cadastro' }).first().click();
  await expect(page.getByText('Cadastro de Marcio Estevans criado e ativado com sucesso.')).toBeVisible();
  await expect(page.getByText('Marcio Estevans', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Descartar solicitação' }).click();
  await expect(page.getByText('Solicitação de Solicitação Incorreta descartada.')).toBeVisible();
  await expect(page.getByText('Nenhum vínculo aguardando revisão.')).toBeVisible();
});
