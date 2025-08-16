import { refreshAccountsTable } from "./accounts.js";

function isMasterPasswordExist() {
   return window.electronAPI.checkForMasterPassword();
}

function getMasterPassWordInput() {
   return document.getElementById("masterPasswordInput")?.value.trim();
}

function setStatusMessage(message) {
   const toastContainer =
      document.getElementById("toast-container") ||
      (() => {
         const container = document.createElement("div");
         container.id = "toast-container";
         container.classList.add("position-fixed", "top-0", "end-0", "p-3");
         document.body.appendChild(container);
         return container;
      })();

   const toast = document.createElement("div");
   toast.classList.add("toast");
   toast.setAttribute("role", "alert");
   toast.innerHTML = `
      <div class="toast-header">
         <strong class="me-auto">Notification</strong>
         <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">${message}</div>
   `;
   toastContainer.appendChild(toast);

   new bootstrap.Toast(toast, { delay: 3500 }).show();
   toast.addEventListener("hidden.bs.toast", () => toast.remove());
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
      console.error("Failed to load navbar:", err.message);
   }
}

function addTableInteractions(tableBodyId) {
   const tableBody = document.getElementById(tableBodyId);
   if (!tableBody) {
      return;
   }

   let selectedRow = null;
   let selectedCell = null;
   let clipboardClearTimeout = null;

   tableBody.addEventListener("click", (event) => {
      const target = event.target;
      if (target.tagName === "TD") {
         selectedCell = target;
         selectedRow = target.parentElement;
      }
   });

   tableBody.addEventListener("dblclick", (event) => {
      const target = event.target;
      if (target.tagName === "TD") {
         const row = target.parentElement;
         const cells = row.querySelectorAll("td");

         const accountData = {
            name: cells[0]?.textContent,
            userName: cells[1]?.textContent,
            password: cells[2]?.textContent,
            url: cells[3]?.textContent,
            notes: cells[4]?.textContent,
         };
         window.electronAPI.renderUpdateWindow(accountData);
      }
   });

   document.addEventListener("keydown", async (event) => {
      if (!selectedCell) {
         return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
         event.preventDefault();
         const copiedText = selectedCell.textContent;
         navigator.clipboard
            .writeText(copiedText)
            .then(() => {
               setTimeout(() => {
                  if (clipboardClearTimeout) {
                     clearTimeout(clipboardClearTimeout);
                  }
                  clipboardClearTimeout = setTimeout(() => {
                     navigator.clipboard
                        .writeText("")
                        .catch((error) => setStatusMessage(error.message));
                  }, 3000);
               });
            })
            .catch((error) => setStatusMessage(error.message));
      }

      if (event.key === "Delete") {
         event.preventDefault();
         if (selectedRow) {
            const confirmDeletion = confirm(
               "Are you sure you want to delete this entry?. Please note action is not reversible!"
            );
            if (confirmDeletion) {
               const cells = selectedRow.querySelectorAll("td");
               const accountName = cells[0]?.textContent;
               const delettionResult = await window.electronAPI.deleteAccount(
                  accountName
               );

               setStatusMessage(delettionResult.message);
               if (delettionResult.success) {
                  await refreshAccountsTable();
               }
            }
         }
      }
   });
}

async function monitorAppInactivity(
   inactivityLimit = 300,
   throttleDuration = 500
) {
   let lastActvity = Date.now();
   let throttleTimeout = null;
   function resetTimer() {
      if (!throttleTimeout) {
         lastActvity = Date.now();
         throttleTimeout = setTimeout(() => {
            throttleTimeout = null;
         }, throttleDuration);
      }
   }

   ["mousemove", "keydown", "mousedown", "scroll", "touchstart"].forEach(
      (event) => {
         window.addEventListener(event, resetTimer);
      }
   );

   setInterval(() => {
      const inactiveTime = (Date.now() - lastActvity) / 1000;
      if (inactiveTime >= inactivityLimit) {
         window.electronAPI.sendInactiveSession();
      }
   }, 1000);
}

export {
   isMasterPasswordExist,
   getMasterPassWordInput,
   setStatusMessage,
   injectNavbar,
   addTableInteractions,
   monitorAppInactivity,
};
