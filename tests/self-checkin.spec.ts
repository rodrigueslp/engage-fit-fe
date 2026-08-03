import { expect, test } from '@playwright/test';

test('activated box member records attendance from a short-lived QR session', async ({ page }) => {
  const token = 'uX9YpQ4T7Vw2Za6Bc8De0Fg1Hi3Jk5Lm7No9Pq2Rs4T';
  await page.route(`**/api/v1/public/self-checkin/${token}`, async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: { box_name: 'CrossFit Alados', expires_at: '2026-08-03T23:59:00Z' } });
    }
    expect(route.request().postDataJSON()).toEqual({ name: 'Maria Mensalista', phone: '(11) 99999-9999' });
    return route.fulfill({ json: { student_id: 'student-box-1', student_name: 'Maria Mensalista', checkin_date: '2026-08-03', already_recorded: false } });
  });

  await page.goto(`/#/checkin/${token}`);
  await expect(page.getByRole('heading', { name: 'CrossFit Alados' })).toBeVisible();
  await page.getByLabel('Nome completo').fill('Maria Mensalista');
  await page.getByLabel('WhatsApp cadastrado').fill('(11) 99999-9999');
  await page.getByRole('button', { name: 'Confirmar presença' }).click();

  await expect(page.getByRole('heading', { name: 'Check-in registrado!' })).toBeVisible();
  await expect(page.getByText(/conta para frequência, campanhas e brindes/)).toBeVisible();
});
