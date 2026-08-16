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
   await readNotes();

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
      setTimeout(async () => {
         noteform.hide();
         await readNotes();
      }, 1000);
   } else {
      setStatusMessage("Error", saveNoteResponse.message);
   }
}

async function readNotes() {
   const notesResponse = await window.electronAPI.readSavedNotes();

   if (!notesResponse.success) {
      setStatusMessage("Error", notesResponse.message);
      return;
   }

   const notes = notesResponse.data || [];

   if (notes.length === 0) {
      renderNotes([]);
      setStatusMessage("Info", "No saved notes found.");
      return;
   }

   renderNotes(notes);
}

function renderNotes(notes) {
   const notesContents = document.querySelector(".notesContents");

   if (!notesContents) {
      return;
   }

   let notesList = document.getElementById("notesList");

   if (!notesList) {
      notesList = document.createElement("div");
      notesList.id = "notesList";
      notesContents.appendChild(notesList);
   }

   notesList.innerHTML = "";

   if (notes.length === 0) {
      return;
   }

   const accordion = document.createElement("div");
   accordion.classList.add("accordion");
   accordion.id = "notesAccordion";

   notes.forEach((note, index) => {
      accordion.appendChild(createNoteWidget(note, index));
   });

   notesList.appendChild(accordion);
}

function createNoteWidget(note, index) {
   const item = document.createElement("div");

   item.classList.add("accordion-item", "note-item");

   // Store the persistent note ID on the widget
   item.dataset.noteId = note.noteId;

   const headingId = `noteHeading${index}`;
   const collapseId = `noteCollapse${index}`;

   item.innerHTML = `
      <h2 class="accordion-header" id="${headingId}">
         <button
            class="accordion-button collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#${collapseId}"
            aria-expanded="false"
            aria-controls="${collapseId}"
         >
            ${escapeHtml(note.noteTitle)}
         </button>
      </h2>

      <div
         id="${collapseId}"
         class="accordion-collapse collapse"
         aria-labelledby="${headingId}"
      >
         <div class="accordion-body note-body"></div>
      </div>
   `;

   const noteBody = item.querySelector(".note-body");

   if (noteBody) {
      noteBody.textContent = note.noteText ?? "";
   }

   return item;
}

function escapeHtml(text) {
   const div = document.createElement("div");
   div.textContent = text ?? "";
   return div.innerHTML;
}

export { setupNoteInteractions };
