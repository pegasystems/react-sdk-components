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
  test('should login, create case and run different test cases for Many to Many', async ({
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

    /** Creating a Many to Many case-type */
    const complexFieldsCase = page.locator('div[role="button"]:has-text("Many to Many")');
    await complexFieldsCase.click();

    const ID = "1234";
    const orderID = await page.locator('input[data-test-id="8f2a855dda1f657670e39f50eab1c10e"]');
    await orderID.type(ID);

    const name = "John Doe";
    const customerName = await page.locator('input[data-test-id="2ea989f83006e233627987293f4bde0a"]');
    await customerName.type(name);

    let selectedProduct = await page.locator('tr:has-text("Samsung")');
    const selectedProductTestRow = selectedProduct.locator('input[type="checkbox"]');
    await selectedProductTestRow.click();

    selectedProduct = page.locator('tr:has-text("LG")');
    const selectedProductTestSecondRow = selectedProduct.locator('input[type="checkbox"]');
    await selectedProductTestSecondRow.click();

    selectedProduct = page.locator('tr:has-text("Apple")');
    const selectedProductTestThirdRow = selectedProduct.locator('input[type="checkbox"]');
    await selectedProductTestThirdRow.click();

    await page.locator('button:has-text("submit")').click();

    const assignment = page.locator('div[id="Assignment"]');

    /** Testing the values present on Confirm screen */
    await expect(assignment.locator(`tr:has-text("${ID}") >> nth=0`)).toBeVisible();
    await expect(assignment.locator(`tr:has-text("${name}") >> nth=0`)).toBeVisible();
    await expect(assignment.locator('tr:has-text("Samsung")')).toBeVisible();
    await expect(assignment.locator('tr:has-text("Washing Machine")')).toBeVisible();
    await expect(assignment.locator('tr:has-text("LG")')).toBeVisible();
    await expect(assignment.locator('tr:has-text("Telivision")')).toBeVisible();
    await expect(assignment.locator('tr:has-text("Apple")')).toBeVisible();
    await expect(assignment.locator('tr:has-text("Mobile")')).toBeVisible();


    /** Submitting the case */
    await page.locator('button:has-text("submit")').click();
  }, 10000);
});

test.afterEach(async ({ page }) => {
  const coverageData = await page.evaluate(() => window.__coverage__);
  expect(coverageData, 'expect found Istanbul data: __coverage__').toBeTruthy();
  // coverage report
  const report = await attachCoverageReport(coverageData, test.info(), {
    outputDir: "./test-reports/e2e/DigV2/ComplexFields/DataReference"
  });
  console.log(report.summary);
  await page.close();
});
