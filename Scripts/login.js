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

   if (!passwordInput) {
      setStatusMessage("Please enter a valid master password!");
      return;
   }

   try {
      const masterPasswordExists = await isMasterPasswordExist();

      if (masterPasswordExists) {
         const warningMessage = `A master password has already been set.\n\nCreating a new master password will make any previously saved data permanently inaccessible, as it cannot be decrypted without the original password.\n\nDo you want to proceed anyway?`;

         const userConfirmed = await window.electronAPI.showConfirmationDialog(
            "warning",
            warningMessage
         );

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
      setTimeout(() => {
         window.electronAPI.navigateTo("login.html");
      }, 1500);
   } catch (error) {
      setStatusMessage(`Error registering. ${error.message}`);
   }
}

export { handleLogin, handleRegister };
