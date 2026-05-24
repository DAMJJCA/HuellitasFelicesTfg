import { expect, test } from '@playwright/test';
import { demoUsers, login } from './auth.helpers';

test('recepcion ve agenda, clientes, disponibilidad y facturacion', async ({ page }) => {
  await login(page, demoUsers.recepcion.email, demoUsers.recepcion.password);
  await expect(page.getByRole('link', { name: /clientes/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /disponibilidad/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /facturacion/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /consultas/i })).toHaveCount(0);
});

test('auxiliar ve documentos y preventivos sin administracion', async ({ page }) => {
  await login(page, demoUsers.auxiliar.email, demoUsers.auxiliar.password);
  await expect(page.getByRole('link', { name: /documentos/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /vacunas/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /clientes/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /facturacion/i })).toHaveCount(0);
});
