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
});
