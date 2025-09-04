import { handleLogin, handleRegister } from "./login.js";
import {
   isMasterPasswordExist,
   injectNavbar,
   addTableInteractions,
   monitorAppInactivity,
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
   await monitorAppInactivity();

   if (path.endsWith("login.html")) {
      const loginBtn = document.getElementById("loginBtn");
      const registerBtn = document.getElementById("registerBtn");
      const pageHeader = document.getElementById("authtitle");
      const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
      const renderLoginBtn = document.getElementById("renderLoginBtn");

      loginBtn?.addEventListener("click", () => {
         loginBtn.disabled = true;
         handleLogin().finally(() => (loginBtn.disabled = false));
      });

      registerBtn?.addEventListener("click", handleRegister);

      forgotPasswordBtn?.addEventListener("click", () => {
         loginBtn.style.display = "none";
         forgotPasswordBtn.style.display = "none";
         registerBtn.style.display = "block";
         renderLoginBtn.style.display = "block";
      });

      renderLoginBtn?.addEventListener("click", () => {
         loginBtn.style.display = "block";
         forgotPasswordBtn.style.display = "block";
         registerBtn.style.display = "none";
         renderLoginBtn.style.display = "none ";
      });

      if (masterPasswordExist) {
         pageHeader.textContent = "Login";
         loginBtn.style.display = "block";
         registerBtn.style.display = "none";
         renderLoginBtn.style.display = "none";
      } else {
         pageHeader.textContent = "Register";
         loginBtn.style.display = "none";
         forgotPasswordBtn.display = "none";
         registerBtn.style.display = "block";
         renderLoginBtn.style.display = "block";
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
