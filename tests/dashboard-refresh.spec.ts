import { expect, test } from '@playwright/test';

test('owner dashboard prioritizes retention, onboarding and goals without legacy billing or risk messaging', async ({ page, context }) => {
  const appURL = `http://127.0.0.1:${process.env.E2E_FRONTEND_PORT ?? '5174'}`;
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/v1/capabilities') return route.fulfill({ json: { whatsapp: true, email: false, automation: true, workouts: false, llm: false, billing: true } });
    if (path === '/api/v1/auth/login') return route.fulfill({ json: { access_token: 'unused' } });
    if (path === '/api/v1/auth/me') return route.fulfill({ json: { id: 'owner-1', box_id: 'box-1', name: 'Owner', email: 'owner@test.local', role: 'OWNER' } });
    if (path === '/api/v1/box') return route.fulfill({ json: { id: 'box-1', name: 'Academia Teste' } });
    if (path === '/api/v1/dashboard/summary') return route.fulfill({ json: { total_students: 24, total_checkins: 91, eligible_students: 5, near_goal_students: 2, pending_rewards: 1, delivered_rewards: 4, checkins_by_platform: {} } });
    if (path === '/api/v1/dashboard/active-campaigns') return route.fulfill({ json: [{ id: 'campaign-1', name: 'Meta de agosto', description: '', start_date: '2026-08-01', end_date: '2026-08-31', active: true }] });
    if (path === '/api/v1/dashboard/near-goal-students') return route.fulfill({ json: [{ id: 'student-1', name: 'Ana Quase Lá', email: '', phone: '5511999999999', source: 'wellhub', external_id: 'ana', contact_status: 'opted_in' }] });
    if (path === '/api/v1/dashboard/pending-rewards') return route.fulfill({ json: [{ id: 'delivery-1', reward_id: 'reward-1', reward_name: 'Camiseta', student_id: 'student-2', student_name: 'Bruno Meta', delivered: false, created_at: '2026-07-31T12:00:00Z' }] });
    if (path === '/api/v1/retention/radar') return route.fulfill({ json: [{ student_id: 'student-3', student_name: 'Carla Retenção', student_phone: '', source: 'totalpass', contact_status: 'unknown', level: 'attention', total_checkins: 5, recent_checkins: 1, previous_checkins: 4, recent_weekly_average: 0.25, previous_weekly_average: 1, signals: [], return_within_3_days: false, return_within_7_days: false, return_within_14_days: false, workflow_status: 'needs_action', recommendation: { code: 'contact', title: 'Entender a mudança', message: 'Converse com a aluna.' } }] });
    if (path === '/api/v1/retention/onboarding') return route.fulfill({ json: [
      { student_id: 'student-4', student_name: 'Diego Novo', student_phone: '', source: 'wellhub', contact_status: 'unknown', membership_started_at: '2026-07-30', membership_started_source: 'self_registration', membership_start_confidence: 'confirmed', observation_days_before_start: 0, day: 2, checkins_first_7_days: 0, checkins_first_14_days: 0, checkins_first_30_days: 0, status: 'no_first_visit', status_message: 'Ainda não fez a primeira visita.', recommendation: { code: 'welcome', title: 'Recepcionar', message: 'Ajude no primeiro treino.' } },
      { student_id: 'student-5', student_name: 'Elisa no Caminho', student_phone: '', source: 'totalpass', contact_status: 'unknown', membership_started_at: '2026-07-20', membership_started_source: 'first_checkin_inferred', membership_start_confidence: 'probable', observation_days_before_start: 60, day: 12, checkins_first_7_days: 3, checkins_first_14_days: 5, checkins_first_30_days: 5, status: 'on_track', status_message: 'Frequência inicial consistente.', recommendation: { code: 'observe', title: 'Acompanhar', message: 'Continue observando.' } },
    ] });
    if (path === '/api/v1/whatsapp-settings') return route.fulfill({ json: { id: 'settings-1', box_id: 'box-1', connection_mode: 'platform', provider: 'twilio', base_url: '', instance_name: '', has_api_key: false, enabled: false, platform_available: true, platform_sender: '5511999999999' } });
    return route.fulfill({ status: 404, json: { code: 'not_found', message: 'not found' } });
  });

  await context.addCookies([{ name: 'engagefit_session', value: 'owner-session', url: appURL, httpOnly: true, sameSite: 'Lax' }]);
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Prioridades de hoje' })).toBeVisible();
  await expect(page.getByText('Ações de retenção')).toBeVisible();
  await expect(page.getByText('Primeiros 30 dias')).toBeVisible();
  await expect(page.getByText('Carla Retenção')).toBeVisible();
  await expect(page.getByText('Diego Novo')).toBeVisible();
  await expect(page.getByText('Elisa no Caminho')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Plano e cobranças' })).toHaveCount(0);
  await expect(page.getByText('Alunos em risco')).toHaveCount(0);

  await page.getByRole('button', { name: 'Configurações' }).click();
  await expect(page.getByRole('button', { name: /Acesso e segurança/ })).toBeVisible();
  await expect(page.getByText('Alunos em risco')).toHaveCount(0);
});
