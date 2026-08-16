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

   const noteFormCollapse = document.getElementById("noteFormCollapse");
   const cancelNoteBtn = document.getElementById("cancel_note_btn");

   const saveNoteBtn = document.getElementById("save_notet_btn");

   if (!searchText || !searchBtn || !addNoteBtn || !noteFormCollapse) {
      return;
   }

   const noteform = new bootstrap.Collapse(noteFormCollapse, { toggle: false });

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

   addNoteBtn?.addEventListener("click", async (event) => {
      event.preventDefault();
      // Todo: handleAddNote()
      noteform.show();
      document.getElementById("input_note_title")?.focus();
   });

   cancelNoteBtn?.addEventListener("click", async (event) => {
      event.preventDefault();
      noteform.hide();
   });

   saveNoteBtn?.addEventListener("click", async (event) => {
      event.preventDefault();
      const noteData = getNoteInputs();
      if (!noteData.noteTitle || !noteData.noteText) {
         setStatusMessage("Error", "Note title and text are required!");
         return;
      }
      await saveNoteInfo(noteData, noteform);
      return;
   });
}

function getNoteInputs() {
   return {
      noteTitle:
         document.getElementById("input_note_title")?.value.trim() || "",
      noteText: document.getElementById("input_note_text")?.value.trim() || "",
   };
}

function clearNoteForm() {
   const noteTitle = document.getElementById("input_note_title");
   const noteText = document.getElementById("input_note_text");

   if (noteTitle) {
      noteTitle.value = "";
   }

   if (noteText) {
      noteText.value = "";
   }
}

async function saveNoteInfo(noteData, noteform) {
   const saveNoteResponse = await window.electronAPI.recordNote(noteData);
   if (saveNoteResponse.success) {
      setStatusMessage("success", saveNoteResponse.message);
      clearNoteForm();
      setTimeout(() => {
         noteform.hide();
      }, 1000);
   } else {
      setStatusMessage("Error", saveNoteResponse.message);
   }
}

export { setupNoteInteractions };
