const { test, expect } = require('@playwright/test');
import { attachCoverageReport } from 'monocart-reporter';

const { config } = require('./config');

const launchPortal = async ({ page }) => {
  await page.setViewportSize({ width: 1720, height: 1080 });
  await page.goto(`${config.baseUrl}/portal`, { waitUntil: 'networkidle' });
};

const launchEmbedded = async ({ page }) => {
  await page.setViewportSize({ width: 1720, height: 1080 });
  await page.goto(`${config.baseUrl}/embedded`, { waitUntil: 'networkidle' });
};

const launchSelfServicePortal = async ({ page }) => {
  await page.setViewportSize({ width: 1720, height: 1080 });
  await page.goto(`${config.baseUrl}/portal?portal=DigV2SelfService`, {
    waitUntil: 'networkidle'
  });
};

const login = async (username, password, page) => {
  await page.locator('input[id="txtUserID"]').fill(username);
  await page.locator('input[id="txtPassword"]').fill(password);
  await page.locator('#submit_row .loginButton').click();
};

const getAttributes = async element => {
  const attributes = await element.evaluate(async ele => ele.getAttributeNames());
  return attributes;
};

const getFormattedDate = date => {
  if (!date) {
    return date;
  }
  const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getFullYear()}`;
  return formattedDate;
};

const getFutureDate = () => {
  const today = new Date();
  // const theLocale = Intl.DateTimeFormat().resolvedOptions().locale;
  // add 2 days to today
  const futureDate = new Date(today.setDate(today.getDate() + 2));
  // Need to get leading zeroes on single digit months and 4 digit year
  const formattedFuturedate = getFormattedDate(futureDate);
  return formattedFuturedate;
};

const calculateCoverage = async (page, outputDir) => {
  const coverageData = await page.evaluate(() => window.__coverage__);
  expect(coverageData, 'expect found Istanbul data: __coverage__').toBeTruthy();
  // coverage report
  await attachCoverageReport(coverageData, test.info(), {
    outputDir
  });
  await page.close();
};

module.exports = {
  launchPortal,
  launchEmbedded,
  launchSelfServicePortal,
  login,
  getAttributes,
  getFutureDate,
  calculateCoverage
};
