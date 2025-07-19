const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("versions", {
   node: () => process.versions.node,
   chrome: () => process.versions.chrome,
   electron: () => process.versions.electron,
});

contextBridge.exposeInMainWorld("electronAPI", {
   ping: () => ipcRenderer.invoke("ping"),
   createMasterPassword: (passwordInput) =>
      ipcRenderer.invoke("create-master-password", { passwordInput }),
   login: (passwordInput) =>
      ipcRenderer.invoke("verifyMasterPassword", { passwordInput }),
});
