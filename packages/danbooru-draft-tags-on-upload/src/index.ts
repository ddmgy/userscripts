const DB_NAME: string = "danbooru-draft-tags-on-upload";
const DB_VERSION: number = 1;
const UPLOAD_TABLE_NAME: string = "uploads";
const DRAFT_TABLE_NAME: string = "drafts";

const TAB: string = `<a class="tab drafts-tab" x-on:click.prevent="active = 4" x-bind:class="{ 'active-tab': active === 4 }" href="#">Drafts</a>`;

const TAB_PANEL: string = `
<div class="tab-panel drafts-tab" x-bind:class="{ 'active-tab': active === 4 }">
  <div class="flex justify-between">
    <label for="ddtou-delete-after">Delete after:</label>
    <span>
      <input id="ddtou-delete-after" type="text" placeholder="1 week" required pattern="\\d+\\s*(year|month|week|day|hour)s?"/>
      <span class="question-mark-icon" title="Must be a number, followed by one of [year, month, week, day, hour], followed by an optional 's'"></span>
      <button id="ddtou-set-delete-after" class="ui-button ui-widget ui-corner-all">Set</button>
    </span>
  </div>
  <div class=divider></div>
  <div class="flex justify-between">
    <span>
      <input id="ddtou-select-all" type="checkbox" name="select-all" title="Select/deselect all" />
      <button id="ddtou-delete-selected" class="ui-button ui-widget ui-corner-all" disabled>Delete selected</button>
    </span>
    <button id="ddtou-save-draft" class="ui-button ui-widget ui-corner-all">Save draft</button>
  </div>
  <div id="ddtou-drafts-list"></div>
</div>
`;

const CSS: string = `
input:invalid {
  border: var(--error-color) solid 2px;
}
.divider {
  border-top: 1px solid var(--form-button-disabled-text-color);
  margin-top: 1rem;
  margin-bottom: 1rem;
}
#ddtou-select-all {
  margin-left: 1rem;
}
#ddtou-delete-selected {
  margin-left: 1rem;
}
#ddtou-drafts-list {
  max-height: 400px;
  width: 100%;
  overflow: hidden;
  overflow-y: scroll;
  margin-top: 1rem;
}
.ddtou-draft {
  height: 1rem;
  width: 100%;
  padding: 2rem 1rem;
  display: flex;
  align-items: center;
}
.ddtou-draft:nth-of-type(even) {
  background: var(--table-even-row-background);
}
.ddtou-draft:hover {
  background: var(--table-row-hover-background);
}
.ddtou-draft label {
  margin-left: 1rem;
}
`;

const DELETE_AFTER_RE = /(\d+)\s*(year|month|week|day|hour)s?/;
const DEFAULT_DELETE_AFTER: string = "1 week";
const MILLISECONDS_PER = {
  hour: 3_600_000,
  day: 86_400_000, // 24 hours
  week: 604_800_000, // 7 days
  month: 2_678_400_000, // 31 days
  year: 31_536_000_000, // 365 days
};

function log(msg: any): void {
  console.log(`[danbooru-draft-tags-on-upload] ${msg}`);
}

function error(error: any): void {
  console.error(`[danbooru-draft-tags-on-upload] ${error}`);
}

function currentTimeInMillis(): number { return new Date().getTime(); }

function parseDeleteAfter(deleteAfter: string): number {
  const match = DELETE_AFTER_RE.exec(deleteAfter)!;
  const scalar = +match[1];
  const key = match[2] as (keyof typeof MILLISECONDS_PER);
  return scalar * MILLISECONDS_PER[key];
}

type Upload = {
  mediaAssetId: number,
  deleteAfter: string,
  updatedAt: number,
};

type Draft = {
  id: number,
  mediaAssetId: number,
  rating: string | undefined,
  tags: string,
  source: string,
  originalTitle: string,
  originalDescription: string,
  translatedTitle: string,
  translatedDescription: string,
  parentId: string,
  timestamp: number,
};

type PreDraft = Omit<Draft, "id">;

class DB {
  private db: IDBDatabase;

  constructor(db: IDBDatabase) {
    this.db = db;
  }

  addUpload(upload: Upload): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(UPLOAD_TABLE_NAME, "readwrite");
      const store = transaction.objectStore(UPLOAD_TABLE_NAME);
      const request = store.add(upload);

      transaction.addEventListener("error", (e) => {
        error(`Error adding upload: ${e}`);
        resolve(false);
      });

      request.addEventListener("success", (e) => {
        resolve(true);
      });
    });
  }

  addDraft(draft: PreDraft): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(DRAFT_TABLE_NAME, "readwrite");
      const store = transaction.objectStore(DRAFT_TABLE_NAME);
      const request = store.add(draft);

      transaction.addEventListener("error", (e) => {
        error(`Error adding draft: ${e}`);
        resolve(false);
      });

      request.addEventListener("success", (e) => {
        resolve(true);
      });
    });
  }

  private clear(table: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(table, "readwrite");
      const store = transaction.objectStore(table);
      const request = store.clear();

      transaction.addEventListener("error", (e) => {
        error(`Error clearing table "${table}": ${e}*-`)
        resolve(false);
      });

      request.addEventListener("success", (e) => {
        resolve(true);
      });
    });
  }

  clearUploads(): Promise<boolean> {
    return this.clear(UPLOAD_TABLE_NAME);
  };

  clearDrafts(): Promise<boolean> {
    return this.clear(DRAFT_TABLE_NAME);
  }

  deleteUpload(mediaAssetId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(UPLOAD_TABLE_NAME, "readwrite");
      const store = transaction.objectStore(UPLOAD_TABLE_NAME);
      const request = store.delete(mediaAssetId);

      transaction.addEventListener("error", (e) => {
        error(`Error deleting upload: ${e}`);
        resolve(false);
      });

      request.addEventListener("success", (e) => {
        const transaction = this.db.transaction(DRAFT_TABLE_NAME, "readwrite");
        const store = transaction.objectStore(DRAFT_TABLE_NAME);
        const index = store.index("mediaAssetId");
        const cursor = index.openCursor();

        cursor.addEventListener("success", function (e) {
          const cursor = this.result;
          if (!cursor) {
            return;
          }

          if (cursor.value.mediaAssetId === mediaAssetId) {
            cursor.delete();
          }

          cursor.continue();
        });

        transaction.addEventListener("error", (e) => {
          error(`Error deleting drafts for ${mediaAssetId}: ${e}`);
          resolve(false);
        });

        transaction.addEventListener("complete", (e) => {
          resolve(true);
        });
      });
    });
  }

  deleteDraft(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(DRAFT_TABLE_NAME, "readwrite");
      const store = transaction.objectStore(DRAFT_TABLE_NAME);
      const request = store.delete(id);

      transaction.addEventListener("error", (e) => {
        error(`Error deleting draft: ${e}`);
        resolve(false);
      });

      request.addEventListener("success", (e) => {
        resolve(true);
      });
    });
  }

  deleteOld(timestamp: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const transaction = this.db.transaction(UPLOAD_TABLE_NAME, "readwrite");
      const store = transaction.objectStore(UPLOAD_TABLE_NAME);
      const index = store.index("mediaAssetId");
      const cursor = index.openCursor();
      const db = this;

      cursor.addEventListener("error", (e) => {
        error(`Error deleting old uploads: ${e}`);
      });

      cursor.addEventListener("success", function (e) {
        const cursor = this.result;
        if (!cursor) {
          error(`Error opening upload cursor`);
          return;
        }

        const deleteAfter = parseDeleteAfter(cursor.value.deleteAfter);
        if (timestamp - deleteAfter <= cursor.value.updatedAt) {
          log(`deleting upload: ${cursor.value.mediaAssetId}`);
          cursor.delete();

          const mediaAssetId = cursor.value.mediaAssetId;
          const draftTransaction = db.db.transaction(DRAFT_TABLE_NAME, "readwrite");
          const draftStore = draftTransaction.objectStore(DRAFT_TABLE_NAME);
          const draftIndex = draftStore.index("mediaAssetId");
          const draftCursor = draftIndex.openCursor();

          draftCursor.addEventListener("error", (e) => {
            error(`Error deleting old drafts: ${e}`);
          });

          draftCursor.addEventListener("success", function (e) {
            const cursor = this.result;
            if (!cursor) {
              error(`Error opening draft cursor`);
              return;
            }

            if (cursor.value.mediaAssetId === mediaAssetId) {
              cursor.delete();
            }

            cursor.continue();
          });
        }

        cursor.continue();
      });
    });
  }

  getUpload(mediaAssetId: number): Promise<Upload | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(UPLOAD_TABLE_NAME, "readonly");
      const store = transaction.objectStore(UPLOAD_TABLE_NAME);
      const request = store.get(mediaAssetId);

      transaction.addEventListener("error", (e) => {
        error(`Error getting upload: ${e}`);
        resolve(null);
      });

      request.addEventListener("success", function (e) {
        resolve(this.result as Upload);
      });
    });
  }

  getDraft(id: number): Promise<Draft | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(DRAFT_TABLE_NAME, "readonly");
      const store = transaction.objectStore(DRAFT_TABLE_NAME);
      const request = store.get(id);

      transaction.addEventListener("error", (e) => {
        error(`Error getting draft: ${e}`);
        resolve(null);
      });

      request.addEventListener("success", function (e) {
        resolve(this.result as Draft);
      });
    });
  }

  getAllDrafts(mediaAssetId: number): Promise<Draft[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(DRAFT_TABLE_NAME, "readonly");
      const store = transaction.objectStore(DRAFT_TABLE_NAME);
      const index = store.index("mediaAssetId");
      const cursor = index.openCursor(null, "prev");
      const ret: Draft[] = [];

      cursor.addEventListener("success", function (e) {
        const cursor = this.result;
        if (!cursor) {
          return;
        }

        if (cursor.value.mediaAssetId === mediaAssetId) {
          ret.push(cursor.value as Draft);
        }

        cursor.continue();
      });

      transaction.addEventListener("error", (e) => {
        error(`Error getting drafts for ${mediaAssetId}: ${e}`);
        resolve([]);
      });

      transaction.addEventListener("complete", (e) => {
        resolve(ret);
      });
    });
  }

  putUpload(upload: Upload): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(UPLOAD_TABLE_NAME, "readwrite");
      const store = transaction.objectStore(UPLOAD_TABLE_NAME);
      const request = store.put(upload);

      transaction.addEventListener("error", (e) => {
        error(`Error putting upload: ${e}`)
        resolve(false);
      });

      request.addEventListener("success", (e) => {
        resolve(true);
      });
    });
  }

  putDraft(draft: Draft): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(DRAFT_TABLE_NAME, "readwrite");
      const store = transaction.objectStore(DRAFT_TABLE_NAME);
      const request = store.put(draft, "id");

      transaction.addEventListener("error", (e) => {
        error(`Error putting draft: ${e}`)
        resolve(false);
      });

      request.addEventListener("success", (e) => {
        resolve(true);
      });
    });
  }

  static initialize(): Promise<DB> {
    return new Promise((resolve, reject) => {
      const openOrCreate = window.indexedDB.open(DB_NAME, DB_VERSION);

      openOrCreate.addEventListener("upgradeneeded", function (e) {
        const db = this.result;

        db.addEventListener("error", () => {
          reject(new Error("Error loading DB"));
        });

        const uploadsTable = db.createObjectStore(UPLOAD_TABLE_NAME, {
          keyPath: "mediaAssetId",
        });
        uploadsTable.createIndex("mediaAssetId", "mediaAssetId", { unique: true });
        uploadsTable.createIndex("deleteAfter", "deleteAfter", { unique: false });
        uploadsTable.createIndex("updatedAt", "updatedAt", { unique: false });

        const draftsTable = db.createObjectStore(DRAFT_TABLE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        draftsTable.createIndex("id", "id", { unique: true });
        draftsTable.createIndex("mediaAssetId", "mediaAssetId", { unique: false });
        draftsTable.createIndex("rating", "rating", { unique: false });
        draftsTable.createIndex("tags", "tags", { unique: false });
        draftsTable.createIndex("source", "source", { unique: false });
        draftsTable.createIndex("originalTitle", "originalTitle", { unique: false });
        draftsTable.createIndex("originalDescription", "originalDescription", { unique: false });
        draftsTable.createIndex("translatedTitle", "translatedTitle", { unique: false });
        draftsTable.createIndex("translatedDescription", "translatedDescription", { unique: false });
        draftsTable.createIndex("parentId", "parentId", { unique: false });
        draftsTable.createIndex("timestamp", "timestamp", { unique: false });
      });

      openOrCreate.addEventListener("error", () => {
        reject(new Error("Error opening DB"));
      });

      openOrCreate.addEventListener("success", function () {
        resolve(new DB(this.result));
      });
    });
  }
}

class UploadsPage {
  private db: DB;
  private mediaAssetId: number;
  private $deleteAfterInput: HTMLInputElement;
  private $setDeleteAfterButton: HTMLButtonElement;
  private $selectAllCheckbox: HTMLInputElement;
  private $deleteSelectedButton: HTMLButtonElement;
  private $saveDraftButton: HTMLButtonElement;
  private $draftsList: HTMLDivElement;

  constructor(db: DB, mediaAssetId: number) {
    this.db = db;
    this.mediaAssetId = mediaAssetId;
    this.$deleteAfterInput = document.querySelector("#ddtou-delete-after") as HTMLInputElement;
    this.$setDeleteAfterButton = document.querySelector("#ddtou-set-delete-after") as HTMLButtonElement;
    this.$selectAllCheckbox = document.querySelector("#ddtou-select-all") as HTMLInputElement;
    this.$deleteSelectedButton = document.querySelector("#ddtou-delete-selected") as HTMLButtonElement;
    this.$saveDraftButton = document.querySelector("#ddtou-save-draft") as HTMLButtonElement;
    this.$draftsList = document.querySelector("#ddtou-drafts-list") as HTMLDivElement;
  }

  private async updateUpload(): Promise<void> {
    await this.db.putUpload({
      mediaAssetId: this.mediaAssetId,
      deleteAfter: this.$deleteAfterInput.value,
      updatedAt: currentTimeInMillis(),
    });
  }

  setupListeners(): void {
    this.$deleteAfterInput.addEventListener("submit", (e) => {
      e.preventDefault();

      this.updateUpload();
    });

    this.$setDeleteAfterButton.addEventListener("click", (e) => {
      e.preventDefault();

      this.updateUpload();
    });

    this.$selectAllCheckbox.addEventListener("click", (e) => {
      const drafts = document.querySelectorAll(".ddtou-draft");
      const checked = document.querySelectorAll(".ddtou-draft input:checked").length === 0;

      for (const draft of drafts) {
        (draft.querySelector("input") as HTMLInputElement).checked = checked;
      }

      this.$selectAllCheckbox.indeterminate = false;
      this.$selectAllCheckbox.checked = checked;
      this.$deleteSelectedButton.disabled = !checked;
    });

    this.$deleteSelectedButton.addEventListener("click", async (e) => {
      e.preventDefault();

      const drafts = document.querySelectorAll(".ddtou-draft");
      for (const draft of drafts) {
        if ((draft.querySelector("input") as HTMLInputElement).checked) {
          log(`deleting: id #${draft.getAttribute("data-id")}`);
          await this.db.deleteDraft(+draft.getAttribute("data-id")!);
          draft.parentElement?.removeChild(draft);
        }
      }

      this.$selectAllCheckbox.indeterminate = false;
      this.$selectAllCheckbox.checked = false;
      this.$deleteSelectedButton.disabled = true;
    });

    this.$saveDraftButton.addEventListener("click", async (e) => {
      e.preventDefault();

      await this.updateUpload();

      await this.db.addDraft({
        mediaAssetId: this.mediaAssetId,
        rating: (document.querySelector("span.radio input[type='radio']:checked") as HTMLInputElement)?.value,
        tags: (document.querySelector("#post_tag_string")! as HTMLTextAreaElement).value,
        source: (document.querySelector("#post_source")! as HTMLInputElement).value,
        originalTitle: (document.querySelector("#post_artist_commentary_title")! as HTMLInputElement).value,
        originalDescription: (document.querySelector("#post_artist_commentary_desc")! as HTMLInputElement).value,
        translatedTitle: (document.querySelector("#post_translated_commentary_title")! as HTMLInputElement).value,
        translatedDescription: (document.querySelector("#post_translated_commentary_desc")! as HTMLInputElement).value,
        parentId: (document.querySelector("#post_parent_id")! as HTMLInputElement).value,
        timestamp: currentTimeInMillis(),
      });

      log(`Saved draft for media asset: ${this.mediaAssetId}`);
      // @ts-ignore
      Danbooru.notice(`Saved draft for media asset: ${this.mediaAssetId}`);

      this.populateDraftList();
    });
  }

  updateSelected(): void {
    const drafts = document.querySelectorAll(".ddtou-draft");
    const checkedCount = document.querySelectorAll(".ddtou-draft input:checked").length;

    this.$deleteSelectedButton.disabled = checkedCount === 0;

    if (checkedCount === 0) {
      this.$selectAllCheckbox.indeterminate = false;
      this.$selectAllCheckbox.checked = false;
    } else if (checkedCount === drafts.length) {
      this.$selectAllCheckbox.indeterminate = false;
      this.$selectAllCheckbox.checked = true;
    } else {
      this.$selectAllCheckbox.indeterminate = true;
      this.$selectAllCheckbox.checked = false;
    }
  }

  async populateDraftList(): Promise<void> {
    this.$draftsList.innerHTML = "";

    const drafts = await this.db.getAllDrafts(this.mediaAssetId);
    for (const draft of drafts) {
      this.$draftsList.append(this.createDraftElement(draft));
    }
  }

  createDraftElement(draft: Draft): HTMLDivElement {
    const el = document.createElement("div") as HTMLDivElement;
    el.classList.add("ddtou-draft");
    el.classList.add("flex");
    el.classList.add("justify-between");
    el.setAttribute("data-id", draft.id.toString());

    const span = document.createElement("span") as HTMLSpanElement;
    const cb = document.createElement("input") as HTMLInputElement;
    cb.classList.add("ddtou-select");
    cb.type = "checkbox";
    cb.addEventListener("click", (e) => {
      this.updateSelected();
    });

    const label = document.createElement("label") as HTMLLabelElement;
    label.setAttribute("for", "ddtou-select");
    label.classList.add("ddtou-timestamp");
    label.innerText = new Date(draft.timestamp).toString();

    span.append(cb);
    span.append(label);

    const loadButton = document.createElement("button") as HTMLButtonElement;
    loadButton.classList.add("ui-button");
    loadButton.classList.add("ui-widget");
    loadButton.classList.add("ui-corner-all");
    loadButton.textContent = "Load";

    loadButton.addEventListener("click", async (e) => {
      e.preventDefault();

      const {
        rating,
        tags,
        source,
        originalTitle,
        originalDescription,
        translatedTitle,
        translatedDescription,
        parentId,
      } = draft;

      if (rating !== undefined) {
        (document.querySelector(`#post_rating_${rating}`)! as HTMLInputElement).checked = true;
      }

      (document.querySelector("#post_tag_string")! as HTMLTextAreaElement).value = tags;
      (document.querySelector("#post_source")! as HTMLInputElement).value = source;
      (document.querySelector("#post_artist_commentary_title")! as HTMLInputElement).value = originalTitle;
      (document.querySelector("#post_artist_commentary_desc")! as HTMLInputElement).value = originalDescription;
      (document.querySelector("#post_translated_commentary_title")! as HTMLInputElement).value = translatedTitle;
      (document.querySelector("#post_translated_commentary_desc")! as HTMLInputElement).value = translatedDescription;
      (document.querySelector("#post_parent_id")! as HTMLInputElement).value = parentId;

      log(`Loaded draft for media asset: ${this.mediaAssetId}`);
      // @ts-ignore
      Danbooru.notice(`Loaded draft for media asset: ${this.mediaAssetId}`);
    });

    el.append(span);
    el.append(loadButton);
    return el;
  }

  async run(uploadId: number): Promise<void> {
    const upload = await this.db.getUpload(this.mediaAssetId);
    if (upload) {
      this.$deleteAfterInput.value = upload.deleteAfter;
      this.populateDraftList();
    } else {
      this.$deleteAfterInput.value = DEFAULT_DELETE_AFTER;
      await this.db.addUpload({
        mediaAssetId: this.mediaAssetId,
        deleteAfter: DEFAULT_DELETE_AFTER,
        updatedAt: currentTimeInMillis(),
      });
    }
  }
}

async function runPosts(db: DB): Promise<void> {
  const link = document.querySelector('a[href^="/media_assets/"]');
  if (!link) { return; }
  const match = /(\d+)/.exec(link.getAttribute("href")!);
  if (!match) { return; }
  const mediaAssetId = +match[1];
  log(`deleting stuff for media asset ${mediaAssetId}`);
  await db.deleteUpload(mediaAssetId);
  await db.deleteOld(currentTimeInMillis());
}

function addDraftsTab(): void {
  document.querySelector("div.tab-list")?.insertAdjacentHTML(
    "beforeend",
    TAB,
  );
  document.querySelector("div.tab-panels")?.insertAdjacentHTML(
    "beforeend",
    TAB_PANEL,
  );

  const icon = document.querySelector("a.help-tooltip-link")?.cloneNode(true) as Element;
  icon.classList.remove("help-tooltip-link");
  icon.removeAttribute("aria-expanded");
  document.querySelector("span.question-mark-icon")?.insertAdjacentElement("afterbegin", icon);
}

function initialize(): void {
  DB.initialize()
    .then((db) => {
      if (/\/uploads\/(\d+)/.test(window.location.pathname)) {
        const link = document.querySelector('a[href^="/media_assets/"]');
        if (!link) { return; }
        const match = /(\d+)/.exec(link.getAttribute("href")!);
        if (!match) { return; }
        const mediaAssetId = +match[1];

        GM_addStyle(CSS);
        addDraftsTab();

        const uploadsPage = new UploadsPage(db, mediaAssetId);
        uploadsPage.setupListeners();
        uploadsPage.run(+match[1]);
      } else if (/\/posts\/(\d+)/.test(window.location.pathname)) {
        runPosts(db);
      } else {
        error(`running on unknown page: ${window.location.href}`);
      }
    })
    .catch((err) => error(`Error loading DB: ${err}`));
}

initialize();
