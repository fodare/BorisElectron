import {
   setStatusMessage,
   generateUsername,
   generateUserFriendlyPassword,
   showConfirmModal,
} from "./helper.js";

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
      setStatusMessage("Error",accounts.error);
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

async function accountAlreadyExist(newAccountNameInput) {
   const { success, data } = await getSavedAccounts();
   return (
      success && data.some((account) => account.name === newAccountNameInput)
   );
}

async function setUpAddAccountPageIntractions() {
   const saveAccountBtn = document.getElementById("addAccountBtn");
   const generateRandomInfoBtn = document.getElementById("generateAccountBtn");
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
         setStatusMessage("Error","Account name is required!");
         return;
      }
      if (await accountAlreadyExist(accountName)) {
         setStatusMessage("Error",
            `An account with the name ${accountName} already exists!`
         );
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

   generateRandomInfoBtn?.addEventListener("click", async (event) => {
      event.preventDefault();
      const randomPassword = await generateUserFriendlyPassword(20);
      const randomUserName = await generateUsername();

      const userNameInput = document.getElementById("usernameInput");
      const passwordInput = document.getElementById("passwordInput");

      if (userNameInput) {
         userNameInput.value = "";
         userNameInput.value = randomUserName;
      }

      if (passwordInput) {
         passwordInput.value = "";
         passwordInput.value = randomPassword;
      }
   });

   document.addEventListener("keydown", async (event) => {
      if (event.key === "Escape") {
         const accountName = document.getElementById("accountNameInput")?.value;
         const userName = document.getElementById("usernameInput")?.value;
         const passwordinput = document.getElementById("passwordInput")?.value;
         const urlinput = document.getElementById("urlInput")?.value;
         const accountNote = document.getElementById("accountNote")?.value;
         if (
            accountName ||
            userName ||
            passwordinput ||
            urlinput ||
            accountNote
         ) {
            const confirmEscape = await showConfirmModal(
               "Are you sure you want to exit window ? All info enterd without saving will be lost!"
            );
            if (confirmEscape) {
               await window.electronAPI.closeAddAccountWindow();
               await refreshAccountsTable();
            }
         } else {
            await window.electronAPI.closeAddAccountWindow();
            await refreshAccountsTable();
         }
      }
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
   setStatusMessage("Info",saveAccountResponse.message);
   if (saveAccountResponse.success) {
      await window.electronAPI.notifyAccountAdded();
      setTimeout(() => {
         window.electronAPI.closeAddAccountWindow();
      }, 3500);
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
         <td class="hidden-note">${account.notes}</td>
      `;
      tableBody.appendChild(row);
   });
}

async function refreshAccountsTable() {
   const accounts = await getSavedAccounts();
   if (accounts.success) {
      injectAccountsIntoTable(accounts.data);
   } else {
      setStatusMessage("Error",accounts.error);
   }
}

async function handleAddAccount() {
   await renderAddAccountWindow();
}

async function handleSearchAccount() {
   const accountNameInput = getSearchInputValue();
   const savedAccounts = await getSavedAccounts();
   if (!savedAccounts.success) {
      setStatusMessage("Error",savedAccounts.message);
      return;
   }

   const searchedAccount = savedAccounts.data.find(
      (account) => account.name === accountNameInput
   );

   if (searchedAccount) {
      injectAccountsIntoTable(searchedAccount);
   } else {
      setStatusMessage("Info",`There are no account with the name ${accountNameInput}!`
      );
   }
}

function getSearchInputValue() {
   return document.getElementById("accountNameInput")?.value.trim() || "";
}

async function setUpUpdateAccountInteractions() {
   const accountNameElement = document.getElementById("accountName");
   const usernameElement = document.getElementById("accountUsername");
   const passwordElement = document.getElementById("accountPassword");
   const urlElement = document.getElementById("accountUrl");
   const notesElement = document.getElementById("accountNotes");

   let oldAccountName = null; // User might want to update account name

   window.electronAPI.requestUpdateData();
   window.electronAPI.onReceiveUpdateData((data) => {
      if (!data) return;

      accountNameElement.value = data.name || "";
      usernameElement.value = data.userName || "";
      passwordElement.value = data.password || "";
      urlElement.value = data.url || "";
      notesElement.value = Array.isArray(data.notes)
         ? data.notes.join("\n")
         : data.notes || "";

      oldAccountName = accountNameElement.value;

      document
         .getElementById("updateAccountBtn")
         ?.addEventListener("click", async (event) => {
            event.preventDefault();
            const updatedAccountInfo = {
               name: accountNameElement.value,
               userName: usernameElement.value,
               password: passwordElement.value,
               url: urlElement.value,
               notes: notesElement.value.split(/\r?\n/).filter(Boolean),
            };

            if (!updatedAccountInfo.name) {
               setStatusMessage("Error","Account name can not be null / empty!");
               return;
            }

            const updateAccountResponse =
               await window.electronAPI.updateAccount(
                  oldAccountName,
                  updatedAccountInfo
               );

            setStatusMessage("Info",updateAccountResponse.message);

            if (updateAccountResponse.success) {
               setTimeout(() => {
                  window.close();
               }, 3500);
            }
         });
   });
}

export {
   setupCredentialPageInteractions,
   setUpAddAccountPageIntractions,
   setUpUpdateAccountInteractions,
   refreshAccountsTable,
};
