import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import {
   masterPasswordExist,
   encryptValidationToken,
   isPasswordValid,
   writeMasterPassword,
   readMasterPassword,
} from "./Scripts/ .js";

let mainWindow = null;
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
      return { success: false, message: "Master password already exists." };
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

ipcMain.handle("verifyMasterPassword", (event, { passwordInput }) => {
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
