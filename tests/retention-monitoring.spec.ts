import { expect, test } from '@playwright/test';

test('separates historical inactivity and lets the box exclude and restore a visitor', async ({ page, context }) => {
  const appURL = `http://127.0.0.1:${process.env.E2E_FRONTEND_PORT ?? '5174'}`;
  let excluded = false;
  const operational = {
    student_id: 'student-current', student_name: 'Visitante Atual', student_phone: '', source: 'totalpass', contact_status: 'unknown',
    level: 'at_risk', first_checkin: '2026-05-01', last_checkin: '2026-07-22', days_since_checkin: 9,
    total_checkins: 8, recent_checkins: 1, previous_checkins: 5, recent_weekly_average: 0.25, previous_weekly_average: 1.25,
    drop_percentage: 80, signals: [{ code: 'inactive_days', message: 'Está há vários dias sem registrar presença.' }],
    return_within_3_days: false, return_within_7_days: false, return_within_14_days: false,
    retention_monitoring_status: 'monitored', workflow_status: 'needs_action',
    recommendation: { code: 'check_context', title: 'Entender o contexto', message: 'Confirme a mudança de rotina.' },
  };
  const historical = {
    ...operational, student_id: 'student-historical', student_name: 'Inativo Antigo', last_checkin: '2026-06-20', days_since_checkin: 41,
    level: 'critical', workflow_status: 'historical', recommendation: { code: 'historical_reactivation', title: 'Tratar como reativação', message: 'Revise o vínculo.' },
  };

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/v1/capabilities') return route.fulfill({ json: { whatsapp: true, email: false, automation: true, workouts: false, llm: false, billing: true } });
    if (path === '/api/v1/auth/me') return route.fulfill({ json: { id: 'owner-1', box_id: 'box-1', name: 'Owner', email: 'owner@test.local', role: 'OWNER' } });
    if (path === '/api/v1/box') return route.fulfill({ json: { id: 'box-1', name: 'Academia Teste' } });
    if (path === '/api/v1/dashboard/summary') return route.fulfill({ json: { total_students: 2, total_checkins: 20, eligible_students: 0, near_goal_students: 0, pending_rewards: 0, delivered_rewards: 0, checkins_by_platform: {} } });
    if (path === '/api/v1/dashboard/active-campaigns' || path === '/api/v1/dashboard/near-goal-students' || path === '/api/v1/dashboard/pending-rewards') return route.fulfill({ json: [] });
    if (path === '/api/v1/retention/radar') return route.fulfill({ json: [
      excluded ? { ...operational, retention_monitoring_status: 'excluded', retention_exclusion_reason: 'visitor', workflow_status: 'excluded', recommendation: { code: 'retention_excluded', title: 'Fora do monitoramento', message: 'Dados preservados.' } } : operational,
      historical,
    ] });
    if (path === '/api/v1/retention/onboarding') return route.fulfill({ json: [] });
    if (path === '/api/v1/retention/summary') return route.fulfill({ json: { period_start: '2026-07-01', period_end: '2026-07-31', needs_action: excluded ? 0 : 1, waiting_return: 0, follow_up_due: 0, recovered: 0, historical_inactive: 1, excluded: excluded ? 1 : 0, completed_interventions: 0, return_within_3_days: 0, return_within_7_days: 0, return_within_14_days: 0, median_days_to_return: null, reasons: [], channels: [], outcomes: [] } });
    if (path === '/api/v1/retention/rules') return route.fulfill({ json: { recent_start: '2026-07-04', recent_end: '2026-07-31', previous_start: '2026-06-06', previous_end: '2026-07-03', history_required_before: '2026-06-05', history_days: 56, minimum_total_checkins: 4, minimum_previous_checkins: 4, attention_inactive_days: 5, at_risk_inactive_days: 7, critical_inactive_days: 14, attention_drop_percentage: 25, at_risk_drop_percentage: 50, critical_drop_percentage: 75, operational_inactive_days: 30, baseline_at: '2026-07-31' } });
    if (path === '/api/v1/team/members') return route.fulfill({ json: [] });
    if (path === '/api/v1/students/student-current/retention-monitoring' && request.method() === 'PATCH') {
      const payload = request.postDataJSON();
      excluded = payload.status === 'excluded';
      expect(payload.reason).toBe(excluded ? 'visitor' : undefined);
      return route.fulfill({ status: 204, body: '' });
    }
    return route.fulfill({ status: 404, json: { code: 'not_found', message: 'not found' } });
  });

  await context.addCookies([{ name: 'engagefit_session', value: 'owner-session', url: appURL, httpOnly: true, sameSite: 'Lax' }]);
  await page.goto('/');
  await page.getByRole('button', { name: 'Retenção' }).click();

  await expect(page.getByRole('button', { name: 'Precisa de ação (1)' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Inativos históricos (1)' })).toBeVisible();
  await page.getByRole('button', { name: 'Inativos históricos (1)' }).click();
  await expect(page.getByText('Inativo Antigo')).toBeVisible();

  await page.getByRole('button', { name: 'Precisa de ação (1)' }).click();
  await page.getByRole('button', { name: 'Não acompanhar' }).click();
  await expect(page.getByText('Os dados não serão apagados.')).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar exclusão' }).click();

  await expect(page.getByRole('button', { name: 'Não acompanhados (1)' })).toBeVisible();
  await page.getByRole('button', { name: 'Não acompanhados (1)' }).click();
  await expect(page.getByText('Motivo: Visitante ou drop-in · sem prazo')).toBeVisible();
  await page.getByRole('button', { name: 'Voltar a acompanhar' }).click();
  await page.getByRole('button', { name: 'Voltar a acompanhar' }).last().click();
  await expect(page.getByRole('button', { name: 'Precisa de ação (1)' })).toBeVisible();
});
