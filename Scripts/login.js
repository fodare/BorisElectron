import { getMasterPassWordInput, setStatusMessage } from "./helper.js";

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
      setStatusMessage("Please enter a vlaid master-password!");
      return;
   }
   const registrationStatus = await window.electronAPI.createMasterPassword(
      passwordInput
   );
   if (!registrationStatus.success) {
      setStatusMessage(registrationStatus.message);
   } else {
      setStatusMessage(registrationStatus.message);
      window.electronAPI.navigateTo("credentials.html");
   }
}

export { handleLogin, handleRegister };
