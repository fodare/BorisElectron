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
   }
}

async function injectNavbar() {
   const navDiv = document.getElementById("nav-div");
   if (!navDiv) return;

   try {
      const response = await fetch("../Components/navbar.html");
      if (!response.ok) throw new Error("Navbar fetch failed");

      const navbarHTML = await response.text();
      navDiv.innerHTML = navbarHTML;

      const currentPage =
         window.location.pathname.split("/").pop() || "index.html";
      const navLinks = navDiv.querySelectorAll("a[href]");

      navLinks.forEach((link) => {
         const href = link.getAttribute("href");

         if (!href || href.startsWith("http")) return;

         // Highlight active link
         const linkPage = href.split("/").pop();
         if (linkPage === currentPage) {
            link.classList.add("active");
         }

         // Add navigation handler
         link.addEventListener("click", (e) => {
            e.preventDefault();
            window.electronAPI.navigateTo(href);
         });
      });
   } catch (err) {
      console.error("Failed to load navbar:", err);
   }
}

function getSearchInputValue() {
   return document.getElementById("accountNameInput")?.value.trim() || "";
}

async function handleSearchAccount() {
   console.log(getSearchInputValue());
}

async function handleAddAccount() {
   await renderAddAccountWindow();
}

async function setupCredentialPageInteractions() {
   const accountInput = document.getElementById("accountNameInput");
   const searchBtn = document.getElementById("searchBtn");
   const addAccountBtn = document.getElementById("addAccountBtn");

   if (!accountInput || !searchBtn || !addAccountBtn) return;

   toggleButtons(false);

   accountInput.addEventListener("focus", () => {
      toggleButtons(accountInput.value.trim() !== "");
   });

   accountInput.addEventListener("blur", () => {
      setTimeout(() => toggleButtons(false), 150);
   });

   accountInput.addEventListener("input", () => {
      toggleButtons(accountInput.value.trim() !== "");
   });

   searchBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      await handleSearchAccount();
   });

   addAccountBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      await handleAddAccount();
   });

   function toggleButtons(showSearch) {
      searchBtn.style.display = showSearch ? "inline-block" : "none";
      addAccountBtn.style.display = showSearch ? "none" : "inline-block";
   }
}

async function renderAddAccountWindow() {
   await window.electronAPI.renderAddAccountWindow();
}

function getAddAccountInputs() {
   const rawNotes = document.getElementById("accountNote")?.value.trim() || "";

   return {
      accountName: document.getElementById("accountNameInput")?.value.trim(),
      accountUserName: document.getElementById("usernameInput")?.value.trim(),
      accountPassword: document.getElementById("passwordInput")?.value.trim(),
      accountUrl: document.getElementById("urlInput")?.value.trim(),
      accountNotes: rawNotes
         .split(/\r?\n/)
         .map((note) => note.trim())
         .filter((note) => note.length > 0),
   };
}

async function setUpAddAccountPageIntractions() {
   const saveAccountBtn = document.getElementById("addAccountBtn");
   saveAccountBtn?.addEventListener("click", async (event) => {
      event.preventDefault();
      const {
         accountName,
         accountUserName,
         accountPassword,
         accountUrl,
         accountNotes,
      } = getAddAccountInputs();
      if (!accountName) {
         setStatusMessage("Account name is required!");
         return;
      }
      await saveNewAccountInfo(
         accountName,
         accountUserName,
         accountPassword,
         accountUrl,
         accountNotes
      );
   });
}

async function saveNewAccountInfo(
   accountName,
   accountUserName,
   accountPassword,
   accountUrl,
   accountNotes
) {
   const saveAccountResponse = await window.electronAPI.saveAccount(
      accountName,
      accountUserName,
      accountPassword,
      accountUrl,
      accountNotes
   );
   console.log(saveAccountResponse);
}

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
