import { setStatusMessage } from "./helper.js";

async function setupFinancesInteractions() {
   window.electronAPI.onRefreshTransaction(async (event, ...args) => {
      await refreshTransactionsTable();
   });
   const transactionsTypeInput = document.getElementById("transactionInput");
   const searchBtn = document.getElementById("searchBtn");
   const addTransactionsBtn = document.getElementById("addTransctionBtn");

   if (!transactionsTypeInput || !searchBtn || !addTransactionsBtn) {
      return;
   }

   function toggleButtons(showSearch) {
      searchBtn.style.display = showSearch ? "inline-block" : "none";
      addTransactionsBtn.style.display = showSearch ? "none" : "inline-block";
   }

   toggleButtons(false);

   transactionsTypeInput.addEventListener("focus", () => {
      toggleButtons(transactionsTypeInput.value.trim() !== "");
   });

   transactionsTypeInput.addEventListener("blur", () => {
      setTimeout(() => toggleButtons(false), 150);
   });

   transactionsTypeInput.addEventListener("input", async () => {
      const isEmpty = transactionsTypeInput.value.trim() === "";
      toggleButtons(!isEmpty);
      if (isEmpty) {
         //await refreshAccountsTable();
      }
   });

   searchBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      //setStatusMessage("Search button clicked!");
   });

   addTransactionsBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      await window.electronAPI.renderAddTransactionWindow();
   });

   await addTableInteractions("transactionstableBody");

   const transactions = await window.electronAPI.readSavedTransactions();
   if (transactions.success) {
      const sortedTransaction = await sortTransactionByDataDesc(
         transactions.data
      );
      await injectTransactionsIntoTable(sortedTransaction);
      await calculateTotals(sortedTransaction);
   } else {
      setStatusMessage(transactions.error);
   }
}

async function setupAddTransactionInteractions() {
   const addTransactionBtn = document.getElementById("addTransactionBtn");

   addTransactionBtn?.addEventListener("click", async (event) => {
      event.preventDefault();
      const { isValid, errors } = await validateTransactionForm();
      if (!isValid) {
         setStatusMessage(errors.join(" "));
         return;
      }
      const transactionData = await getTransactionFormInput();
      const recordTransactionResponse =
         await window.electronAPI.recordTransaction(transactionData);
      setStatusMessage(recordTransactionResponse.message);
      if (recordTransactionResponse.success) {
         window.electronAPI.notifyTransactionAdded();
         setTimeout(async () => {
            await window.electronAPI.closeAddTransactionWindow();
         }, 3500);
      }
   });

   document.addEventListener("keydown", async (event) => {
      if (event.key === "Escape") {
         await window.electronAPI.closeAddTransactionWindow();
      }
   });
}

async function getTransactionFormInput() {
   const transactionDate = document.getElementById("transactionDate")?.value;
   const transactionType = document.getElementById("transactionType")?.value;
   const transactionCategory = document.getElementById(
      "transactionCategory"
   )?.value;
   const transactionAmount = parseFloat(
      document.getElementById("transactionAmount")?.value
   );
   const transactionNote = document.getElementById("transactionNote")?.value;
   const transactionId = await generateID();
   return {
      transactionId,
      transactionDate,
      transactionType,
      transactionCategory,
      transactionAmount,
      transactionNote,
   };
}

async function validateTransactionForm() {
   const {
      transactionId,
      transactionDate,
      transactionType,
      transactionCategory,
      transactionAmount,
      transactionNote,
   } = await getTransactionFormInput();

   const errors = [];

   if (!transactionId || transactionId == "") {
      errors.push(
         "Problem with id genetation. Tansaction ID can not be null / empty!"
      );
   }

   if (!transactionDate) {
      errors.push("Transaction date is required!");
   } else {
      const selectedDate = new Date(transactionDate);
      selectedDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
         errors.push("Transaction date cannot be in the future.");
      }
   }

   if (!transactionType) {
      errors.push("Transaction type is required.");
   } else if (!["credit", "debit"].includes(transactionType)) {
      errors.push("Transaction type must be credit or debit.");
   }

   if (!transactionCategory || transactionCategory.trim() === "") {
      errors.push("Transaction category is required.");
   }

   if (isNaN(transactionAmount)) {
      errors.push("Transaction amount must be a number.");
   } else if (transactionAmount <= 0) {
      errors.push("Transaction amount must be greater than zero.");
   }

   return {
      isValid: errors.length === 0,
      errors,
   };
}

async function injectTransactionsIntoTable(transactions) {
   const transactionsTableBody = document.getElementById(
      "transactionstableBody"
   );
   transactionsTableBody.innerHTML = "";
   const transactionsArray = Array.isArray(transactions)
      ? transactions
      : [transactions];
   transactionsArray.forEach((transaction) => {
      const row = document.createElement("tr");

      function escapeHtml(text) {
         return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
      }

      const noteEscaped = escapeHtml(transaction.transactionNote || "");
      row.innerHTML = `
         <td class="hidden-note">${transaction.transactionId}</td>
         <td>${transaction.transactionDate}</td>
         <td>${transaction.transactionType}</td>
         <td>${transaction.transactionCategory}</td>
         <td>${transaction.transactionAmount}</td>
         <td class="tooltip-container">
            ${
               noteEscaped.length > 30
                  ? noteEscaped.substring(0, 30) + "..."
                  : noteEscaped
            }
            <span class="tooltip-text">${noteEscaped}</span>
         </td>
      `;
      transactionsTableBody.appendChild(row);
   });
}

async function refreshTransactionsTable() {
   const transactions = await window.electronAPI.readSavedTransactions();
   if (transactions.success) {
      const sortedTransaction = await sortTransactionByDataDesc(
         transactions.data
      );
      await injectTransactionsIntoTable(sortedTransaction);
      await calculateTotals(sortedTransaction);
   } else {
      setStatusMessage(transactions.error);
   }
}

async function sortTransactionByDataDesc(transactions) {
   return transactions.sort(
      (a, b) => new Date(b.transactionDate) - new Date(a.transactionDate)
   );
}

async function calculateTotals(transactions) {
   const totals = {
      credit: 0,
      debit: 0,
   };

   transactions.forEach((tx) => {
      if (tx.transactionType === "credit") {
         totals.credit += tx.transactionAmount;
      } else if (tx.transactionType === "debit") {
         totals.debit += tx.transactionAmount;
      }
   });

   const balance = totals.credit - totals.debit;
   const round = (amount) => amount.toFixed(2);

   const totalsContainer = document.getElementById("tranctionsTotals");
   if (!totalsContainer) return;

   totalsContainer.innerHTML = `
      <div class="col-12 col-md-4 mb-2">
         <div class="alert alert-success text-center">
            <strong>Total Credit</strong><br>${round(totals.credit)}
         </div>
      </div>
      <div class="col-12 col-md-4 mb-2">
         <div class="alert alert-danger text-center">
            <strong>Total Debit</strong><br>${round(totals.debit)}
         </div>
      </div>
      <div class="col-12 col-md-4 mb-2">
         <div class="alert alert-primary text-center">
            <strong>Total Balance</strong><br>${round(balance)}
         </div>
      </div>
   `;
}

async function generateID() {
   return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

async function addTableInteractions(tableBodyId) {
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

   document.addEventListener("keydown", async (event) => {
      if (!selectedCell) {
         return;
      }

      if (event.key === "Delete") {
         event.preventDefault();
         if (selectedRow) {
            const confirmDeletion = confirm(
               "Are you sure you want to delete this entry?. Please note action is not reversible!"
            );
            if (confirmDeletion) {
               const cells = selectedRow.querySelectorAll("td");
               const tranactionID = cells[0]?.textContent;
               const delettionResult =
                  await window.electronAPI.deletetransaction(tranactionID);

               setStatusMessage(delettionResult.message);
               if (delettionResult.success) {
                  await refreshTransactionsTable();
               }
            }
         }
      }
   });
}

export { setupFinancesInteractions, setupAddTransactionInteractions };
