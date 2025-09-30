import { test, expect, _electron as electron } from "@playwright/test";
import { exec } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

test.describe("End-to-end Test", () => {
   let electronApp;
   let window;
   const dummyPassword = "test";
   const wrongPassword = "test1";
   const testAccountName = "Test Account 1";

   //#region Helpers

   const getUserDataPath = () => {
      const appName = "Electron";
      const homeDir = os.homedir();

      switch (process.platform) {
         case "win32":
            return path.join(
               process.env.APPDATA || path.join(homeDir, "AppData", "Roaming"),
               appName
            );
         case "darwin":
            return path.join(
               homeDir,
               "Library",
               "Application Support",
               appName
            );
         case "linux":
         default:
            return path.join(homeDir, ".config", appName);
      }
   };

   const clearAppData = () => {
      const dataDir = path.join(getUserDataPath(), "Data");
      const filesToDelete = [
         "password.enc",
         "accounts.enc",
         "transactions.enc",
      ];

      for (const file of filesToDelete) {
         const filePath = path.join(dataDir, file);
         if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
         }
      }
   };

   const register = async (win, password = dummyPassword) => {
      await win.locator("#masterPasswordInput").fill(password);
      await win.locator("#registerBtn").click();
      await expect(win.locator("#loginBtn")).toBeVisible();
   };

   const login = async (win, password = dummyPassword) => {
      await win.locator("#masterPasswordInput").fill(password);
      await win.locator("#loginBtn").click();
   };

   //#endregion

   //#region Lifecycle

   test.beforeEach(async () => {
      clearAppData();
      electronApp = await electron.launch({ args: ["./main.js"] });
      window = await electronApp.firstWindow();
   });

   test.afterEach(async () => {
      await electronApp?.close();
      clearAppData();
   });

   //#endregion

   //#region Tests

   test("should launch app and display registration UI elements", async () => {
      await expect(window).toHaveTitle("Boris - Login");
      await expect(window.locator("#authtitle")).toHaveText("Register");
      await expect(window.locator("#registerBtn")).toBeVisible();
      await expect(window.locator("#renderLoginBtn")).toBeVisible();
   });

   test("should ensure successful registration", async () => {
      await register(window);
      await expect(window.locator("#forgotPasswordBtn")).toBeVisible();
   });

   test("should allow login after registration", async () => {
      await register(window);
      await login(window);
      await expect(window).toHaveTitle("Boris - Credentials");
      await expect(window.locator("#nav-div")).toBeVisible();
      await expect(window.locator("#addAccountBtn")).toBeVisible();
      await expect(window.locator("#credentialsTree")).toBeVisible;
   });

   test("should display error when logging in with wrong password", async () => {
      await register(window);
      await login(window, wrongPassword);

      const toastHeader = window.locator(".toast-header");
      const toastBody = window.locator(".toast-body");
      await expect(toastHeader).toBeVisible();
      await expect(toastBody).toHaveText("Incorrect master password.");
   });

   test("should navigate to the finances page after login", async () => {
      await register(window);
      await login(window);

      const financeLink = window.locator("#financeLink");
      const addTransactionButton = window.locator("#addTransctionBtn");
      const transactionsTree = window.locator("#transactionsTree");

      await expect(financeLink).toBeVisible();
      await financeLink.click();

      await expect(window).toHaveTitle("Boris - Finances");
      await expect(addTransactionButton).toBeVisible();
      await expect(transactionsTree).toBeVisible();
   });

   test("should show confirmation modal when resetting master password", async () => {
      await register(window);

      const forgotPasswordButton = window.locator("#forgotPasswordBtn");
      const masterPasswordInput = window.locator("#masterPasswordInput");
      const registerButton = window.locator("#registerBtn");

      const confirmModal = window.locator("#confirmMessage");
      const confirmNoButton = window.locator("#confirmNo");

      const toastHeader = window.locator(".toast-header");
      const toastBody = window.locator(".toast-body");

      await forgotPasswordButton.click();
      await masterPasswordInput.fill(dummyPassword);
      await registerButton.click();

      // Assert
      await expect(confirmModal).toBeVisible();

      await confirmNoButton.click();

      await expect(toastHeader).toBeVisible();
      await expect(toastBody).toContainText("Registration cancelled");
   });

   test("should allow adding new account to saved credentials", async () => {
      await register(window);
      await login(window);

      await window.locator("#addAccountBtn").click();
      const newAccountWindow = await electronApp.waitForEvent("window");

      await newAccountWindow.locator("#generateAccountBtn").click();
      const userNameInputCount = await newAccountWindow
         .locator("#usernameInput")
         .count();

      await newAccountWindow.locator("#accountNameInput").fill(testAccountName);

      expect(userNameInputCount).toBeGreaterThan(0);
      await newAccountWindow.locator("#addAccountBtn").click();
      await expect(newAccountWindow.locator(".toast-body")).toHaveText(
         "Wrote account to file!"
      );
      await newAccountWindow.close();
      const accountNameCell = window.locator(`text=${testAccountName}`);
      await expect(accountNameCell).toBeVisible();
      await expect(accountNameCell).toHaveText(testAccountName);
   });

   test("should prevent adding a new account with an empty name", async () => {
      await register(window);
      await login(window);

      const addAccountButton = window.locator("#addAccountBtn");
      await addAccountButton.click();

      const newAccountWindow = await electronApp.waitForEvent("window");

      const submitAccountButton = newAccountWindow.locator("#addAccountBtn");
      await submitAccountButton.click();

      const errorToast = newAccountWindow.locator(".toast-body");
      await expect(errorToast).toHaveText("Account name is required!");
   });

   //#endregion
});
