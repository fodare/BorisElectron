import { test, expect, _electron as electron } from "@playwright/test";
import fs from "fs";
import os from "os";
import path from "path";

test.describe("End-to-end Test", () => {
   let electronApp;
   let window;
   const dummyPassword = "test";

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
   });

   //#endregion
});
