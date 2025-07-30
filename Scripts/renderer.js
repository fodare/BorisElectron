import { handleLogin, handleRegister } from "./login.js";
import {
   isMasterPasswordExist,
   injectNavbar,
   addTableInteractions,
} from "./helper.js";
import {
   setupCredentialPageInteractions,
   setUpAddAccountPageIntractions,
   setUpUpdateAccountInteractions,
} from "./accounts.js";

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
      addTableInteractions("credentialsTableBody");
   }

   if (path.endsWith("addAccount.html")) {
      await setUpAddAccountPageIntractions();
   }

   if (path.endsWith("updateAccount.html")) {
      await setUpUpdateAccountInteractions();
   }
});
