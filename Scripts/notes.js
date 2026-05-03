import {
   setStatusMessage,
   generateUsername,
   generateUserFriendlyPassword,
   showConfirmModal,
} from "./helper.js";

async function setupNoteInteractions() {
   const searchText = document.getElementById("searchText");
   const searchBtn = document.getElementById("searchBtn");
   const addNoteBtn = document.getElementById("addNote");

   if (!searchText || !searchBtn || !addNoteBtn) {
      return;
   }

   function toggleSearchButton(showSearch) {
      searchBtn.style.display = showSearch ? "inline-block" : "none";
      addNoteBtn.style.display = showSearch ? "none" : "inline-block";
   }

   toggleSearchButton(false);

   searchText.addEventListener("focus", () => {
      toggleSearchButton(searchText.value.trim() !== "");
   });

   searchText.addEventListener("blur", () => {
      setTimeout(() => toggleSearchButton(false), 150);
   });

   searchText.addEventListener("input", async () => {
      const isEmpty = searchText.value.trim() === "";
      toggleSearchButton(!isEmpty);
      if (isEmpty) {
         // Todo: Refresh the notes
         return;
      }
   });

   searchBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      // Todo: handleNoteSearch()
      setStatusMessage("info", "Search button search");
   });

   addNoteBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      // Todo: handleAddNote()
      setStatusMessage("Info", "Add note button clicked");
   });
}

export { setupNoteInteractions };
