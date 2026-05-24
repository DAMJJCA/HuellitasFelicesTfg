import { Page, expect } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: /email|correo/i }).fill(email);
  await page.getByLabel(/contrase|password/i).fill(password);
  await page.getByRole('button', { name: /entrar|iniciar|login/i }).click();
  await expect(page).toHaveURL(/dashboard|citas|mascotas/);
}

export const demoUsers = {
  admin: { email: 'admin@huellitas.local', password: '123456' },
  recepcion: { email: 'recepcion@huellitas.local', password: '123456' },
  auxiliar: { email: 'auxiliar@huellitas.local', password: '123456' }
};
