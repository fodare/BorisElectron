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
import { setupFinancesInteractions,setupAddTransactionInteractions } from "./finances.js";

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

      function showLoginContent() {
         pageHeader.textContent = "Login";
         loginBtn.style.display = "block";
         registerBtn.style.display = "none";
         renderLoginBtn.style.display = "none";
         forgotPasswordBtn.style.display = "block";
      }

      function showRegisterContent() {
         pageHeader.textContent = "Register";
         loginBtn.style.display = "none";
         forgotPasswordBtn.style.display = "none";
         registerBtn.style.display = "block";
         renderLoginBtn.style.display = "block";
      }

      loginBtn?.addEventListener("click", async () => {
         loginBtn.disabled = true;
         await handleLogin().finally(() => (loginBtn.disabled = false));
      });

      registerBtn?.addEventListener("click", async (event) => {
         event.preventDefault();
         registerBtn.disabled = true;
         await handleRegister().finally(() => (registerBtn.disabled = false));
      });

      forgotPasswordBtn?.addEventListener("click", () => {
         showRegisterContent();
      });

      renderLoginBtn?.addEventListener("click", () => {
         showLoginContent();
      });

      if (masterPasswordExist) {
         showLoginContent();
      } else {
         showRegisterContent();
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

   if (path.endsWith("finances.html")) {
      await setupFinancesInteractions();
   }
   
   if (path.endsWith("addTransaction.html")) {
      await setupAddTransactionInteractions();
   }
});
