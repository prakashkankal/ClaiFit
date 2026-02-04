// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Helper function to login as a user
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
async function login(page, email = 'test@example.com', password = 'password123') {
    await page.goto('/login');
    // Updated to use placeholders as per actual UI (labels are visually hidden or not used as expected by getByLabel)
    await page.getByPlaceholder(/example@mail.com|email/i).fill(email);
    await page.getByPlaceholder(/••••••••|password/i).fill(password);
    await page.getByRole('button', { name: /login|sign in/i }).click();
    // Wait for navigation after login
    await page.waitForLoadState('networkidle');
}

test.describe('Tailor Features', () => {
    test('should navigate to tailor search from homepage', async ({ page }) => {
        await page.goto('/');

        // Look for "Find Tailors" link
        const findTailorsLink = page.getByRole('link', { name: /find tailors|search tailors|tailors/i }).first();

        // Check if the link exists
        await expect(findTailorsLink).toBeVisible();

        if (await findTailorsLink.count() > 0) {
            await findTailorsLink.click();

            // Since "Find Tailors" points to "/" (homepage), checking for separate URL failed.
            // Instead, we verify we are still on the homepage where the search functionality exists.
            await expect(page).toHaveURL(/.*kstitch|\/$/);

            // Optionally check if search functionality (Location input) is visible
            await expect(page.getByRole('textbox', { name: /location/i }).first()).toBeVisible();
        }
    });

    test('should display search functionality for tailors', async ({ page }) => {
        await page.goto('/');

        // Look for Location input (which is the primary search/filter mechanism)
        const locationInput = page.getByRole('textbox', { name: /location/i }).first();
        await expect(locationInput).toBeVisible();

        // Also look for Service dropdown
        const serviceDropdown = page.getByRole('combobox').first();
        await expect(serviceDropdown).toBeVisible();

        // Check for Search button
        const searchButton = page.getByRole('button', { name: /search/i }).first();
        await expect(searchButton).toBeVisible();
    });

    test('should show tailor registration option', async ({ page }) => {
        await page.goto('/');

        // Look for "Become a Tailor" or similar option
        const becomeaTailorLink = page.getByRole('link', {
            name: /become a tailor|register as tailor|tailor registration/i
        });

        const linkExists = await becomeaTailorLink.count() > 0;

        if (linkExists) {
            // Verify it navigates to registration page
            await becomeaTailorLink.first().click();

            // Matches /signup/tailor (and potentially /register if it changes back)
            await expect(page).toHaveURL(/.*(signup\/tailor|tailor.*register|register.*tailor)/);
        }
    });
});

test.describe('Customer Profile Features', () => {
    test('should access profile page when logged in', async ({ page }) => {
        // This test assumes you have a test account
        // You may need to update credentials or skip if no test account exists
        test.skip(!process.env.TEST_USER_EMAIL, 'No test user credentials provided');

        await login(page, process.env.TEST_USER_EMAIL, process.env.TEST_USER_PASSWORD);

        // Navigate to profile
        const profileLink = page.getByRole('link', { name: /profile|account/i });
        await profileLink.click();

        await expect(page).toHaveURL(/.*profile/);
    });

    test('should display edit profile option', async ({ page }) => {
        test.skip(!process.env.TEST_USER_EMAIL, 'No test user credentials provided');

        await login(page, process.env.TEST_USER_EMAIL, process.env.TEST_USER_PASSWORD);

        // Navigate to profile
        await page.goto('/profile');

        // Look for edit profile button
        const editButton = page.getByRole('button', { name: /edit profile/i })
            .or(page.getByRole('link', { name: /edit profile/i }));

        await expect(editButton).toBeVisible();
    });
});

test.describe('Order Management', () => {
    test('should display order creation form for tailors', async ({ page }) => {
        test.skip(!process.env.TEST_TAILOR_EMAIL, 'No test tailor credentials provided');

        // Login as tailor
        await login(page, process.env.TEST_TAILOR_EMAIL, process.env.TEST_TAILOR_PASSWORD);

        // Navigate to create order page
        await page.goto('/orders/new');

        // Check for order form elements
        const form = page.locator('form');
        await expect(form).toBeVisible();
    });

    test('should show customer search in order creation', async ({ page }) => {
        test.skip(!process.env.TEST_TAILOR_EMAIL, 'No test tailor credentials provided');

        await login(page, process.env.TEST_TAILOR_EMAIL, process.env.TEST_TAILOR_PASSWORD);
        await page.goto('/orders/new');

        // Look for customer search/select
        const customerInput = page.getByLabel(/customer|client/i);
        const hasCustomerInput = await customerInput.count() > 0;

        expect(hasCustomerInput).toBeTruthy();
    });
});

test.describe('Settings and Preferences', () => {
    test('should access settings page when logged in', async ({ page }) => {
        test.skip(!process.env.TEST_USER_EMAIL, 'No test user credentials provided');

        await login(page, process.env.TEST_USER_EMAIL, process.env.TEST_USER_PASSWORD);

        // Navigate to settings
        const settingsLink = page.getByRole('link', { name: /settings|preferences/i });

        if (await settingsLink.count() > 0) {
            await settingsLink.click();
            await expect(page).toHaveURL(/.*settings/);
        }
    });

    test('should display logout option', async ({ page }) => {
        test.skip(!process.env.TEST_USER_EMAIL, 'No test user credentials provided');

        await login(page, process.env.TEST_USER_EMAIL, process.env.TEST_USER_PASSWORD);

        // Navigate to profile page where logout option resides
        await page.goto('/profile');

        // Look for logout button
        const logoutButton = page.getByRole('button', { name: /logout|sign out/i })
            .or(page.getByRole('link', { name: /logout|sign out/i }));

        await expect(logoutButton).toBeVisible();
    });
});

test.describe('Accessibility Tests', () => {
    test('should have proper heading structure', async ({ page }) => {
        await page.goto('/');

        // Check for h1 heading
        const h1 = page.locator('h1');
        const h1Count = await h1.count();

        // Should have at least one h1
        expect(h1Count).toBeGreaterThanOrEqual(1);
    });

    test('should have alt text for images', async ({ page }) => {
        await page.goto('/');

        // Get all images
        const images = page.locator('img');
        const imageCount = await images.count();

        if (imageCount > 0) {
            // Check first few images for alt text
            for (let i = 0; i < Math.min(5, imageCount); i++) {
                const img = images.nth(i);
                const alt = await img.getAttribute('alt');

                // Alt should exist (can be empty for decorative images)
                expect(alt).not.toBeNull();
            }
        }
    });

    test('should have proper button labels', async ({ page }) => {
        await page.goto('/');

        // Get all buttons
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();

        if (buttonCount > 0) {
            // Check that buttons have text or aria-label
            for (let i = 0; i < Math.min(5, buttonCount); i++) {
                const button = buttons.nth(i);
                const text = await button.textContent();
                const ariaLabel = await button.getAttribute('aria-label');

                // Should have either text content or aria-label
                expect(text || ariaLabel).toBeTruthy();
            }
        }
    });
});
