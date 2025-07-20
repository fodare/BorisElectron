import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import {
   masterPasswordExist,
   encryptValidationToken,
   isPasswordValid,
   writeMasterPassword,
   readMasterPassword,
} from "./Scripts/credentials.js";

let mainWindow = null;
let accountPromptWindow = null;
const APP_DIR = app.getAppPath();

function createWindow() {
   mainWindow = new BrowserWindow({
      width: 1000,
      height: 800,
      webPreferences: {
         contextIsolation: true,
         nodeIntegration: false,
         preload: path.join(APP_DIR, "/Scripts/preload.js"),
      },
   });

   mainWindow.loadFile(path.join(APP_DIR, "/Pages/login.html"));
   mainWindow.webContents.openDevTools();
   mainWindow.on("closed", () => {
      mainWindow = null;
   });
}

app.whenReady().then(() => {
   createWindow();
});

app.on("window-all-closed", () => {
   if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
   if (mainWindow === null) createWindow();
});

ipcMain.handle("create-master-password", (event, { passwordInput }) => {
   if (masterPasswordExist()) {
      return {
         success: false,
         message: "Master password already exists. Please login instead.",
      };
   }
   try {
      const encrypted = encryptValidationToken(passwordInput);
      writeMasterPassword(encrypted);
      return {
         success: true,
         message: "Master password created successfully.",
      };
   } catch (error) {
      return {
         success: false,
         message: `Error creating master password: ${error.message}`,
      };
   }
});

ipcMain.handle("verify-master-password", (event, { passwordInput }) => {
   if (!masterPasswordExist()) {
      return {
         success: false,
         message: "No master password set. Please register first.",
      };
   }
   try {
      const encrypted = JSON.parse(readMasterPassword());
      const valid = isPasswordValid(
         passwordInput,
         encrypted.salt,
         encrypted.iv,
         encrypted.data
      );

      if (valid) {
         return { success: true, message: "Login successful." };
      } else {
         return { success: false, message: "Incorrect master password." };
      }
   } catch (error) {
      return {
         success: false,
         message: `Error verifying master password: ${error.message}`,
      };
   }
});

ipcMain.handle("has-master-password", (event) => {
   return masterPasswordExist();
});

ipcMain.on("navigate-to", (event, page) => {
   mainWindow.loadFile(path.join(APP_DIR, `/Pages/${page}`));
});

ipcMain.on("render-account-prompt", (event) => {
   if (accountPromptWindow) {
      accountPromptWindow.focus();
      return;
   }

   accountPromptWindow = new BrowserWindow({
      parent: mainWindow,
      modal: true,
      width: 900,
      height: 750,
      minimizable: false,
      webPreferences: {
         contextIsolation: true,
         nodeIntegration: false,
         preload: path.join(APP_DIR, "/Scripts/preload.js"),
      },
   });

   accountPromptWindow.loadFile(path.join(APP_DIR, "/Pages/addAccount.html"));
   accountPromptWindow.webContents.openDevTools();
   accountPromptWindow.on("closed", () => {
      accountPromptWindow = null;
   });
});

ipcMain.handle(
   "save-account",
   (
      event,
      {
         accountName,
         accountUserName,
         accountPassword,
         accountUrl,
         accountNotes,
      }
   ) => {
      console.log(
         accountName,
         accountUserName,
         accountPassword,
         accountUrl,
         accountNotes
      );
      return { success: true, messge: "Account saved!" };
   }
);
