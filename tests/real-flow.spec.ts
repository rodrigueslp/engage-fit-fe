import { expect, test } from '@playwright/test';

test.skip(process.env.E2E_REAL_API !== 'true', 'requires a real local EngageFit API');

test('owner critical flow', async ({ page, request }) => {
  const apiURL = process.env.E2E_API_URL ?? 'http://127.0.0.1:8080';
  const suffix = Date.now();
  const email = `playwright-${suffix}@example.test`;
  const password = 'Playwright-password-2026!';
  const newPassword = 'Playwright-new-password-2026!';
  const setup = await request.post(`${apiURL}/api/v1/setup/owner`, { data: { box_name: 'Playwright Box', owner_name: 'Playwright Owner', owner_email: email, password } });
  expect(setup.status()).toBe(201);

  await page.goto('/');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText(email)).toBeVisible();

  await page.getByRole('button', { name: 'Importações' }).click();
  await page.locator('select').selectOption('totalpass');
  await page.locator('input[type=file]').setInputFiles({ name: 'checkins.csv', mimeType: 'text/csv', buffer: Buffer.from('nome,email,telefone,data,hora\nAluno E2E,aluno-e2e@example.test,+5511999999999,2026-07-20,08:30\n') });
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.getByText('checkins.csv')).toBeVisible();

  await page.getByRole('button', { name: 'Campanhas' }).click();
  await page.getByPlaceholder('Nome da campanha').fill('Campanha E2E');
  await page.getByPlaceholder('Descrição').first().fill('Fluxo Playwright');
  await page.locator('input[type=date]').nth(0).fill('2026-07-01');
  await page.locator('input[type=date]').nth(1).fill('2026-07-31');
  await page.locator('input[type=number]').nth(0).fill('1');
  await page.locator('input[type=number]').nth(1).fill('1');
  await page.getByPlaceholder('Nome do brinde').fill('Brinde E2E');
  await page.getByPlaceholder('Quantidade').fill('10');
  await page.getByRole('button', { name: 'Criar campanha completa' }).click();
  await expect(page.getByText('Campanha E2E').first()).toBeVisible();
  await page.getByRole('button', { name: 'Recalcular' }).first().click();

  await page.getByRole('button', { name: 'Dashboard' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByText('Aluno E2E').first()).toBeVisible();
  await page.getByRole('button', { name: 'Brindes' }).first().click();
  await expect(page.getByText('Brinde E2E').first()).toBeVisible();
  await page.getByRole('button', { name: 'Marcar entregue' }).click();
  await page.locator('select').selectOption('delivered');
  await expect(page.getByText('Entregue', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Alunos' }).click();
  await expect(page.getByText('Aluno E2E')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar' }).click();
  await download;
  await page.locator('tbody select').selectOption('opted_out');
  page.on('dialog', (dialog) => dialog.accept(dialog.type() === 'prompt' ? 'Solicitação do titular E2E' : undefined));
  await page.getByRole('button', { name: 'Anonimizar' }).click();
  await expect(page.getByText('Aluno anonimizado')).toBeVisible();

  await page.getByRole('button', { name: 'Configurações' }).click();
  await page.getByRole('button', { name: /Acesso e segurança/ }).click();
  await page.getByLabel('Senha atual').fill(password);
  await page.getByLabel('Nova senha', { exact: true }).fill(newPassword);
  await page.getByLabel('Confirmar nova senha').fill(newPassword);
  await page.getByRole('button', { name: 'Alterar senha' }).click();
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Senha').fill(newPassword);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText(email)).toBeVisible();
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
});

test('platform admin can access administration and reset an owner password', async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL ?? 'e2e-admin@example.test';
  const password = process.env.E2E_ADMIN_PASSWORD ?? 'E2E-platform-admin-password-2026!';
  await page.goto('/');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('button', { name: 'Administração' })).toBeVisible();
  await page.getByRole('button', { name: 'Acesso' }).click();
  await page.getByLabel('Nova senha', { exact: true }).fill('Owner-reset-by-admin-2026!');
  await page.getByLabel('Confirmar nova senha').fill('Owner-reset-by-admin-2026!');
  await page.getByPlaceholder(/owner confirmou perda de acesso/).fill('Solicitação confirmada no teste E2E');
  await page.getByRole('button', { name: 'Redefinir senha do owner' }).click();
  await expect(page.getByText(/Senha do owner redefinida/)).toBeVisible();
});
