import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import {
   masterPasswordExist,
   encryptValidationToken,
   isPasswordValid,
   writeMasterPassword,
   readMasterPassword,
   deriveKeyFromMasterpassword,
   encryptContent,
   decryptContent,
   writeAccountToFile,
   readAccountFromFile,
} from "./Scripts/credentials.js";

let sessionMasterPassword = null;
let sessionKey = null;

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
      icon: path.join(APP_DIR, "/Assets/Boris.png"),
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
   sessionKey = null;
   sessionMasterPassword = null;
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
         sessionMasterPassword = passwordInput;
         sessionKey = encrypted.salt;
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
      if (!sessionMasterPassword || !sessionKey) {
         return {
            success: false,
            message: "Can not persist account. Master password not in session!",
         };
      }

      const accountInfo = JSON.stringify({
         name: accountName,
         userName: accountUserName,
         password: accountPassword,
         url: accountUrl,
         notes: accountNotes,
      });

      let encryptionKey = deriveKeyFromMasterpassword(
         sessionMasterPassword,
         sessionKey
      );

      let encryptedData = encryptContent(accountInfo, encryptionKey.data);

      if (!encryptedData.success) {
         return {
            success: false,
            message: "Failed to encrypt account content.",
         };
      }

      const pasrsedContent = JSON.parse(encryptedData.encryptedContent);
      const isAccountSaved = writeAccountToFile(pasrsedContent);

      if (isAccountSaved.success) {
         return { success: true, message: isAccountSaved.message };
      } else {
         return { success: false, message: isAccountSaved.message };
      }
   }
);

ipcMain.handle("read-saved-accounts", (event) => {
   if (!sessionMasterPassword || !sessionKey) {
      return {
         success: false,
         message: "Master password not in session.",
      };
   }

   const savedAccounts = readAccountFromFile();
   const derivedKey = deriveKeyFromMasterpassword(
      sessionMasterPassword,
      sessionKey
   );

   if (!savedAccounts.success || !derivedKey.success) {
      return {
         success: false,
         message: "Failed to read or decrypt accounts.",
      };
   }

   const decryptedAccounts = savedAccounts.data
      .map((account) => {
         const result = decryptContent(
            account.iv,
            account.data,
            derivedKey.data
         );
         if (result.success) {
            return JSON.parse(result.data);
         }
         return null;
      })
      .filter(Boolean);

   return {
      success: true,
      data: decryptedAccounts,
   };
});
