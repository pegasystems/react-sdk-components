const { test, expect } = require('@playwright/test');

const config = require('../../../config');
const common = require('../../../common');

// These values represent the data values used for the conditions and are initialised in pyDefault DT
const isDisabled = true;
const isVisible = true;

test.beforeEach(common.launchPortal);

test.describe('E2E test', () => {
  let attributes;

  test('should login, create case and run the Email tests', async ({ page }) => {
    await common.login(config.config.apps.digv2.user.username, config.config.apps.digv2.user.password, page);

    /** Testing announcement banner presence */
    const announcementBanner = page.locator('h6:has-text("Announcements")');
    await expect(announcementBanner).toBeVisible();

    /** Testing worklist presence */
    const worklist = page.locator('h6:has-text("My Worklist")');
    await expect(worklist).toBeVisible();

    /** Creating a Form Field case-type */
    const complexFieldsCase = page.locator('div[role="button"]:has-text("Form Field")');
    await complexFieldsCase.click();

    const actions = page.locator('button:has-text("Actions...")');
    await actions.click();

    await page.locator('li[role="menuitem"]:has-text("Multi Step Test")').click();

    let input = page.locator('input[data-test-id="8ca45623e49263849b3bf9f67c03999f"]');
    await input.fill('John Doe');

    await page.locator('button:has-text("Next")').click();

    input = page.locator('input[data-test-id="a45879b4fd9831ffbd28fcc759f051a1"]');
    await input.fill('John@doe.com');

    await page.locator('button:has-text("Submit")').click();

    await page.locator('button[id="go-btn"]').click();

    const selectedCategory = page.locator('div[data-test-id="76729937a5eb6b0fd88c42581161facd"]');
    await selectedCategory.click();
  }, 10000);
});

const outputDir = './test-reports/e2e/DigV2/FormFields/Email';
test.afterEach(async ({ page }) => await common.calculateCoverage(page, outputDir));
