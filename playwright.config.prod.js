// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for PRODUCTION/DEPLOYED testing
 * Tests run against your live Vercel deployment
 * 
 * Usage: npm run test:prod
 */
export default defineConfig({
    testDir: './tests',

    /* Run tests in files in parallel */
    fullyParallel: true,

    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,

    /* Retry failed tests - production can be flaky due to network */
    retries: 2,

    /* Run with fewer workers for production testing */
    workers: 2,

    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'html',

    /* Timeout for each test - production can be slower */
    timeout: 60000, // 60 seconds (vs 30s default)

    /* Global timeout for the entire test run */
    globalTimeout: 600000, // 10 minutes

    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL - YOUR DEPLOYED VERCEL URL */
        baseURL: process.env.PROD_URL || 'https://kstitch.vercel.app',

        /* Collect trace when retrying the failed test */
        trace: 'retain-on-failure',

        /* Screenshot on failure */
        screenshot: 'only-on-failure',

        /* Video on failure */
        video: 'retain-on-failure',

        /* Navigation timeout */
        navigationTimeout: 30000,

        /* Action timeout */
        actionTimeout: 15000,
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    /* NO webServer - we're testing the DEPLOYED site */
    // webServer is commented out because we test the live site
});
