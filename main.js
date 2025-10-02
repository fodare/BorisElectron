import { app, BrowserWindow, dialog, ipcMain } from "electron";
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
   updateAccountInFile,
   deleteAccountFromFile,
   writeTransactionToFile,
   readTransactionsFromFile,
   deleteTransactionFromFile,
} from "./Scripts/credentials.js";
import { setUpAppMenu } from "./Scripts/appMenus.js";

let sessionMasterPassword = null;
let sessionKey = null;

let mainWindow = null;
let accountPromptWindow = null;
let updateAccountWindow = null;
let transactionPromptWindow = null;
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
   //mainWindow.webContents.openDevTools();
   mainWindow.on("closed", () => {
      mainWindow = null;
   });
}
// #region App listeners

app.whenReady().then(() => {
   createWindow();
   setUpAppMenu();
});

app.on("window-all-closed", () => {
   sessionKey = null;
   sessionMasterPassword = null;
   if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
   if (mainWindow === null) createWindow();
});

ipcMain.on("inactive-timeout", () => {
   sessionKey = null;
   sessionMasterPassword = null;
   app.quit();
});

ipcMain.handle("read-app-info", async (event) => {
   return {
      appVersion: app.getVersion(),
      appDataDir: app.getPath("userData"),
   };
});

ipcMain.on("navigate-to", (event, page) => {
   mainWindow.loadFile(path.join(APP_DIR, `/Pages/${page}`));
});

// ipcMain.handle("show-confirmation-dialog", async (event, { type, message }) => {
//    const result = await dialog.showMessageBox(mainWindow, {
//       type: type || "warning",
//       buttons: ["Yes", "No"],
//       defaultId: 1,
//       title: app.getName() || "Confirm",
//       message: message,
//       cancelId: 1,
//    });
//    return result.response === 0;
// });

// #endregion

// #region MasterPassword listners

ipcMain.handle("create-master-password", (event, { passwordInput }) => {
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

// #endregion

// #region Accounts listeners

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
   //accountPromptWindow.webContents.openDevTools();
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

   if (!savedAccounts.success && savedAccounts.data.length === 0) {
      return {
         success: false,
         message: "No persisted account(s).",
      }
   }

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

ipcMain.on("account-added", () => {
   const allWindows = BrowserWindow.getAllWindows();
   const credentialsWin = allWindows.find((win) =>
      win.webContents.getURL().includes("credentials.html")
   );

   if (credentialsWin) {
      credentialsWin.webContents.send("refresh-accounts");
   }
});

ipcMain.on("close-add-account-window", () => {
   if (accountPromptWindow) {
      accountPromptWindow.close();
      accountPromptWindow = null;
   }
});

ipcMain.on("render-update-window", (event, accountData) => {
   if (updateAccountWindow) {
      updateAccountWindow.focus();
      return;
   }

   updateAccountWindow = new BrowserWindow({
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

   ipcMain.once("get-update-data", (event) => {
      event.reply("update-data", accountData);
   });

   updateAccountWindow.loadFile(
      path.join(APP_DIR, "/Pages/updateAccount.html")
   );
   //updateAccountWindow.webContents.openDevTools();

   updateAccountWindow.on("closed", () => {
      updateAccountWindow = null;
   });
});

ipcMain.handle(
   "update-account",
   (event, { oldAccountName, updatedAccount }) => {
      if (!sessionMasterPassword || !sessionKey) {
         return {
            success: false,
            message: "Master password not in session.",
         };
      }

      const result = updateAccountInFile(
         oldAccountName,
         updatedAccount,
         sessionMasterPassword,
         sessionKey
      );

      if (result.success) {
         const credentialsWin = BrowserWindow.getAllWindows().find((win) =>
            win.webContents.getURL().includes("credentials.html")
         );
         if (credentialsWin) {
            credentialsWin.webContents.send("refresh-accounts");
         }
      }
      return result;
   }
);

ipcMain.handle("delete-account", (event, accountName) => {
   if (!sessionKey || !sessionMasterPassword) {
      return {
         success: false,
         message: "Master password not in session",
      };
   }

   const result = deleteAccountFromFile(
      accountName,
      sessionMasterPassword,
      sessionKey
   );

   if (!result.success) {
      const credentialsWin = BrowserWindow.getAllWindows().find((win) => {
         win.webContents.getURL().includes("credentials.html");
      });
      if (credentialsWin) {
         credentialsWin.webContents.send("refresh-accounts");
      }
   }

   return result;
});

// #endregion

// #region Transactions listeners

ipcMain.on("render-transaction-prompt", async () => {
   if (transactionPromptWindow) {
      transactionPromptWindow.focus();
      return;
   }

   transactionPromptWindow = new BrowserWindow({
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

   transactionPromptWindow.loadFile(
      path.join(APP_DIR, "/Pages/addTransaction.html")
   );
   //accountPromptWindow.webContents.openDevTools();
   transactionPromptWindow.on("closed", () => {
      transactionPromptWindow = null;
   });
});

ipcMain.on("close-add-transaction-window", async () => {
   if (transactionPromptWindow) {
      transactionPromptWindow.close();
      transactionPromptWindow = null;
   }
});

ipcMain.handle("record-transaction", async (event, { transactionData }) => {
   if (!sessionMasterPassword || !sessionKey) {
      return {
         sucess: false,
         message:
            "Can not persist transaction. Master password not in session!",
      };
   }

   const transactionInfo = JSON.stringify(transactionData);
   let encryptionKey = deriveKeyFromMasterpassword(
      sessionMasterPassword,
      sessionKey
   );
   let encryptedData = encryptContent(transactionInfo, encryptionKey.data);

   if (!encryptedData.success) {
      return {
         success: false,
         message: "Error encrypting transaction. Please try again.",
      };
   }

   const parsedContent = JSON.parse(encryptedData.encryptedContent);
   const isTransactionRecorded = writeTransactionToFile(parsedContent);
   if (isTransactionRecorded.success) {
      return { success: true, message: isTransactionRecorded.message };
   } else {
      return { success: false, message: isTransactionRecorded.message };
   }
});

ipcMain.handle("read-saved-transactions", (event) => {
   if (!sessionMasterPassword || !sessionKey) {
      return {
         success: false,
         message: "Error reading transactions. Master password not in session!",
      };
   }

   const savedTransactions = readTransactionsFromFile();
   const derivedKey = deriveKeyFromMasterpassword(
      sessionMasterPassword,
      sessionKey
   );

   if (!savedTransactions.success || !derivedKey.success) {
      return {
         success: false,
         message: "Failed to read or decrypt transactions.",
      };
   }

   const decryptedTransactions = savedTransactions.data
      .map((transaction) => {
         const result = decryptContent(
            transaction.iv,
            transaction.data,
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
      data: decryptedTransactions,
   };
});

ipcMain.on("transaction-added", () => {
   const allWindows = BrowserWindow.getAllWindows();
   const transactionWindow = allWindows.find((window) =>
      window.webContents.getURL().includes("finances.html")
   );

   if (transactionWindow) {
      transactionWindow.webContents.send("refresh-transactions");
   }
});

ipcMain.handle("delete-transaction", (event, tranactionID) => {
   if (!sessionKey || !sessionMasterPassword) {
      return {
         success: false,
         message: "Master password not in session",
      };
   }

   const result = deleteTransactionFromFile(
      tranactionID,
      sessionMasterPassword,
      sessionKey
   );

   if (!result.success) {
      const transactionWindow = BrowserWindow.getAllWindows().find((win) => {
         win.webContents.getURL().includes("finances.html");
      });
      if (transactionWindow) {
         transactionWindow.webContents.send("refresh-transactions");
      }
   }

   return result;
});

// #endregion
