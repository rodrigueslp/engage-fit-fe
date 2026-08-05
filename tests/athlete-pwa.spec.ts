import { expect, test } from '@playwright/test';

const invitationToken = 'athlete_invitation_token_1234567890abcdef';
const profile = {
  id: 'athlete-1',
  name: 'Maria Silva',
  email: 'maria@example.com',
  memberships: [{ id: 'membership-1', box_id: 'box-1', box_name: 'CrossFit Aurora', joined_at: '2026-08-05T12:00:00Z' }],
};
const workout = {
  id: 'workout-1', box_id: 'box-1', box_name: 'CrossFit Aurora', workout_date: '2026-08-05', title: "Snatch + AMRAP 18'",
  goal: '', movements: 'Snatch, Double Unders, Dumbbell Snatches, Wall Walks', coach_notes: '', raw_text: 'WARM UP\n\nPassagem Técnica\n\nWORKOUT OF THE DAY\n\nAMRAP 18\'\n90 Double Unders', status: 'published',
  classification: {
    version: 'rules-v1', generated_by: 'rules', suggested_title: "Snatch + AMRAP 18'", formats: ['amrap', 'max_effort'], duration_seconds: 1080,
    movement_mentions: ['Snatch', 'Double Unders'],
    sections: [
      { type: 'warmup', title: 'WARM UP', content: 'Passagem Técnica com PVC para Snatch' },
      { type: 'skill', title: 'SKILL - Snatch', content: 'Achar a maior carga do dia para 1 Snatch' },
      { type: 'wod', title: 'WORKOUT OF THE DAY', content: "AMRAP 18'\n\n90 Double Unders\n30 Dumbbell Snatches\n6 Wall Walks" },
    ],
  },
  created_at: '2026-08-05T12:00:00Z', updated_at: '2026-08-05T12:00:00Z',
};

test('athlete claims an invitation and gets a fluid mobile workout experience', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === `/api/v1/athlete/invitations/${invitationToken}` && request.method() === 'GET') {
      return route.fulfill({ json: { box_name: 'CrossFit Aurora', student_name: 'Maria Silva', expires_at: '2026-08-12T12:00:00Z' } });
    }
    if (path === `/api/v1/athlete/invitations/${invitationToken}/claim` && request.method() === 'POST') {
      expect(request.postDataJSON()).toEqual({ name: 'Maria Silva', email: 'maria@example.com', password: 'uma-senha-forte' });
      return route.fulfill({ status: 201, json: profile });
    }
    if (path === '/api/v1/athlete/workouts') return route.fulfill({ json: [workout] });
    if (path === '/api/v1/athlete/me') return route.fulfill({ json: profile });
    return route.fulfill({ status: 404, json: { message: 'not found' } });
  });

  await page.goto(`/#/athlete/invite/${invitationToken}`);
  await expect(page.getByRole('heading', { name: 'Seu treino começa antes da aula.' })).toBeVisible();
  await expect(page.getByText('CrossFit Aurora', { exact: true })).toBeVisible();
  await page.getByLabel('E-mail').fill('maria@example.com');
  await page.getByLabel('Crie uma senha').fill('uma-senha-forte');
  await page.getByRole('button', { name: /Entrar no meu box/ }).click();

  await expect(page).toHaveURL(/#\/athlete$/);
  await expect(page.getByText(/(Bom dia|Boa tarde|Boa noite), Maria/)).toBeVisible();
  await expect(page.getByRole('heading', { name: "Snatch + AMRAP 18'" })).toBeVisible();
  await expect(page.getByText('Workout of the day', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Histórico' }).click();
  await expect(page.getByRole('heading', { name: 'Treinos publicados' })).toBeVisible();
  await page.getByRole('button', { name: 'Perfil', exact: true }).click();
  await expect(page.getByText('maria@example.com')).toBeVisible();
  await expect(page.getByText('Vínculo ativo')).toBeVisible();
});

test('production manifest describes an installable standalone athlete app', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest');
  expect(response.ok()).toBeTruthy();
  const manifest = await response.json();
  expect(manifest).toMatchObject({ name: 'EngageFit Aluno', start_url: '/#/athlete', display: 'standalone', theme_color: '#071426' });
});

test('owner creates a student app invitation with one action', async ({ page, context }) => {
  const appURL = `http://127.0.0.1:${process.env.E2E_FRONTEND_PORT ?? '5174'}`;
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/v1/capabilities') return route.fulfill({ json: { whatsapp: true, email: false, automation: false, workouts: true, llm: true, billing: false } });
    if (path === '/api/v1/auth/me') return route.fulfill({ json: { id: 'owner-1', box_id: 'box-1', name: 'Owner', email: 'owner@example.com', role: 'OWNER' } });
    if (path === '/api/v1/box') return route.fulfill({ json: { id: 'box-1', name: 'CrossFit Aurora' } });
    if (path === '/api/v1/students' && request.method() === 'GET') return route.fulfill({ json: [{ id: 'student-1', box_id: 'box-1', name: 'Maria Silva', email: 'maria@example.com', phone: '11999999999', source: 'box_member', contact_status: 'opted_in' }] });
    if (path === '/api/v1/students/student-1/athlete-invitations' && request.method() === 'POST') return route.fulfill({ status: 201, json: { token: invitationToken, expires_at: '2026-08-12T12:00:00Z' } });
    return route.fulfill({ status: 404, json: { message: 'not found' } });
  });
  await context.addCookies([{ name: 'engagefit_session', value: 'owner-session', url: appURL, httpOnly: true, sameSite: 'Lax' }]);

  await page.goto('/#/students');
  await page.getByRole('button', { name: 'Convidar' }).click();
  await expect(page.getByRole('heading', { name: 'Convite pronto para Maria Silva' })).toBeVisible();
  await expect(page.getByText(`/#/athlete/invite/${invitationToken}`, { exact: false })).toBeVisible();
  await expect(page.getByText('sem nenhuma ação do coach', { exact: false })).toBeVisible();
});
