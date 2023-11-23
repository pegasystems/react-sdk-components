/* eslint-disable no-template-curly-in-string */
/* eslint-disable no-undef */

const { test, expect } = require('@playwright/test');

const config = require('../../../config');
const common = require('../../../common');

test.beforeEach(common.launchPortal);

test.describe('E2E test', () => {
  test('should login, create case and run different test cases for My Work landing page', async ({ page }) => {
    await common.login(config.config.apps.digv2.user.username, config.config.apps.digv2.user.password, page);

    /** Testing announcement banner presence */
    const announcementBanner = page.locator('h6:has-text("Announcements")');
    await expect(announcementBanner).toBeVisible();

    /** Testing worklist presence */
    const worklist = page.locator('h6:has-text("My Worklist")');
    await expect(worklist).toBeVisible();

    /** Creating a View Templates case-type */
    const viewTemplatesCase = page.locator('div[role="button"]:has-text("View Templates")');
    await viewTemplatesCase.click();

    /** Extract caseID from CaseView */
    const caseID = await page.locator('#caseId').textContent();

    /** Click on the `MyWork` landing page */
    const myWorkLandingPage = page.locator('div[role="button"]:has-text("My Work")');
    await myWorkLandingPage.click();

    await page.locator('input[id="search"]').type(caseID);

    await page.locator(`button:has-text("${caseID}")`).click();

    /** Testing that the Case View has rendered */
    expect(await page.locator('div[id="current-caseID"]').textContent()).toBe(`DXIL-DIGV2-WORK ${caseID}`);

    /** Testing that the Assignment has opened */
    expect(page.locator('div[id="APP/PRIMARY_1/WORKAREA"]')).toBeVisible();
  }, 10000),
    test('should login, create case and come back to Home landing page and run tests', async ({ page }) => {
      await common.login(config.config.apps.digv2.user.username, config.config.apps.digv2.user.password, page);

      /** Testing announcement banner presence */
      const announcementBanner = page.locator('h6:has-text("Announcements")');
      await expect(announcementBanner).toBeVisible();

      /** Testing worklist presence */
      const worklist = page.locator('h6:has-text("My Worklist")');
      await expect(worklist).toBeVisible();

      /** Creating a View Templates case-type */
      const viewTemplatesCase = page.locator('div[role="button"]:has-text("View Templates")');
      await viewTemplatesCase.click();

      /** Click on the `Home` landing page */
      const homeLandingPage = page.locator('div[role="button"]:has-text("Home")');
      await homeLandingPage.click();

      /** Test whether Home has loaded as expected */
      await expect(announcementBanner).toBeVisible();

      await expect(worklist).toBeVisible();
    }, 10000);
});

const outputDir = './test-reports/e2e/DigV2/LandingPages/LandingPages';
test.afterEach(async ({ page }) => await common.calculateCoverage(page, outputDir));
