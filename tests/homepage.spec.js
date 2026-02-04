// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Homepage Tests', () => {
    test('should load the homepage successfully', async ({ page }) => {
        await page.goto('/');

        // Check if the page loads with the correct branding
        await expect(page).toHaveTitle(/KStitch/);
    });

    test('should display the main navigation', async ({ page }) => {
        await page.goto('/');

        // Check for navigation elements
        // We have multiple navs (mobile/desktop), so we check if at least one is visible
        const navs = page.locator('nav');
        // Find the one that is actually visible currently
        await expect(navs.locator('visible=true').first()).toBeVisible();
    });

    test('should have login and signup options', async ({ page }) => {
        await page.goto('/');

        // Look for login/signup buttons or links
        // These selectors should match your actual implementation
        const loginButton = page.getByRole('link', { name: /login/i });
        const signupButton = page.getByRole('link', { name: /sign up|register/i });

        // At least one should be visible
        const loginVisible = await loginButton.isVisible().catch(() => false);
        const signupVisible = await signupButton.isVisible().catch(() => false);

        expect(loginVisible || signupVisible).toBeTruthy();
    });

    test('should display search functionality', async ({ page }) => {
        await page.goto('/');

        // Look for search input or search button
        // Look for actual search elements from your homepage (Location/Service)
        const locationInput = page.getByRole('textbox', { name: /location/i }).first();
        const serviceDropdown = page.getByRole('combobox').first();
        const searchButton = page.getByRole('button', { name: /search/i }).first();

        // Check if any of these are visible
        const isSearchVisible = await Promise.race([
            locationInput.isVisible().catch(() => false),
            serviceDropdown.isVisible().catch(() => false),
            searchButton.isVisible().catch(() => false)
        ]);

        expect(isSearchVisible).toBeTruthy();
    });
});
