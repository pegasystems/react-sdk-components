const { test, expect } = require('@playwright/test');

const config = require('../../../config');
const common = require('../../../common');

const outputDir = './test-reports/e2e/DigV2/ViewTemplates/HierarchicalForm';

const testData = {
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '01/01/1990',
  email: 'john.doe@example.com',
  phone: '6175551212',
  city: 'Cambridge',
  state: 'Massachusetts',
  country: 'USA',
  additionalNotes: 'Please review onboarding details carefully.'
};

const tabByName = (page, name) => page.getByRole('tab', { name: new RegExp(name, 'i') });
const submitButton = page => page.locator('button:has-text("submit")');
const reviewDetailsHeader = page => page.locator('#assignment-header h6:has-text("Review Details")');

const fillBasicDetails = async page => {
  await page
    .getByLabel(/First Name/i)
    .first()
    .fill(testData.firstName);
  await page
    .getByLabel(/Last Name/i)
    .first()
    .fill(testData.lastName);
  await page
    .getByLabel(/Date of Birth/i)
    .first()
    .fill(testData.dateOfBirth);
  await page.getByLabel(/Email/i).first().fill(testData.email);
  await page.getByLabel(/Phone/i).first().fill(testData.phone);
};

const fillAddressDetails = async page => {
  await page.getByLabel(/City/i).first().fill(testData.city);
  await page.getByLabel(/State/i).first().fill(testData.state);
  await page
    .getByLabel(/Country/i)
    .first()
    .fill(testData.country);
};

const fillReviewDetails = async page => {
  await page
    .getByLabel(/Additional Notes/i)
    .first()
    .fill(testData.additionalNotes);
  await page.getByRole('checkbox', { name: /Accept terms and condition/i }).check();
};

const assertReadOnlyReviewValues = async page => {
  const reviewAssignment = page.locator('div[id="Assignment"]');
  const readOnlyInputByLabel = labelText =>
    reviewAssignment.locator(`xpath=.//label[contains(normalize-space(), "${labelText}")]/following::input[1]`);
  const readOnlyTextAreaByLabel = labelText =>
    reviewAssignment.locator(`xpath=.//label[contains(normalize-space(), "${labelText}")]/following::textarea[1]`);
  const readOnlyDateOfBirth = reviewAssignment.getByLabel(/Date of birth/i).first();

  await expect(readOnlyInputByLabel('First Name')).toHaveValue(testData.firstName);
  await expect(readOnlyInputByLabel('First Name')).toBeDisabled();
  await expect(readOnlyInputByLabel('Last Name')).toHaveValue(testData.lastName);
  await expect(readOnlyDateOfBirth).toHaveValue(testData.dateOfBirth);
  await expect(readOnlyDateOfBirth).toBeDisabled();
  await expect(readOnlyInputByLabel('Email')).toHaveValue(testData.email);
  await expect(readOnlyInputByLabel('Phone')).toHaveValue(/617|5551212|1212/);
  await expect(readOnlyInputByLabel('City')).toHaveValue(testData.city);
  await expect(readOnlyInputByLabel('State')).toHaveValue(testData.state);
  await expect(readOnlyInputByLabel('Country')).toHaveValue(testData.country);
  await expect(readOnlyTextAreaByLabel('Additional Notes')).toHaveValue(testData.additionalNotes);
};

test.beforeEach(common.launchPortal);

test.describe('E2E test', () => {
  test('should validate hierarchical form tab error routing, badge counts and tab persistence on reopen', async ({ page }) => {
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

    const caseID = (await page.locator('#caseId').textContent())?.trim();

    /** Selecting Hierarchical Form from the Category dropdown */
    const selectedCategory = page.locator('div[data-test-id="76729937a5eb6b0fd88c42581161facd"]');
    await selectedCategory.click();
    await page.getByRole('option', { name: 'Hierarchical Form' }).click();

    /** Open the Hierarchical Form assignment */
    await submitButton(page).click();

    const basicDetailsTab = tabByName(page, 'Basic Details');
    const addressTab = tabByName(page, 'Address');
    const reviewTab = tabByName(page, 'Review');

    await expect(basicDetailsTab).toBeVisible();
    await expect(addressTab).toBeVisible();
    await expect(reviewTab).toBeVisible();

    /** Scenario 1: if multiple tabs have errors, first error tab should open and submit should be prevented */
    await reviewTab.click();
    await expect(reviewTab).toHaveAttribute('aria-selected', 'true');

    await submitButton(page).click();

    await expect(basicDetailsTab).toHaveAttribute('aria-selected', 'true');
    await expect(reviewDetailsHeader(page)).toHaveCount(0);

    /** Scenario 2: errored tabs should show red badge and error count */
    const basicBadge = basicDetailsTab.locator('.MuiBadge-badge');
    const addressBadge = addressTab.locator('.MuiBadge-badge');
    const reviewBadge = reviewTab.locator('.MuiBadge-badge');

    await expect(basicBadge).toHaveText('1');
    await expect(addressBadge).toHaveText('1');
    await expect(reviewBadge).toHaveText('1');

    await expect(basicBadge).toHaveClass(/MuiBadge-colorError/);
    await expect(addressBadge).toHaveClass(/MuiBadge-colorError/);
    await expect(reviewBadge).toHaveClass(/MuiBadge-colorError/);

    /** Scenario 3: on reopen from home page, last opened tab should persist */
    await addressTab.click();
    await expect(addressTab).toHaveAttribute('aria-selected', 'true');

    const digV2LandingPage = page.getByRole('button', { name: 'My Work' });
    await digV2LandingPage.click();

    await page.locator('input[id="search"]').fill(caseID || '');
    await page.locator(`button:has-text("${caseID}")`).click();

    await expect(page.locator('div[id="Assignment"]')).toBeVisible();
    await expect(addressTab).toHaveAttribute('aria-selected', 'true');

    /** Step 1 after reopen: fill Basic Details, submit from Review, Address should open */
    await basicDetailsTab.click();
    await fillBasicDetails(page);

    await reviewTab.click();
    await submitButton(page).click();

    await expect(addressTab).toHaveAttribute('aria-selected', 'true');
    await expect(basicDetailsTab.locator('.MuiBadge-badge')).toHaveCount(0);

    /** Step 2 after reopen: fill Address, submit from Basic Details, Review should open */
    await fillAddressDetails(page);

    await basicDetailsTab.click();
    await submitButton(page).click();

    await expect(reviewTab).toHaveAttribute('aria-selected', 'true');
    await expect(addressTab.locator('.MuiBadge-badge')).toHaveCount(0);

    /** Step 3 after reopen: fill Review and submit successfully */
    await reviewTab.click();
    await fillReviewDetails(page);

    await submitButton(page).click();

    await expect(reviewDetailsHeader(page)).toBeVisible();
    await assertReadOnlyReviewValues(page);
  }, 20000);
});

test.afterEach(async ({ page }) => await common.calculateCoverage(page, outputDir));
