import { dialog, Menu, shell, app } from "electron";

const isMac = process.platform === "darwin";
function setUpAppMenu() {
   const template = [
      ...(isMac
         ? [
              {
                 label: app.name,
                 submenu: [
                    { role: "about" },
                    { type: "separator" },
                    { role: "services" },
                    { type: "separator" },
                    { role: "hide" },
                    { role: "hideOthers" },
                    { role: "unhide" },
                    { type: "separator" },
                    { role: "quit" },
                 ],
              },
           ]
         : []),
      {
         label: "File",
         submenu: [isMac ? { role: "close" } : { role: "quit" }],
      },
      {
         label: "Edit",
         submenu: [
            { role: "undo" },
            { role: "redo" },
            { type: "separator" },
            { role: "cut" },
            { role: "copy" },
            { role: "paste" },
            ...(isMac
               ? [
                    { role: "pasteAndMatchStyle" },
                    { role: "delete" },
                    { role: "selectAll" },
                    { type: "separator" },
                    {
                       label: "Speech",
                       submenu: [
                          { role: "startSpeaking" },
                          { role: "stopSpeaking" },
                       ],
                    },
                 ]
               : [
                    { role: "delete" },
                    { type: "separator" },
                    { role: "selectAll" },
                 ]),
         ],
      },
      {
         label: "view",
         submenu: [
            { role: "reload" },
            { role: "forceReload" },
            { role: "toggleDevTools" },
            { type: "separator" },
            { role: "resetZoom" },
            { role: "zoomIn" },
            { role: "zoomOut" },
            { role: "separator" },
            { role: "togglefullscreen" },
         ],
      },
      {
         label: "window",
         submenu: [
            { role: "minimize" },
            { role: "zoom" },
            ...(isMac
               ? [
                    { type: "separator" },
                    { role: "front" },
                    { type: "separator" },
                    { role: "window" },
                 ]
               : [{ role: "close" }]),
         ],
      },
      {
         label: "Help",
         submenu: [
            {
               label: "App Information",
               click: () => {
                  const appInfo = `
                  App Version: ${app.getVersion()}

                  App Data Directory: ${app.getPath("userData")}

                  Source Code: https://github.com/fodare/BorisElectron
                  
                  Issues: https://github.com/fodare/BorisElectron/issues
                  `;
                  dialog.showMessageBox({
                     type: "info",
                     title: "Application Info",
                     message: "Application Info",
                     detail: appInfo,
                     buttons: ["ok"],
                  });
               },
            },
         ],
      },
   ];
   const appMenu = Menu.buildFromTemplate(template);
   Menu.setApplicationMenu(appMenu);
}

export { setUpAppMenu };
