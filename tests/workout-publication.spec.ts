import { expect, test } from '@playwright/test';

const workoutText = `WARM UP

Passagem Técnica com PVC para Snatch

SKILL - Snatch

Achar a maior carga do Dia para 1 Snatch

WORKOUT OF THE DAY

AMRAP 18'

90 Double Unders
30 Dumbbell Snatches
6 Wall Walks`;

test('owner publishes a free-text workout without approval or student selection', async ({ page, context }) => {
  const appURL = `http://127.0.0.1:${process.env.E2E_FRONTEND_PORT ?? '5174'}`;
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/v1/capabilities') return route.fulfill({ json: { whatsapp: true, email: false, automation: false, workouts: true, llm: true, billing: false } });
    if (path === '/api/v1/auth/me') return route.fulfill({ json: { id: 'owner-1', box_id: 'box-1', name: 'Owner', email: 'owner@test.local', role: 'OWNER' } });
    if (path === '/api/v1/box') return route.fulfill({ json: { id: 'box-1', name: 'CrossFit Teste' } });
    if (path === '/api/v1/workouts' && request.method() === 'GET') return route.fulfill({ json: [] });
    if (path === '/api/v1/workouts' && request.method() === 'POST') {
      expect(request.postDataJSON()).toMatchObject({ raw_text: workoutText, status: 'published', title: '' });
      return route.fulfill({ status: 201, json: {
        id: 'workout-1',
        workout_date: '2026-08-05',
        title: "Snatch + AMRAP 18'",
        goal: '',
        movements: workoutText,
        coach_notes: '',
        raw_text: workoutText,
        status: 'published',
        classification: {
          version: 'rules-v1',
          generated_by: 'rules',
          suggested_title: "Snatch + AMRAP 18'",
          formats: ['amrap', 'max_effort'],
          duration_seconds: 1080,
          movement_mentions: ['Snatch', 'Double Unders', 'Dumbbell Snatches', 'Wall Walks'],
          sections: [
            { type: 'warmup', title: 'WARM UP', content: 'Passagem Técnica com PVC para Snatch' },
            { type: 'skill', title: 'SKILL - Snatch', content: 'Achar a maior carga do Dia para 1 Snatch' },
            { type: 'wod', title: 'WORKOUT OF THE DAY', content: "AMRAP 18'\n\n90 Double Unders\n30 Dumbbell Snatches\n6 Wall Walks" },
          ],
        },
        created_at: '2026-08-05T22:00:00Z',
        updated_at: '2026-08-05T22:00:00Z',
      } });
    }
    return route.fulfill({ status: 404, json: { code: 'not_found', message: 'not found' } });
  });

  await context.addCookies([
    { name: 'engagefit_session', value: 'owner-session', url: appURL, httpOnly: true, sameSite: 'Lax' },
    { name: 'engagefit_session_csrf', value: 'csrf', url: appURL, sameSite: 'Lax' },
  ]);
  await page.goto('/#/workouts');

  await expect(page.getByText('Data, texto e publicar. Não há formulário técnico nem etapa de aprovação.')).toBeVisible();
  await page.locator('input[type="date"]').fill('2026-08-05');
  await page.locator('textarea').fill(workoutText);
  await page.getByRole('button', { name: 'Publicar treino' }).last().click();

  await expect(page.getByText('Treino publicado e organizado automaticamente. Nenhuma aprovação adicional é necessária.')).toBeVisible();
  await expect(page.getByRole('heading', { name: "Snatch + AMRAP 18'" })).toBeVisible();
  await expect(page.getByText('AMRAP', { exact: true })).toBeVisible();
  await expect(page.getByText('Workout of the day', { exact: true })).toBeVisible();
});
