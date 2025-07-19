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
});
