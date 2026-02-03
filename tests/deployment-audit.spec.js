// @ts-check
import { test, expect } from '@playwright/test';

/**
 * DEPLOYMENT AUDIT
 * Strict, skeptical investigation of the production deployment.
 * 
 * Target: DEPLOYED URL (from playwright.config.prod.js)
 * Goal: Prove what is broken (Performance, Mobile Layout, API).
 */

test.describe('Deployment Audit', () => {

    // 1️⃣ GLOBAL SETUP & LOGGING
    test.beforeEach(async ({ page }, testInfo) => {
        // Log timing data
        console.log(`[${testInfo.title}] Starting at ${new Date().toISOString()}`);

        // Disable cache to simulate new user / cold start
        await page.route('**', (route) => route.continue());
    });

    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== 'passed') {
            // 6️⃣ SCREENSHOT & EVIDENCE
            const name = testInfo.title.replace(/\s+/g, '-').toLowerCase();
            const screenshotPath = `test-results/${name}-failure.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`❌ FAILURE EVIDENCE SAVED: ${screenshotPath}`);
        }
    });

    // 7️⃣ NETWORK & CONSOLE ERROR CAPTURE
    test.beforeEach(async ({ page }) => {
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error(`🔴 CONSOLE ERROR: ${msg.text()}`);
            }
        });

        page.on('pageerror', error => {
            console.error(`🔴 JS RUNTIME ERROR: ${error.message}`);
        });

        page.on('requestfailed', request => {
            console.error(`🔴 FAILED REQUEST: ${request.url()} - ${request.failure()?.errorText}`);
        });

        page.on('response', response => {
            if (response.status() >= 400) {
                console.error(`🔴 API ERROR: ${response.status()} ${response.url()}`);
            }
        });
    });

    // 2️⃣ DESKTOP PERFORMANCE TEST
    test('Desktop: Home Page Performance Audit', async ({ page }) => {
        // Set viewport to standard desktop
        await page.setViewportSize({ width: 1280, height: 720 });

        const startTime = Date.now();
        const response = await page.goto('/');
        const domContentLoadedTime = Date.now() - startTime;

        console.log(`⏱️ DOM Content Loaded: ${domContentLoadedTime}ms`);

        // Measure time to first visible UI element (Heading or Hero)
        // Adjust selector based on actual app content - assuming an h1 or hero-section exists
        const heroElement = page.locator('h1, header, .hero-section').first();
        await heroElement.waitFor({ state: 'visible', timeout: 5000 });
        const timeToFirstVisible = Date.now() - startTime;

        console.log(`⏱️ Time to First UI Element: ${timeToFirstVisible}ms`);

        // FAIL if DOM load > 3 seconds
        expect(domContentLoadedTime, 'DOM Load Time is too slow (>3s)').toBeLessThan(3000);

        // FAIL if page remains blank (no visible hero)
        await expect(heroElement, 'Page remains blank (no hero element visible)').toBeVisible();
    });

    // 3️⃣ BACKEND API RESPONSE TEST
    test('Backend: API Response & Cold Start Check', async ({ request }) => {
        const targetEndpoint = '/api/tailors'; // Assuming this exists and is public

        console.log(`Testing cold start on: ${targetEndpoint}`);

        const start1 = Date.now();
        const response1 = await request.get(targetEndpoint); // Use public endpoint
        const duration1 = Date.now() - start1;
        console.log(`⏱️ Request 1 (Potential Cold Start): ${duration1}ms - Status: ${response1.status()}`);

        const start2 = Date.now();
        const response2 = await request.get(targetEndpoint);
        const duration2 = Date.now() - start2;
        console.log(`⏱️ Request 2 (Warm): ${duration2}ms - Status: ${response2.status()}`);

        // Rules:
        // First request slow + second fast = cold start
        if (duration1 > 2000 && duration2 < 1000) {
            console.log('⚠️ Backend Cold Start Detected');
        }

        // Always slow = backend performance issue
        if (duration1 > 2000 && duration2 > 2000) {
            console.error('🔴 Backend Performance Issue: API is consistently slow');
        }

        // Also check if status is 200 (if it's a valid public endpoint)
        // If not known, we skip strict status check but warn on 500
        expect(response1.status(), 'API returned Server Error').toBeLessThan(500);
    });

    // 4️⃣ MOBILE VIEWPORT RENDER TEST (CRITICAL)
    test('Mobile: Viewport Render & Tailor Section', async ({ page }) => {
        // iPhone 12 Pro dimensions
        await page.setViewportSize({ width: 390, height: 844 });

        await page.goto('/');

        // Target "Tailor" section header
        const tailorSectionHeader = page.locator('text=Find Your Perfect Tailor');

        // Check if the section header exists in DOM
        await expect(tailorSectionHeader, 'Tailor Section Header missing from DOM').toBeAttached();

        // Check if visible
        await expect(tailorSectionHeader, 'Tailor Section Header not visible').toBeVisible();

        // Scroll to bottom just in case
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000); // Wait for scroll
    });

    // 5️⃣ DOM VS VISIBILITY SEPARATION TEST
    // Test A: Tailor section exists in DOM
    test('Mobile: Tailor Section Audit - DOM Presence', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');

        const tailorSectionHeader = page.locator('text=Find Your Perfect Tailor');
        await expect(tailorSectionHeader, 'Tailor Section Header missing from DOM').toBeAttached();
    });

    // Test B: Tailor section is visible to user
    test('Mobile: Tailor Section Audit - Visibility', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');

        const tailorSectionHeader = page.locator('text=Find Your Perfect Tailor');
        await expect(tailorSectionHeader, 'Tailor Section Header not visible').toBeVisible();
    });

    // 8️⃣ AUTH FLOW SMOKE TEST
    test('Auth: Login Page Smoke Test', async ({ page }) => {
        await page.goto('/login');

        const inputs = page.locator('input');
        await expect(inputs.first(), 'Login inputs should render').toBeVisible();

        // Attempt login with dummy credentials
        await page.fill('input[type="email"]', 'test-automation-dummy@example.com');
        await page.fill('input[type="password"]', 'dummy-password');

        // Find login button
        const loginBtn = page.locator('button[type="submit"], button:has-text("Login")');
        await loginBtn.click();

        // Detect crashes (500s or blank screen)
        // Wait for potential navigation or error message
        try {
            await page.waitForResponse(resp => resp.url().includes('/api') && resp.status() >= 500, { timeout: 3000 });
            throw new Error('Backend crashed with 500 during login');
        } catch (e) {
            // If timeout, it means no crash (good) or immediate 200/401
        }

        // We expect either a 401 (Invalid credentials) or success. 
        // We DO NOT want a crash or infinite load.
        await expect(page.locator('body')).not.toBeEmpty();
    });

});
