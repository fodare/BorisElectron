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

   // Todo: Finish this
   //    function clearSelection() {
   //       tableBody
   //          .querySelectorAll("td")
   //          .forEach((td) => (td.style.backgroundColor = ""));
   //       tableBody
   //          .querySelectorAll("tr")
   //          .forEach((tr) => (tr.style.backgroundColor = ""));
   //    }

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
         // Todo: Handle update logic here
         //  alert(`Double click event ${target.textContent}`);
         return;
      }
   });

   document.addEventListener("keydown", (event) => {
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
   });
}

export {
   isMasterPasswordExist,
   getMasterPassWordInput,
   setStatusMessage,
   injectNavbar,
   addTableInteractions,
};
