import { expect, test } from '@playwright/test';
import { demoUsers, login } from './auth.helpers';

test('recepcion puede abrir facturacion y ver formulario de nueva factura', async ({ page }) => {
  await login(page, demoUsers.recepcion.email, demoUsers.recepcion.password);
  await page.getByRole('link', { name: /facturacion/i }).click();
  await expect(page.getByRole('heading', { name: /facturacion/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /crear factura/i })).toBeVisible();
  await expect(page.getByLabel(/iva/i)).toBeVisible();
  await expect(page.getByLabel(/descuento/i)).toBeVisible();
});
