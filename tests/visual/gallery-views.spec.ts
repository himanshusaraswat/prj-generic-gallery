import { test, expect, Page } from '@playwright/test';

// Deterministic mock payload for visual baseline stability
const MOCK_MARVEL_HEROES = {
  data: {
    results: [
      {
        id: '1009368',
        name: 'Iron Man',
        title: 'Iron Man',
        thumbnail: {
          path: 'http://i.annihil.us/u/prod/marvel/i/mg/9/c0/527bb7b37ff55',
          extension: 'jpg'
        }
      },
      {
        id: '1009610',
        name: 'Spider-Man',
        title: 'Spider-Man',
        thumbnail: {
          path: 'http://i.annihil.us/u/prod/marvel/i/mg/3/50/526548a343e4b',
          extension: 'jpg'
        }
      },
      {
        id: '1009664',
        name: 'Thor',
        title: 'Thor',
        thumbnail: {
          path: 'http://i.annihil.us/u/prod/marvel/i/mg/d/d0/5269657a74350',
          extension: 'jpg'
        }
      }
    ],
    count: 3
  }
};

const MOCK_NFL_PLAYERS = {
  data: {
    results: [
      {
        id: 'nfl-1',
        name: 'Patrick Mahomes',
        title: 'Patrick Mahomes',
        image: 'https://static.www.nfl.com/image/private/t_player_profile_landscape/f_auto/league/v4x47e19e078'
      },
      {
        id: 'nfl-2',
        name: 'Travis Kelce',
        title: 'Travis Kelce',
        image: 'https://static.www.nfl.com/image/private/t_player_profile_landscape/f_auto/league/kelce'
      }
    ],
    count: 2
  }
};

async function authenticateAsGuest(page: Page) {
  await page.goto('/?test_auth=true');
  await page.waitForURL('**/gallery', { timeout: 10000 });
}

test.describe('Visual Regression: Gallery & Themes', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept API calls to provide rock-solid deterministic data
    await page.route('**/gallery/marvel*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_MARVEL_HEROES)
      });
    });

    await page.route('**/gallery/nfl*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_NFL_PLAYERS)
      });
    });
  });

  test('Sign-in landing page and action buttons', async ({ page }) => {
    await page.goto('/');
    const authCard = page.locator('.auth-card');
    await expect(authCard).toBeVisible();
    await expect(authCard).toHaveScreenshot('sign-in-page.png');
  });

  test('Sign-in landing page toggles to NFL theme and logo', async ({ page }) => {
    await page.goto('/');
    const nflTab = page.locator('button.nav-link', { hasText: 'NFL Rosters' });
    await expect(nflTab).toBeVisible();
    await nflTab.click();

    const nflLogo = page.locator('.brand-avatar.nfl-avatar');
    await expect(nflLogo).toBeVisible();
    const showcase = page.locator('.showcase-container');
    await expect(showcase).toHaveScreenshot('sign-in-page-nfl.png');
  });

  test('Marvel Gallery header and category navigation', async ({ page }) => {
    await authenticateAsGuest(page);

    // Wait for the app header to render
    const header = page.locator('.app-header');
    await expect(header).toBeVisible();
    await expect(header).toHaveScreenshot('marvel-header.png');

    // Snapshot category pills
    const pills = page.locator('.category-pills-wrapper');
    await expect(pills).toBeVisible();
    await expect(pills).toHaveScreenshot('category-pills-marvel-active.png');

    // Snapshot search bar
    const searchBar = page.locator('.search-bar-container');
    await expect(searchBar).toBeVisible();
    await expect(searchBar).toHaveScreenshot('search-bar-default.png');
  });

  test('NFL Gallery theme and category pill transition', async ({ page }) => {
    await authenticateAsGuest(page);

    // Click NFL Players pill
    const nflPill = page.locator('button.category-pill-btn', { hasText: 'NFL Players' });
    await expect(nflPill).toBeVisible();
    await nflPill.click();

    // Verify NFL logo is active in header
    const nflLogo = page.locator('.brand-header-logo.nfl-logo');
    await expect(nflLogo).toBeVisible();

    // Snapshot header with NFL branding
    const header = page.locator('.app-header');
    await expect(header).toHaveScreenshot('nfl-header.png');

    // Snapshot category pills with NFL active
    const pills = page.locator('.category-pills-wrapper');
    await expect(pills).toHaveScreenshot('category-pills-nfl-active.png');
  });

  test('Search input focus and active query state', async ({ page }) => {
    await authenticateAsGuest(page);

    const searchInput = page.locator('.search-input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Spider-Man');

    const searchBar = page.locator('.search-bar-container');
    await expect(searchBar).toHaveScreenshot('search-bar-active-query.png');
  });
});
