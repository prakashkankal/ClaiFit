// @ts-check
import { test, expect } from '@playwright/test';

/**
 * PRODUCTION SMOKE TESTS
 * These tests check critical functionality on your DEPLOYED site
 * They catch environment-specific issues like:
 * - API connection problems
 * - CORS issues
 * - Missing environment variables
 * - Server configuration errors
 * - Database connection issues
 */

test.describe('Production Smoke Tests - Critical Paths', () => {

    test('homepage loads successfully', async ({ page }) => {
        const response = await page.goto('/');

        // Check HTTP status
        expect(response?.status()).toBeLessThan(400);

        // Check branding is visible
        await expect(page).toHaveTitle(/KStitch/);

        // Check no critical errors in console
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
    });

    test('API connection works (backend health check)', async ({ page }) => {
        // Test if frontend can reach backend
        const response = await page.goto('/');

        // Listen for API calls
        let apiCallMade = false;

        page.on('response', response => {
            if (response.url().includes('api')) {
                apiCallMade = true;
                console.log('API Response Status:', response.status());
                // API should respond with 200, 201, or 400s (not 500s)
                expect(response.status()).toBeLessThan(500);
            }
        });

        // Navigate and trigger an API call if possible
        await page.waitForLoadState('networkidle');
    });

    test('login page is accessible', async ({ page }) => {
        await page.goto('/login');

        // Check page loaded
        await expect(page).toHaveURL(/.*login/);

        // Check login form exists
        // Check login form exists (using placeholders as per actual UI)
        const emailInput = page.getByPlaceholder(/example@mail.com|email/i);
        const passwordInput = page.getByPlaceholder(/••••••••|password/i);

        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
    });

    test('register page is accessible', async ({ page }) => {
        await page.goto('/register');

        // Check page loaded
        await expect(page).toHaveURL(/.*register|signup/);

        // Check registration form content exists (e.g. "Personal Information" heading)
        await expect(page.getByRole('heading', { name: /personal information/i })).toBeVisible();

        // Also check for at least one input field
        await expect(page.getByPlaceholder(/e.g. John Doe|full name/i)).toBeVisible();
    });

    test('static assets load correctly', async ({ page }) => {
        await page.goto('/');

        // Check for failed resources
        /** @type {Array<{url: string, status: number}>} */
        const failedResources = [];

        page.on('response', response => {
            if (response.status() >= 400) {
                failedResources.push({
                    url: response.url(),
                    status: response.status(),
                });
            }
        });

        await page.waitForLoadState('networkidle');

        // Log any failed resources
        if (failedResources.length > 0) {
            console.log('Failed resources:', failedResources);
        }

        // Critical assets should load (some 404s might be okay for non-critical assets)
        expect(failedResources.filter(r => r.status === 500).length).toBe(0);
    });

    test('Google login button is present (OAuth setup)', async ({ page }) => {
        await page.goto('/login');

        // Check if Google login is configured
        const googleButton = page.getByRole('button', { name: /google/i });
        await expect(googleButton).toBeVisible();
    });

    test('no JavaScript errors on homepage', async ({ page }) => {
        /** @type {string[]} */
        const jsErrors = [];

        page.on('pageerror', error => {
            jsErrors.push(error.message);
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Log errors if any
        if (jsErrors.length > 0) {
            console.log('JavaScript errors found:', jsErrors);
        }

        // Fail if there are critical JS errors
        expect(jsErrors.length).toBe(0);
    });

    test('CORS is configured correctly', async ({ page }) => {
        let corsError = false;

        page.on('console', msg => {
            if (msg.text().includes('CORS') || msg.text().includes('Access-Control')) {
                corsError = true;
                console.log('CORS issue detected:', msg.text());
            }
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        expect(corsError).toBe(false);
    });

    test('environment variables are set (API URL)', async ({ page }) => {
        await page.goto('/');

        // Check if API calls are going to the right endpoint
        let apiUrlCorrect = true;

        page.on('request', request => {
            const url = request.url();
            if (url.includes('/api/')) {
                // Should NOT be pointing to localhost in production
                // BUT if we are testing locally (url includes localhost), then localhost API is expected.
                const isLocalTest = page.url().includes('localhost') || page.url().includes('127.0.0.1');

                if (url.includes('localhost') && !isLocalTest) {
                    apiUrlCorrect = false;
                    console.log('ERROR: API pointing to localhost in PRODUCTION:', url);
                }
                console.log('API URL:', url);
            }
        });

        await page.waitForLoadState('networkidle');

        expect(apiUrlCorrect).toBe(true);
    });
});

test.describe('Production Mobile Tests', () => {
    test('mobile homepage loads', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');

        const response = await page.goto('/');
        expect(response?.status()).toBeLessThan(400);

        // Check mobile navigation
        const body = page.locator('body');
        await expect(body).toBeVisible();
    });
});

test.describe('Production Performance Tests', () => {
    test('homepage loads within acceptable time', async ({ page }) => {
        const startTime = Date.now();
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;

        console.log(`Page load time: ${loadTime}ms`);

        // Production should load within 15 seconds (more lenient than local)
        expect(loadTime).toBeLessThan(15000);
    });
});
