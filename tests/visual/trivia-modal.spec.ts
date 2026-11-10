import { test, expect, Page } from '@playwright/test';

const MOCK_CHALLENGE = {
  data: {
    results: [
      {
        id: '1009368',
        name: 'Iron Man',
        title: 'Iron Man',
        description:
          'Wounded, captured and forced to build a weapon by his enemies, billionaire industrialist Tony Stark created an advanced suit of armor.',
        thumbnail: {
          path: 'http://i.annihil.us/u/prod/marvel/i/mg/9/c0/527bb7b37ff55',
          extension: 'jpg'
        },
        clues: [
          'Billionaire industrialist and genius inventor',
          'Founding member of the Avengers',
          'Powered by an Arc Reactor in his chest'
        ]
      }
    ],
    count: 1
  }
};

async function authenticateAsGuest(page: Page) {
  await page.goto('/?test_auth=true');
  await page.waitForURL('**/gallery', { timeout: 10000 });
}

test.describe('Visual Regression: Trivia & Guessing Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/gallery/marvel*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CHALLENGE)
      });
    });

    await page.route('**/gallery/random*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CHALLENGE.data.results[0])
      });
    });
  });

  test('Trivia Play Mode card and clue interaction', async ({ page }) => {
    await authenticateAsGuest(page);

    // Toggle Play Mode
    const playToggle = page.locator('mat-slide-toggle');
    await expect(playToggle).toBeVisible();
    await playToggle.click();

    // Wait for the trivia game board to appear
    const gameCard = page.locator('mat-card.mat-card-container');
    await expect(gameCard).toBeVisible();

    // Normalize height across OS font engines to guarantee 0-jitter dimensions
    await page.addStyleTag({
      content: 'mat-card.mat-card-container { height: 612px !important; }'
    });

    // Take snapshot of game card
    await expect(gameCard).toHaveScreenshot('trivia-game-board.png');
  });
});
