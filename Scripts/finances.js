import { setStatusMessage } from "./helper.js";

async function setupFinancesInteractions() {
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
}

async function setupAddTransactionInteractions() {
   const addTransactionBtn = document.getElementById("addTransactionBtn");
   
   addTransactionBtn?.addEventListener("click", async (event) => {
      event.preventDefault();
      const { isValid, errors } = await validateTransactionForm();
      if (!isValid) {
         setStatusMessage(errors.join(' '));
         return;
      }
      const transactionData = await getTransactionFormInput();
      const recordTransactionResponse = await window.electronAPI.recordTransaction(transactionData)
      setStatusMessage(recordTransactionResponse.success);
   });

   document.addEventListener("keydown", async(event)=>{
      if(event.key === "Escape"){
         await window.electronAPI.closeAddTransactionWindow();
      }
   });
}

async function getTransactionFormInput(){
   const transactionDate = document.getElementById("transactionDate")?.value;
   const transactionType = document.getElementById("transactionType")?.value;
   const transactionCategory = document.getElementById("transactionCategory")?.value;
   const transactionAmount = parseFloat(document.getElementById("transactionAmount")?.value);
   const transactionNote = document.getElementById("transactionNote")?.value;
   return {
      transactionDate,transactionType,transactionCategory,transactionAmount,transactionNote
   }
}

async function validateTransactionForm() {
      const {
         transactionDate,
         transactionType,
         transactionCategory,
         transactionAmount,
         transactionNote} = await getTransactionFormInput();

      const errors = [];
      if (!transactionDate) {
         errors.push('Transaction date is required!');
      } else {
         const selectedDate = new Date(transactionDate);
         selectedDate.setHours(0, 0, 0, 0);
         const today = new Date();
         today.setHours(0, 0, 0, 0);
         if (selectedDate > today) {
            errors.push('Transaction date cannot be in the future.');
         }
      }

      if (!transactionType) {
         errors.push('Transaction type is required.');
      } else if (!['credit', 'debit'].includes(transactionType)) {
         errors.push('Transaction type must be credit or debit.');
      }

      if (!transactionCategory || transactionCategory.trim() === "") {
         errors.push('Transaction category is required.');
      }

      if (isNaN(transactionAmount)) {
         errors.push('Transaction amount must be a number.');
      } else if (transactionAmount <= 0) {
         errors.push('Transaction amount must be greater than zero.');
      }

      return {
         isValid: errors.length === 0,
         errors
      };
}

export { setupFinancesInteractions, setupAddTransactionInteractions };
