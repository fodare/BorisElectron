const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("versions", {
   node: () => process.versions.node,
   chrome: () => process.versions.chrome,
   electron: () => process.versions.electron,
});

contextBridge.exposeInMainWorld("electronAPI", {
   createMasterPassword: (passwordInput) =>
      ipcRenderer.invoke("create-master-password", { passwordInput }),
   login: (passwordInput) =>
      ipcRenderer.invoke("verify-master-password", { passwordInput }),
   checkForMasterPassword: () => ipcRenderer.invoke("has-master-password"),
   navigateTo: (page) => ipcRenderer.send("navigate-to", page),
   renderAddAccountWindow: () => ipcRenderer.send("render-account-prompt"),
   saveAccount: (
      accountName,
      accountUserName,
      accountPassword,
      accountUrl,
      accountNotes
   ) =>
      ipcRenderer.invoke("save-account", {
         accountName,
         accountUserName,
         accountPassword,
         accountUrl,
         accountNotes,
      }),
   readSavedAccounts: () => ipcRenderer.invoke("read-saved-accounts"),
   notifyAccountAdded: () => ipcRenderer.send("account-added"),
   onRefreshAccounts: (callback) =>
      ipcRenderer.on("refresh-accounts", callback),
   closeAddAccountWindow: () => ipcRenderer.send("close-add-account-window"),
   renderUpdateWindow: (accountData) =>
      ipcRenderer.send("render-update-window", accountData),
   requestUpdateData: () => ipcRenderer.send("get-update-data"),
   onReceiveUpdateData: (callback) =>
      ipcRenderer.once("update-data", (event, data) => callback(data)),
   updateAccount: (oldAccountName, newAccountdata) =>
      ipcRenderer.invoke("update-account", {
         oldAccountName,
         updatedAccount: newAccountdata,
      }),
   deleteAccount: (accountName) =>
      ipcRenderer.invoke("delete-account", accountName),
   sendInactiveSession: () => ipcRenderer.send("inactive-timeout"),
   appInfo: () => ipcRenderer.invoke("read-app-info"),
   showConfirmationDialog: (type, message) =>
      ipcRenderer.invoke("show-confirmation-dialog", { type, message }),
   renderAddTransactionWindow: () =>
      ipcRenderer.send("render-transaction-prompt"),
   closeAddTransactionWindow: () =>
      ipcRenderer.send("close-add-transaction-window"),
   recordTransaction: (transactionData) =>
      ipcRenderer.invoke("record-transaction", { transactionData }),
   readSavedTransactions: () => ipcRenderer.invoke("read-saved-transactions"),
   notifyTransactionAdded: () => ipcRenderer.send("transaction-added"),
   onRefreshTransaction: (callback) =>
      ipcRenderer.on("refresh-transactions", callback),
   deletetransaction: (tranactionID) =>
      ipcRenderer.invoke("delete-transaction", tranactionID),
});
