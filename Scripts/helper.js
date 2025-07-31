import { refreshAccountsTable } from "./accounts.js";

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

         //  clearSelection();
         //  selectedCell.style.backgroundColor = "#d0f00";
         //  selectedCell.style.backgroundColor = "#f0d00";
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
                        .catch((error) => setStatusMessage(error));
                  }, 3000);
               });
            })
            .catch((error) => setStatusMessage(error));
      }

      if (event.key === "Delete") {
         event.preventDefault();
         if (selectedRow) {
            const confirmDeletion = confirm(
               "Are you sure you want to delete this entry?"
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

export {
   isMasterPasswordExist,
   getMasterPassWordInput,
   setStatusMessage,
   injectNavbar,
   addTableInteractions,
};
