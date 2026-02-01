import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/login');
  // Ajusta esto según el título real de tu app
  await expect(page).toHaveTitle(/Restaurante POS|Login/);
});

test('admin login flow (ui check)', async ({ page }) => {
  await page.goto('/login');
  
  // Verificar que los campos de login existen
  await expect(page.getByPlaceholder(/email/i)).toBeVisible();
  await expect(page.getByPlaceholder(/contraseña/i)).toBeVisible();
});
