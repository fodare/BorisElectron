function isMasterPasswordExist() {
   return window.electronAPI.checkForMasterPassword();
}

function getMasterPassWordInput() {
   return document.getElementById("masterPasswordInput")?.value.trim();
}

function setStatusMessage(message) {
   const messageElement = document.getElementById("statusMessage");
   if (messageElement) {
      messageElement.textContent = message;
      setTimeout(() => {
         messageElement.textContent = "";
      }, 3500);
   }
}

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
   }
}

document.addEventListener("DOMContentLoaded", async () => {
   const path = window.location.pathname;
   const masterPasswordExist = await isMasterPasswordExist();

   if (path.endsWith("login.html")) {
      const loginBtn = document.getElementById("loginBtn");
      const registerBtn = document.getElementById("registerBtn");

      loginBtn?.addEventListener("click", handleLogin);
      registerBtn?.addEventListener("click", handleRegister);

      if (masterPasswordExist) {
         loginBtn.style.display = "block";
         registerBtn.style.display = "none";
      } else {
         loginBtn.style.display = "none";
         registerBtn.style.display = "block";
      }
   }
});
