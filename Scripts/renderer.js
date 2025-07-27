import {
   setupCredentialPageInteractions,
   setUpAddAccountPageIntractions,
} from "./accounts.js";

import { handleLogin, handleRegister } from "./login.js";
import {
   isMasterPasswordExist,
   getMasterPassWordInput,
   setStatusMessage,
   injectNavbar,
} from "./helper.js";

document.addEventListener("DOMContentLoaded", async () => {
   const path = window.location.pathname;
   const masterPasswordExist = await isMasterPasswordExist();
   await injectNavbar();

   if (path.endsWith("login.html")) {
      const loginBtn = document.getElementById("loginBtn");
      const registerBtn = document.getElementById("registerBtn");

      loginBtn?.addEventListener("click", () => {
         loginBtn.disabled = true;
         handleLogin().finally(() => (loginBtn.disabled = false));
      });
      registerBtn?.addEventListener("click", handleRegister);

      if (masterPasswordExist) {
         loginBtn.style.display = "block";
         registerBtn.style.display = "none";
      } else {
         loginBtn.style.display = "none";
         registerBtn.style.display = "block";
      }
   }

   if (path.endsWith("credentials.html")) {
      await setupCredentialPageInteractions();
   }

   if (path.endsWith("addAccount.html")) {
      await setUpAddAccountPageIntractions();
   }
});
