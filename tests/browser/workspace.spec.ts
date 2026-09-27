import { test, expect } from '@playwright/test';

test('navigation, votes, setlist conflicts, notes and download validation', async ({
  context,
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Repertorio Band' }),
  ).toBeVisible();
  await page.evaluate(() =>
    localStorage.setItem('band_active_member_name', 'Chiara'),
  );
  await page.goto('/votazione');
  await expect(
    page.getByRole('heading', { name: 'Repertorio', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: /^Vota 3 stelle/ })
    .first()
    .click();
  await expect(
    page.getByRole('button', { name: /^Vota 3 stelle/ }).first(),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(
    page.getByRole('button', { name: /^Vota 3 stelle/ }).first(),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/scaletta');
  await expect(page.getByText('La scaletta è vuota.')).toBeVisible();
  const other = await context.newPage();
  await other.goto('/scaletta');
  await expect(other.getByText('La scaletta è vuota.')).toBeVisible();
  await page
    .getByRole('button', { name: /^Aggiungi .+ alla scaletta$/ })
    .first()
    .click();
  await expect(page.locator('ol li')).toHaveCount(1);
  await other
    .getByRole('button', { name: /^Aggiungi .+ alla scaletta$/ })
    .nth(1)
    .click();
  await expect(other.locator('main').getByRole('alert')).toContainText(
    'modificata da un altro membro',
  );
  await other.getByRole('button', { name: 'Ricarica', exact: true }).click();
  await expect(other.locator('ol li')).toHaveCount(1);
  await page
    .getByRole('button', { name: /^Aggiungi .+ alla scaletta$/ })
    .first()
    .click();
  await expect(page.locator('ol li')).toHaveCount(2);
  const firstTitle = await page.locator('ol li p').first().textContent();
  await page
    .getByRole('button', { name: /^Sposta giù/ })
    .first()
    .click();
  await expect(page.locator('ol li').last()).toContainText(firstTitle!);
  await page.reload();
  await expect(page.locator('ol li')).toHaveCount(2);

  await page.goto('/note');
  await page.getByRole('button', { name: 'Nuova nota', exact: true }).click();
  await page.getByLabel('Titolo', { exact: true }).fill('Prova venerdì');
  await page
    .getByLabel('Testo', { exact: true })
    .fill('Attacco insieme, poi ritornello.');
  await page
    .getByRole('combobox', { name: 'Brano', exact: true })
    .selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Salva nota' }).click();
  await expect(page.getByRole('article')).toContainText('Prova venerdì');
  await other.goto('/note');
  await expect(other.getByRole('article')).toContainText('Attacco insieme');
  await page.getByRole('button', { name: 'Modifica Prova venerdì' }).click();
  await page.getByLabel('Testo', { exact: true }).fill('Nuovo arrangiamento');
  await page.getByRole('button', { name: 'Salva nota' }).click();
  await expect(page.getByRole('article')).toContainText('Nuovo arrangiamento');
  await page.screenshot({
    path: '/tmp/band-notes-populated.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Elimina Prova venerdì' }).click();
  await page.getByRole('button', { name: 'Annulla', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.getByRole('button', { name: 'Elimina Prova venerdì' }).click();
  await page.getByRole('button', { name: 'Conferma eliminazione' }).click();
  await expect(page.getByRole('article')).toHaveCount(0);

  await page.goto('/download-mp3');
  await page.getByLabel('Link YouTube').fill('https://example.com/video');
  await page.getByRole('button', { name: 'Converti in MP3' }).click();
  await expect(page.locator('main').getByRole('alert')).toContainText(
    'link valido',
  );
  const invalid = await page.request.post('/api/download-mp3', {
    data: { url: 'http://localhost:1234/' },
  });
  expect(invalid.status()).toBe(400);
});

test('download result, filename and cancellation states', async ({ page }) => {
  await page.goto('/download-mp3');
  await page.route('**/api/download-mp3', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'audio/mpeg',
      headers: {
        'Content-Disposition': "attachment; filename*=UTF-8''Prova%20band.mp3",
      },
      body: Buffer.from('audio-fixture'),
    }),
  );
  await page.getByLabel('Link YouTube').fill('https://youtu.be/BaW_jenozKc');
  await page.getByRole('button', { name: 'Converti in MP3' }).click();
  await expect(page.getByRole('heading', { name: 'MP3 pronto' })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Scarica MP3' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('Prova band.mp3');
  await page.unroute('**/api/download-mp3');
  let pending: import('@playwright/test').Route | undefined;
  await page.route('**/api/download-mp3', (route) => {
    pending = route;
  });
  await page.getByRole('button', { name: 'Converti in MP3' }).click();
  await expect(
    page.getByRole('button', { name: 'Annulla', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Annulla', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Conversione annullata.');
  await expect(
    page.getByRole('button', { name: 'Converti in MP3' }),
  ).toBeEnabled();
  await pending?.abort();
});

test('all routes fit mobile and desktop without horizontal overflow', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() =>
    localStorage.setItem('band_active_member_name', 'Chiara'),
  );
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      '/',
      '/votazione',
      '/scaletta',
      '/note',
      '/download-mp3',
    ]) {
      await page.goto(route);
      await expect(
        page.getByRole('navigation', { name: 'Navigazione principale' }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (width === 390 || width === 1280)
        await page.screenshot({
          path: `/tmp/band-${width}-${route.replaceAll('/', '') || 'home'}.png`,
          fullPage: true,
        });
    }
  }
});
