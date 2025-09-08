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

export { setupFinancesInteractions };
