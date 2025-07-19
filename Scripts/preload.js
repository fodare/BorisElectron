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
});
