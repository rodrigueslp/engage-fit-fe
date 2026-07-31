import { expect, test } from '@playwright/test';

test('student starts a consented WhatsApp activation without typing a phone', async ({ page }) => {
  const code = 'fad6fdc4-bb2d-4bdb-b38d-d7ba8c5c1646';
  await page.route(`**/api/v1/public/contact-activation/${code}`, async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        json: {
          box_name: 'CrossFit Alados',
          activation_code: code,
          sender_phone: '5518996710587',
          consent_version: 'whatsapp-engagement-v1',
          consent_text: 'Quero receber mensagens sobre check-ins, metas, brindes e lembretes. Posso cancelar enviando SAIR.',
        },
      });
    }
    const payload = route.request().postDataJSON();
    expect(payload).toEqual({
      name: 'Adriana Segatelli',
      source: 'totalpass',
      recent_checkin_date: '2026-07-29',
      is_new_student: false,
      consent_accepted: true,
    });
    return route.fulfill({
      status: 201,
      json: {
        whatsapp_url: 'https://wa.me/5518996710587?text=Codigo%3A+EF-token',
        expires_at: '2026-07-30T22:00:00Z',
      },
    });
  });

  await page.goto(`/#/activate/${code}`);
  await expect(page.getByRole('heading', { name: 'CrossFit Alados' })).toBeVisible();
  await page.getByText('Já treinei aqui', { exact: true }).click();
  await page.getByLabel('Nome completo').fill('Adriana Segatelli');
  await page.getByText('TotalPass', { exact: true }).click();
  await page.getByLabel('Data de um check-in recente').fill('2026-07-29');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Continuar para o WhatsApp' }).click();

  const confirmation = page.getByRole('link', { name: 'Confirmar pelo WhatsApp' });
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toHaveAttribute('href', /wa\.me\/5518996710587/);
  await expect(page.getByText('Falta só confirmar no WhatsApp')).toBeVisible();
});

test('new student registers on the first visit without previous check-in', async ({ page }) => {
  const code = '1b15c602-1c06-4dd9-bf91-21423391ea93';
  await page.route(`**/api/v1/public/contact-activation/${code}`, async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        json: {
          box_name: 'CrossFit Alados', activation_code: code, sender_phone: '5518996710587',
          consent_version: 'whatsapp-engagement-v1', consent_text: 'Autorizo mensagens da academia. Posso cancelar enviando SAIR.',
        },
      });
    }
    expect(route.request().postDataJSON()).toEqual({
      name: 'Pessoa Nova', source: 'wellhub', is_new_student: true, consent_accepted: true,
    });
    return route.fulfill({
      status: 201,
      json: { whatsapp_url: 'https://wa.me/5518996710587?text=Codigo%3A+EF-token', expires_at: '2026-07-31T22:00:00Z' },
    });
  });

  await page.goto(`/#/activate/${code}`);
  await expect(page.getByText('É meu primeiro treino', { exact: true })).toBeVisible();
  await page.getByLabel('Nome completo').fill('Pessoa Nova');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Continuar para o WhatsApp' }).click();

  await expect(page.getByText('Falta só confirmar seu cadastro')).toBeVisible();
  await expect(page.getByLabel('Data de um check-in recente')).toHaveCount(0);
});
