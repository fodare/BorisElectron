import {
   getMasterPassWordInput,
   setStatusMessage,
   isMasterPasswordExist,
} from "./helper.js";

async function handleLogin() {
   const passwordInput = getMasterPassWordInput();
   if (!passwordInput) {
      setStatusMessage("Please enter a vlaid master-password!");
      return;
   }
   const loginStatus = await window.electronAPI.login(passwordInput);
   if (!loginStatus.success) {
      setStatusMessage(loginStatus.message);
   } else {
      setStatusMessage(loginStatus.message);
      await window.electronAPI.navigateTo("credentials.html");
   }
}

async function handleRegister() {
   const passwordInput = getMasterPassWordInput();
   const appInfo = await window.electronAPI.appInfo();

   if (!passwordInput) {
      setStatusMessage("Please enter a valid master password!");
      return;
   }

   if (isMasterPasswordExist()) {
      const warningMessage = `A master password has already been set.\n\nLocation: ${appInfo.appDataDir}\n\nCreating a new master password will make any previously saved data permanently inaccessible, as it cannot be decrypted without the original password.\n\nDo you want to proceed anyway?`;

      const userConfirmed = window.confirm(warningMessage);

      if (!userConfirmed) {
         setStatusMessage(
            "Registration cancelled. Existing data remains safe."
         );
         return;
      }
   }

   const registrationStatus = await window.electronAPI.createMasterPassword(
      passwordInput
   );

   if (!registrationStatus.success) {
      setStatusMessage(registrationStatus.message);
      return;
   }

   setStatusMessage(registrationStatus.message);
   window.electronAPI.navigateTo("credentials.html");
}

export { handleLogin, handleRegister };
