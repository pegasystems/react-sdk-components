const { test, expect } = require('@playwright/test');

const config = require('../../../config');
const common = require('../../../common');

test.beforeEach(common.launchPortal);

const TEST_USER = {
  fullName: 'John Doe',
  fullNameTooLong: 'This Full Name Is Way Too Long For The Field Limit',
  email: 'john.doe@example.com',
  phone: '6175551212',
  state: 'California',
  country: 'US'
};

test.describe('E2E test', () => {
  test('should login, create Errors case and validate error banner scenarios', async ({ page }) => {
    await common.login(config.config.apps.digv2.user.username, config.config.apps.digv2.user.password, page);

    /** Testing announcement banner presence */
    const announcementBanner = page.locator('h6:has-text("Announcements")');
    await expect(announcementBanner).toBeVisible();

    /** Testing worklist presence */
    const worklist = page.locator('h6:has-text("My Worklist")');
    await expect(worklist).toBeVisible();

    /** Creating an Errors case-type */
    const errorsCase = page.locator('div[role="button"]:has-text("Errors")');
    await errorsCase.click();

    /** Verify the Details assignment is displayed */
    const assignment = page.locator('div[id="Assignment"]');
    await expect(assignment).toBeVisible();

    /** Reusable locators */
    const validationBanner = page.locator('div[id^="validation-banner-"]');
    const bannerTitle = validationBanner.locator('.alert-banner-title');
    const bannerList = validationBanner.locator('ul.alert-banner-list');
    const fullNameInput = assignment.getByLabel('Full Name');
    const emailInput = assignment.getByLabel('Email');
    const phoneField = page.locator('div[data-test-id="a6ed730e-0e6f-4a95-ad11-e5b0435bd353"]');
    const stateInput = assignment.getByLabel('State');
    const countryDropdown = assignment.getByLabel('Country');
    const acceptTermsCheckbox = assignment.getByLabel('Accept terms and conditions');

    /** Scenario 1: Blur away from a required field — inline error + banner appears */

    await fullNameInput.click();
    await fullNameInput.press('Tab');
    await expect(assignment.locator('p.Mui-error').first()).toBeVisible();
    await expect(validationBanner).toBeVisible();
    await expect(validationBanner.locator('text=Full Name: Cannot be blank')).toBeVisible();

    /** Scenario 2: Submit with all fields empty — banner lists all required errors */

    await page.locator('h6:has-text("Details")').click();
    await page.locator('button:has-text("submit")').click();

    await expect(validationBanner).toBeVisible();
    await expect(bannerTitle).toBeVisible();
    await expect(bannerTitle.locator('text="Error"')).toBeVisible();
    await expect(bannerTitle.locator('.alert-banner-badge')).toBeVisible();

    await expect(bannerList).toBeVisible();
    await expect(bannerList.locator('li:has-text("Full Name:")')).toBeVisible();
    await expect(bannerList.locator('li:has-text("Email:")')).toBeVisible();
    await expect(bannerList.locator('li:has-text("Phone number:")')).toBeVisible();
    await expect(bannerList.locator('li:has-text("State:")')).toBeVisible();
    /** Checkbox error has no field name prefix — only the error message is shown */
    await expect(bannerList.getByText('Cannot be blank', { exact: true })).toBeVisible();
    /** Date of birth has no validation — must NOT appear in the banner */
    await expect(bannerList.locator('li:has-text("Date of birth")')).toBeHidden();

    /** Scenario 3: Fix fields one by one — banner clears in real time */
    await fullNameInput.fill(TEST_USER.fullName);
    await fullNameInput.press('Tab');
    await expect(bannerList.locator('li:has-text("Full Name:")')).toBeHidden();

    await emailInput.fill(TEST_USER.email);
    await emailInput.press('Tab');
    await expect(bannerList.locator('li:has-text("Email:")')).toBeHidden();

    await phoneField.locator('button').click();
    /** Selecting the country code */
    await page.locator('text=United States+1 >> nth=0').click();
    await common.enterPhoneNumber(phoneField, TEST_USER.phone);

    await stateInput.fill(TEST_USER.state);
    await stateInput.press('Tab');
    await expect(bannerList.locator('li:has-text("State:")')).toBeHidden();

    /** Scenario 4: Country dropdown — verify all configured options are present */

    await countryDropdown.click();
    await expect(page.getByRole('option', { name: 'India' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'US' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'UK' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Switzerland' })).toBeVisible();
    await page.getByRole('option', { name: TEST_USER.country }).click();
    await expect(bannerList.locator('li:has-text("Country:")')).toBeHidden();

    /** Check Accept terms and conditions — all errors resolved, banner disappears */
    await expect(validationBanner).toBeVisible();
    await acceptTermsCheckbox.check();
    await expect(validationBanner).toBeHidden();

    /** Scenario 5: Server-side validation — Full Name longer than 32 characters */

    await fullNameInput.fill(TEST_USER.fullNameTooLong);
    await fullNameInput.press('Tab');
    await page.locator('button:has-text("submit")').click();

    await expect(validationBanner).toBeVisible();
    await expect(validationBanner.getByText('Invalid value specified for Full Name', { exact: false })).toBeVisible();

    /** Fix Full Name to a valid value (≤ 32 characters) to proceed */
    await fullNameInput.fill(TEST_USER.fullName);
    await fullNameInput.press('Tab');

    /** Scenario 6: Submit with all valid data — no banner, case progresses */

    await page.locator('button:has-text("submit")').click();
    await expect(validationBanner).toBeHidden();

    /** Scenario 7: Review assignment — entered values shown in readonly mode */

    await expect(page.locator('h6:has-text("Review")')).toBeVisible();
    await expect(assignment.locator(`span:has-text("${TEST_USER.fullName}")`)).toBeVisible();
    await expect(assignment.locator(`span:has-text("${TEST_USER.email}")`)).toBeVisible();
    await expect(assignment.locator(`span:has-text("${TEST_USER.state}")`)).toBeVisible();
    await expect(assignment.locator(`span:has-text("${TEST_USER.country}")`)).toBeVisible();
    await expect(assignment.locator('input[name="FullName"]')).toBeHidden();
    await expect(assignment.locator('input[name="Email"]')).toBeHidden();
  }, 10000);
});

const outputDir = './test-reports/e2e/DigV2/Validation/Errors';
test.afterEach(async ({ page }) => await common.calculateCoverage(page, outputDir));
