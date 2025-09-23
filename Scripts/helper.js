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
         container.classList.add("position-fixed", "top-0", "end-0", "p-3","toast-container");
         document.body.appendChild(container);
         return container;
      })();

   const toast = document.createElement("div");
   toast.classList.add("toast");
   toast.setAttribute("role", "alert");
   toast.innerHTML = `
      <div class="toast-header">
         <strong class="me-auto">Notification</strong>
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
      setStatusMessage(`Failed to load navbar: ${err.message}`);
   }
}

function addTableInteractions(tableBodyId) {
   const tableBody = document.getElementById(tableBodyId);
   if (!tableBody) {
      return;
   }

   let selectedRow = null;
   let selectedCell = null;

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

         const copiedText = selectedCell?.textContent;
         if (copiedText) {
            navigator.clipboard
               .writeText(copiedText)
               .then(() => setStatusMessage("Copied!"))
               .catch((err) => setStatusMessage("Clipboard error:", err));
            event.preventDefault();
         }
      }

      if (event.key === "Delete") {
         event.preventDefault();
         if (selectedRow) {
            const confirmDeletion = await showConfirmModal(
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

async function generateUsername() {
   const adjectives = [
      "Cool",
      "Fast",
      "Brave",
      "Happy",
      "Lazy",
      "Sneaky",
      "Clever",
      "Witty",
      "Loyal",
      "Fierce",
      "Time",
      "Past",
      "Future",
      "Dev",
      "Fly",
      "Flying",
      "Soar",
      "Soaring",
      "Power",
      "Falling",
      "Fall",
      "Jump",
      "Cliff",
      "Mountain",
      "Rend",
      "Red",
      "Blue",
      "Green",
      "Yellow",
      "Gold",
      "Demon",
      "Demonic",
      "Panda",
      "Cat",
      "Kitty",
      "Kitten",
      "Zero",
      "Memory",
      "Trooper",
      "XX",
      "Bandit",
      "Fear",
      "Light",
      "Glow",
      "Tread",
      "Deep",
      "Deeper",
      "Deepest",
      "Mine",
      "Your",
      "Worst",
      "Enemy",
      "Hostile",
      "Force",
      "Video",
      "Game",
      "Donkey",
      "Mule",
      "Colt",
      "Cult",
      "Cultist",
      "Magnum",
      "Gun",
      "Assault",
      "Recon",
      "Trap",
      "Trapper",
      "Redeem",
      "Code",
      "Script",
      "Writer",
      "Near",
      "Close",
      "Open",
      "Cube",
      "Circle",
      "Geo",
      "Genome",
      "Germ",
      "Spaz",
      "Shot",
      "Echo",
      "Beta",
      "Alpha",
      "Gamma",
      "Omega",
      "Seal",
      "Squid",
      "Money",
      "Cash",
      "Lord",
      "King",
      "Duke",
      "Rest",
      "Fire",
      "Flame",
      "Morrow",
      "Break",
      "Breaker",
      "Numb",
      "Ice",
      "Cold",
   ];

   const nouns = [
      "Tiger",
      "Panda",
      "Ninja",
      "Wizard",
      "Falcon",
      "Lion",
      "Shark",
      "Eagle",
      "Knight",
      "Ghost",
      "Rotten",
      "Sick",
      "Sickly",
      "Janitor",
      "Camel",
      "Rooster",
      "Sand",
      "Desert",
      "Dessert",
      "Hurdle",
      "Racer",
      "Eraser",
      "Erase",
      "Big",
      "Small",
      "Short",
      "Tall",
      "Sith",
      "Bounty",
      "Hunter",
      "Cracked",
      "Broken",
      "Sad",
      "Happy",
      "Joy",
      "Joyful",
      "Crimson",
      "Destiny",
      "Deceit",
      "Lies",
      "Lie",
      "Honest",
      "Destined",
      "Bloxxer",
      "Hawk",
      "Eagle",
      "Hawker",
      "Walker",
      "Zombie",
      "Sarge",
      "Capt",
      "Captain",
      "Punch",
      "One",
      "Two",
      "Uno",
      "Slice",
      "Slash",
      "Melt",
      "Melted",
      "Melting",
      "Fell",
      "Wolf",
      "Hound",
      "Legacy",
      "Sharp",
      "Dead",
      "Mew",
      "Chuckle",
      "Bubba",
      "Bubble",
      "Sandwich",
      "Smasher",
      "Extreme",
      "Multi",
      "Universe",
      "Ultimate",
      "Death",
      "Ready",
      "Monkey",
      "Elevator",
      "Wrench",
      "Grease",
      "Head",
      "Theme",
      "Grand",
      "Cool",
      "Kid",
      "Boy",
      "Girl",
      "Vortex",
      "Paradox",
   ];

   const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
   const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
   const randomNumber = Math.floor(Math.random() * 100);
   return `${randomAdjective}${randomNoun}${randomNumber}`;
}

async function generateUserFriendlyPassword(length) {
   const upper = "ABCDEFGHIJKLMNPQRSTUVWXYZ";
   const lower = "abcdefghijkmnopqrstuvwxyz";
   const numbers = "1234567890";
   const symbols = "!@#$%^&*()-_=+[]{};:,.<>?";

   const allChars = upper + lower + numbers + symbols;
   let password = "";

   password += upper[Math.floor(Math.random() * upper.length)];
   password += lower[Math.floor(Math.random() * lower.length)];
   password += numbers[Math.floor(Math.random() * numbers.length)];
   password += symbols[Math.floor(Math.random() * symbols.length)];

   for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
   }

   // Shuffle the result
   return password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");
}

async function showConfirmModal(message) {
   return new Promise((resolve) => {
      const modal = document.getElementById("confirmModal");
      const messageElement = document.getElementById("confirmMessage");
      const yesBtn = document.getElementById("confirmYes");
      const noBtn = document.getElementById("confirmNo");

      messageElement.textContent = message;
      modal.classList.remove("hidden");

      const cleanup = () => {
         modal.classList.add("hidden");
         yesBtn.onclick = null;
         noBtn.onclick = null;
      };

      yesBtn.onclick = () => {
         cleanup();
         resolve(true);
      };

      noBtn.onclick = () => {
         cleanup();
         resolve(false);
      };
   });
}

export {
   isMasterPasswordExist,
   getMasterPassWordInput,
   setStatusMessage,
   injectNavbar,
   addTableInteractions,
   monitorAppInactivity,
   generateUsername,
   generateUserFriendlyPassword,
   showConfirmModal,
};
