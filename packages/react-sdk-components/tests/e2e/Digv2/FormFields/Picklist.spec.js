/* eslint-disable no-template-curly-in-string */
/* eslint-disable no-undef */

const { test, expect } = require('@playwright/test');
import { attachCoverageReport } from 'monocart-reporter';

const config = require('../../../config');
const common = require('../../../common');

// These values represent the data values used for the conditions and are initialised in pyDefault DT
const isDisabled = true;
const isVisible = true;

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1720, height: 1080 });
  await page.goto('http://localhost:3502/portal', { waitUntil: 'networkidle' });
});

test.describe('E2E test', () => {
  let attributes;

  test('should login, create case and run the Email tests', async ({ page }) => {
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

    /** Creating a Form Field case-type */
    const complexFieldsCase = page.locator('div[role="button"]:has-text("Form Field")');
    await complexFieldsCase.click();

    /** Selecting PickList from the Category dropdown */
    const selectedCategory = page.locator('div[data-test-id="76729937a5eb6b0fd88c42581161facd"]');
    await selectedCategory.click();
    await page.getByRole('option', { name: 'PickList' }).click();

    /** Selecting Required from the Sub Category dropdown */
    let selectedSubCategory = page.locator('div[data-test-id="9463d5f18a8924b3200b56efaad63bda"]');
    await selectedSubCategory.click();
    await page.getByRole('option', { name: 'DataPage' }).click();

    /** Dropdown tests */
    let picklistAs = page.locator('div[data-test-id="683ea3aece0dce7e065d31d43f1c269b"]');
    await picklistAs.click();
    await page.getByRole('option', { name: 'Dropdown' }).click();

    let dropdown = page.locator('div[data-test-id="94cb322b7468c7827d336398e525827e"]');
    await dropdown.click();
    await page.getByRole('option', { name: 'Massachusetts' }).click();

    /** Autocomplete tests */
    await picklistAs.click();
    await page.getByRole('option', { name: 'AutoComplete' }).click();

    const autocomplete = page.locator('div[data-test-id="ed90c4ad051fd65a1d9f0930ec4b2276"]');
    await autocomplete.click();
    await page.locator('li:has-text("Colorado")').click();

    /** Radiobutton tests */
    await picklistAs.click();
    await page.getByRole('option', { name: 'RadioButtons' }).click();

    const radiobutton = page.locator('div[role="radiogroup"] >> nth=0');
    const requiredDateInput = radiobutton.locator('label >> nth=0');
    await requiredDateInput.click();

    const radiobutton2 = page.locator('div[role="radiogroup"] >> nth=1');
    const requiredDateInput2 = radiobutton2.locator('label >> nth=1');
    await requiredDateInput2.click();

    await page.locator('button:has-text("submit")').click();
  }, 10000);
});

test.afterEach(async ({ page }) => {
  const coverageData = await page.evaluate(() => window.__coverage__);
  expect(coverageData, 'expect found Istanbul data: __coverage__').toBeTruthy();
  // coverage report
  const report = await attachCoverageReport(coverageData, test.info(), {
    outputDir: './test-reports/e2e/DigV2/FormFields/Picklist'
  });
  console.log(report.summary);
  await page.close();
});
