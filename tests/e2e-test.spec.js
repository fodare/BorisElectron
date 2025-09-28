import { test, expect, _electron as electron } from "@playwright/test";

test.describe("End-to-end Test", () => {
   let electronApp;
   let window;

   test.beforeEach(async () => {
      electronApp = await electron.launch({ args: ["./main.js"] });
      window = await electronApp.firstWindow();
   });

   test.afterAll(async () => {
      await electronApp.close();
   });

   test("should launch app and display registration UI elements", async () => {
      await expect(window).toHaveTitle("Boris - Login");

      const registerHeader = window.locator("#authtitle");
      const registerButton = window.locator("#registerBtn");
      const loginRedirectButton = window.locator("#renderLoginBtn");

      await expect(registerHeader).toHaveText("Register");
      await expect(registerButton).toBeVisible();
      await expect(loginRedirectButton).toBeVisible();
   });
});
