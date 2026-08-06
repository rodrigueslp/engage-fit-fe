import { expect, test } from '@playwright/test';

const invitationToken = 'athlete_invitation_token_1234567890abcdef';
const profile = {
  id: 'athlete-1',
  name: 'Maria Silva',
  email: 'maria@example.com',
  email_verified: false,
  memberships: [{ id: 'membership-1', box_id: 'box-1', box_name: 'CrossFit Aurora', joined_at: '2026-08-05T12:00:00Z' }],
};
const workout = {
  id: 'workout-1', box_id: 'box-1', box_name: 'CrossFit Aurora', membership_id: 'membership-1', workout_date: '2026-08-05', title: "Snatch + AMRAP 18'",
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
  personalization: { summary: 'Use seus resultados anteriores como referência.', pacing: 'Comece em ritmo repetível.', guidance: [], generated_by: 'rules-v1' },
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
  await page.getByLabel('Crie uma senha').fill('curta123');
  await expect(page.getByRole('button', { name: /Criar conta e entrar/ })).toBeEnabled();
  await page.getByRole('button', { name: /Criar conta e entrar/ }).click();
  await expect(page.getByRole('alert')).toContainText('Faltam 4 caracteres');
  await page.getByLabel('Crie uma senha').fill('uma-senha-forte');
  await page.getByRole('button', { name: /Criar conta e entrar/ }).click();

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

test('athlete records a result and confirms the detected PR', async ({ page }) => {
  let saved = false; let confirmed = false;
  const record = { id:'pr-1',movement_key:'snatch',movement_name:'Snatch',metric:'load',best_value:62.5,unit:'kg',status:'estimated',source_result_id:'result-1',achieved_at:'2026-08-05T12:00:00Z' };
  const result = { id:'result-1',workout_id:'workout-1',membership_id:'membership-1',scale:'rx',entries:[{section_index:0,section_type:'warmup',movement:'Snatch',score_type:'load',load_kg:62.5}],rpe:8,notes:'Boa técnica',performed_at:'2026-08-05T12:00:00Z',updated_at:'2026-08-05T12:00:00Z' };
  await page.route('**/api/v1/**', async (route) => { const request=route.request();const path=new URL(request.url()).pathname;
    if(path==='/api/v1/athlete/me')return route.fulfill({json:profile});
    if(path==='/api/v1/athlete/workouts')return route.fulfill({json:[{...workout,...(saved?{result}:{})}]});
    if(path==='/api/v1/athlete/personal-records')return route.fulfill({json:saved?[{...record,status:confirmed?'confirmed':'estimated'}]:[]});
    if(path==='/api/v1/athlete/workouts/workout-1/result'&&request.method()==='PUT'){const payload=request.postDataJSON();expect(payload.scale).toBe('rx');expect(payload.entries[0]).toMatchObject({movement:'Snatch',score_type:'load',load_kg:62.5});saved=true;return route.fulfill({json:{result,possible_records:[record]}});}
    if(path==='/api/v1/athlete/personal-records/pr-1/confirm'){confirmed=true;return route.fulfill({status:204,body:''});}
    return route.fulfill({status:404,json:{message:'not found'}});
  });
  await page.goto('/#/athlete');
  await page.getByRole('button',{name:'Registrar meu resultado'}).click();
  await page.getByRole('button',{name:'RX',exact:true}).click();
  await page.getByRole('dialog').getByRole('combobox').nth(1).selectOption('load');
  await page.getByLabel('Carga em kg').fill('62.5');
  await page.getByLabel(/Observações/).fill('Boa técnica');
  await page.getByRole('button',{name:'Salvar no meu histórico'}).click();
  await expect(page.getByText('1 possível PR encontrado')).toBeVisible();
  await page.getByRole('button',{name:'PRs',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Snatch'})).toBeVisible();
  await page.getByRole('button',{name:'Confirmar como meu PR'}).click();
  await expect(page.getByText('PR confirmado por você')).toBeVisible();
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
