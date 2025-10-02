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
   const InvalidAccountName = "Unknown Test 1";
   const updatedAccountName = "Test Account Updated";

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

   const createAccount = async function createNewAccount(name = testAccountName, appWindow = window, electronApp = electronApp) {
      await appWindow.locator('#addAccountBtn').click();
      const accountWindow = await electronApp.waitForEvent('window');
      await accountWindow.locator('#generateAccountBtn').click();
      await accountWindow.locator('#accountNameInput').fill(name);
      const usernameInputCount = await accountWindow.locator('#usernameInput').count();
      expect(usernameInputCount).toBeGreaterThan(0);
      await accountWindow.locator('#addAccountBtn').click();
      await expect(accountWindow.locator('.toast-body')).toHaveText('Wrote account to file!');
      await accountWindow.close();
   }

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
      await createAccount(testAccountName, window, electronApp);
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

   test("search for a known account", async () => {
      await register(window);
      await login(window);
      await createAccount(testAccountName, window, electronApp);
      
      await window.locator("#accountNameInput").fill(testAccountName);
      await expect(window.locator("#searchBtn")).toBeVisible();
      await window.locator("#searchBtn").click();
      const accountNameCell = window.locator(`text=${testAccountName}`);
      await expect(accountNameCell).toBeVisible();
      await expect(accountNameCell).toHaveText(testAccountName);
   });

   test("returns no account for unknown name", async () => {
      await register(window);
      await login(window);
      await createAccount(testAccountName, window, electronApp);

      await window.locator("#accountNameInput").fill(InvalidAccountName);
      await expect(window.locator("#searchBtn")).toBeVisible();
      await window.locator("#searchBtn").click();
      const notificationText = window.locator(`text=${InvalidAccountName}`);
      await expect(notificationText).toHaveText(`There are no account with the name ${InvalidAccountName}!`);
   });

   test('double-clicking account opens edit window', async () => {
      await register(window);
      await login(window);
      await createAccount(testAccountName, window, electronApp);
      const accountRow = window.locator(`text=${testAccountName}`);
      await accountRow.dblclick();
      const editWindow = await electronApp.waitForEvent('window');
      await expect(editWindow.locator('#accountName')).toHaveValue(testAccountName);
      await editWindow.close();
   });

   test('should allow updating a given account', async () => {
      await register(window);
      await login(window);
      await createAccount(testAccountName, window, electronApp);

      await window.locator(`text=${testAccountName}`).dblclick();
      const editWindow = await electronApp.waitForEvent('window');
      const accountNameInput = editWindow.locator('#accountName');
      const updateButton = editWindow.locator('#updateAccountBtn');
      const toast = editWindow.locator('.toast-body');

      await expect(accountNameInput).toHaveValue(testAccountName);
      await accountNameInput.fill(updatedAccountName);
      await updateButton.click();

      await expect(toast).toHaveText('Account updated successfully.');
      await editWindow.close();
      await expect(window.locator(`text=${updatedAccountName}`)).toBeVisible();
   });

   test('should allow account deletion', async () => {
      await register(window);
      await login(window);
      await createAccount(testAccountName, window, electronApp);
      await createAccount("Test Account 2", window, electronApp);

      const accountRow = window.locator(`text=${testAccountName}`);
      await accountRow.click();
      await window.keyboard.press('Delete');
      await window.locator('#confirmYes').click();
      await expect(accountRow).not.toBeVisible();
   });

   //#endregion
});
