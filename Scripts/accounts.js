import { setStatusMessage } from "./helper.js";

async function setupCredentialPageInteractions() {
   window.electronAPI.onRefreshAccounts(async () => {
      await refreshAccountsTable();
   });
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

   accountInput.addEventListener("input", async () => {
      const isEmpty = accountInput.value.trim() === "";
      toggleButtons(!isEmpty);
      if (isEmpty) {
         await refreshAccountsTable();
      }
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

   const accounts = await getSavedAccounts();
   if (accounts.success) {
      injectAccountsIntoTable(accounts.data);
   } else {
      setStatusMessage(accounts.error);
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
   setStatusMessage(saveAccountResponse.message);
   if (saveAccountResponse.success) {
      await window.electronAPI.notifyAccountAdded();
      setTimeout(() => {
         window.electronAPI.closeAddAccountWindow();
      }, 100);
   }
}

async function getSavedAccounts() {
   return await window.electronAPI.readSavedAccounts();
}

function injectAccountsIntoTable(accounts) {
   const tableBody = document.getElementById("credentialsTableBody");
   tableBody.innerHTML = "";
   const accountArray = Array.isArray(accounts) ? accounts : [accounts];
   accountArray.forEach((account) => {
      const row = document.createElement("tr");
      row.innerHTML = `
         <td>${account.name}</td>
         <td>${account.userName}</td>
         <td class="hidetext">${account.password}</td>
         <td>${account.url}</td>
      `;
      tableBody.appendChild(row);
   });
}

async function refreshAccountsTable() {
   const accounts = await getSavedAccounts();
   if (accounts.success) {
      injectAccountsIntoTable(accounts.data);
   } else {
      setStatusMessage(accounts.error);
   }
}

async function handleAddAccount() {
   await renderAddAccountWindow();
}

async function handleSearchAccount() {
   const accountNameInput = getSearchInputValue();
   const savedAccounts = await getSavedAccounts();
   if (!savedAccounts.success) {
      setStatusMessage(savedAccounts.message);
      return;
   }

   const searchedAccount = savedAccounts.data.find(
      (account) => account.name === accountNameInput
   );

   if (searchedAccount) {
      injectAccountsIntoTable(searchedAccount);
   } else {
      setStatusMessage(
         `There are no account with the name ${accountNameInput}!`
      );
   }
}

function getSearchInputValue() {
   return document.getElementById("accountNameInput")?.value.trim() || "";
}

export { setupCredentialPageInteractions, setUpAddAccountPageIntractions };
