/* eslint-disable no-template-curly-in-string */
/* eslint-disable no-undef */

const { test, expect } = require('@playwright/test');
import { attachCoverageReport } from 'monocart-reporter';

const config = require('../../../config');
const common = require('../../../common');

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1720, height: 1080 });
  await page.goto('http://localhost:3502/portal', { waitUntil: 'networkidle' });
});

test.describe('E2E test', () => {
  test('should login, create case and run different test cases for RichText', async ({
    page
  }) => {
    await common.Login(
      config.config.apps.digv2.user.username,
      config.config.apps.digv2.user.password,
      page
    );

    /** Testing announcement banner presence */
    const announcementBanner = page.locator('h6:has-text("Announcements")');
    await expect(announcementBanner).toBeVisible();

    /** Testing worklist presence */
    const worklist = page.locator('h6:has-text("My Worklist")');
    await expect(worklist).toBeVisible();

    /** Creating a RichText Editor case-type */
    const complexFieldsCase = page.locator('div[role="button"]:has-text("RichText Editor")');
    await complexFieldsCase.click();

    const instructionText = page.locator('div[id="instruction-text"]');

    const heading = instructionText.locator('h1:has-text("Heading 1")');
    await expect(heading).toBeVisible();

    const link = instructionText.locator('a:has-text("Hyperlink")');
    await expect(link).toBeVisible();

    const italicText = instructionText.locator('em:has-text("Italic text")');
    await expect(italicText).toBeVisible();

    const boldText = instructionText.locator('strong:has-text("Bold text")');
    await expect(boldText).toBeVisible();

    const listItem = instructionText.locator('li:has-text("India")');
    await expect(listItem).toBeVisible();

    const image = instructionText.locator('img');
    await expect(image).toBeDefined();

    const table = instructionText.locator('table');
    await expect(table).toBeDefined();

    /** Submitting the case */
    await page.locator('button:has-text("submit")').click();
  }, 10000);
});

test.afterEach(async ({ page }) => {
  const coverageData = await page.evaluate(() => window.__coverage__);
  expect(coverageData, 'expect found Istanbul data: __coverage__').toBeTruthy();
  // coverage report
  const report = await attachCoverageReport(coverageData, test.info(), {
    outputDir: "./test-reports/e2e/DigV2/ComplexFields/RichText"
  });
  console.log(report.summary);
  await page.close();
});
