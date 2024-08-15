// ==UserScript==
// @name        danbooru-draft-tags-on-upload (minified)
// @version     0.3.0
// @description Add ability to save/load drafts on upload page
// @author      ddmgy
// @namespace   ddmgy
// @match       *://*.donmai.us/uploads/*
// @match       *://*.donmai.us/posts/*
// @grant       GM_addStyle
// @run-at      document-idle
// @downloadURL https://github.com/ddmgy/userscripts/blob/master/packages/danbooru-draft-tags-on-upload/dist/danbooru-draft-tags-on-upload.min.user.js?raw=true
// @updateURL   https://github.com/ddmgy/userscripts/blob/master/packages/danbooru-draft-tags-on-upload/dist/danbooru-draft-tags-on-upload.min.user.js?raw=true
// ==/UserScript==

"use strict";
(() => {
  // src/index.ts
  var DB_NAME = "danbooru-draft-tags-on-upload";
  var UPLOAD_TABLE_NAME = "uploads", DRAFT_TABLE_NAME = "drafts", TAB = `<a class="tab drafts-tab" x-on:click.prevent="active = 4" x-bind:class="{ 'active-tab': active === 4 }" href="#">Drafts</a>`, TAB_PANEL = `
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
`, CSS = `
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
`, DELETE_AFTER_RE = /(\d+)\s*(year|month|week|day|hour)s?/, DEFAULT_DELETE_AFTER = "1 week", MILLISECONDS_PER = {
    hour: 36e5,
    day: 864e5,
    // 24 hours
    week: 6048e5,
    // 7 days
    month: 26784e5,
    // 31 days
    year: 31536e6
    // 365 days
  };
  function log(msg) {
    console.log(`[danbooru-draft-tags-on-upload] ${msg}`);
  }
  function error(error2) {
    console.error(`[danbooru-draft-tags-on-upload] ${error2}`);
  }
  function currentTimeInMillis() {
    return (/* @__PURE__ */ new Date()).getTime();
  }
  function parseDeleteAfter(deleteAfter) {
    let match = DELETE_AFTER_RE.exec(deleteAfter), scalar = +match[1], key = match[2];
    return scalar * MILLISECONDS_PER[key];
  }
  var DB = class _DB {
    db;
    constructor(db) {
      this.db = db;
    }
    addUpload(upload) {
      return new Promise((resolve, reject) => {
        let transaction = this.db.transaction(UPLOAD_TABLE_NAME, "readwrite"), request = transaction.objectStore(UPLOAD_TABLE_NAME).add(upload);
        transaction.addEventListener("error", (e) => {
          error(`Error adding upload: ${e}`), resolve(!1);
        }), request.addEventListener("success", (e) => {
          resolve(!0);
        });
      });
    }
    addDraft(draft) {
      return new Promise((resolve, reject) => {
        let transaction = this.db.transaction(DRAFT_TABLE_NAME, "readwrite"), request = transaction.objectStore(DRAFT_TABLE_NAME).add(draft);
        transaction.addEventListener("error", (e) => {
          error(`Error adding draft: ${e}`), resolve(!1);
        }), request.addEventListener("success", (e) => {
          resolve(!0);
        });
      });
    }
    clear(table) {
      return new Promise((resolve, reject) => {
        let transaction = this.db.transaction(table, "readwrite"), request = transaction.objectStore(table).clear();
        transaction.addEventListener("error", (e) => {
          error(`Error clearing table "${table}": ${e}*-`), resolve(!1);
        }), request.addEventListener("success", (e) => {
          resolve(!0);
        });
      });
    }
    clearUploads() {
      return this.clear(UPLOAD_TABLE_NAME);
    }
    clearDrafts() {
      return this.clear(DRAFT_TABLE_NAME);
    }
    deleteUpload(mediaAssetId) {
      return new Promise((resolve, reject) => {
        let transaction = this.db.transaction(UPLOAD_TABLE_NAME, "readwrite"), request = transaction.objectStore(UPLOAD_TABLE_NAME).delete(mediaAssetId);
        transaction.addEventListener("error", (e) => {
          error(`Error deleting upload: ${e}`), resolve(!1);
        }), request.addEventListener("success", (e) => {
          let transaction2 = this.db.transaction(DRAFT_TABLE_NAME, "readwrite");
          transaction2.objectStore(DRAFT_TABLE_NAME).index("mediaAssetId").openCursor().addEventListener("success", function(e2) {
            let cursor2 = this.result;
            cursor2 && (cursor2.value.mediaAssetId === mediaAssetId && cursor2.delete(), cursor2.continue());
          }), transaction2.addEventListener("error", (e2) => {
            error(`Error deleting drafts for ${mediaAssetId}: ${e2}`), resolve(!1);
          }), transaction2.addEventListener("complete", (e2) => {
            resolve(!0);
          });
        });
      });
    }
    deleteDraft(id) {
      return new Promise((resolve, reject) => {
        let transaction = this.db.transaction(DRAFT_TABLE_NAME, "readwrite"), request = transaction.objectStore(DRAFT_TABLE_NAME).delete(id);
        transaction.addEventListener("error", (e) => {
          error(`Error deleting draft: ${e}`), resolve(!1);
        }), request.addEventListener("success", (e) => {
          resolve(!0);
        });
      });
    }
    deleteOld(timestamp) {
      return new Promise(async (resolve, reject) => {
        let cursor = this.db.transaction(UPLOAD_TABLE_NAME, "readwrite").objectStore(UPLOAD_TABLE_NAME).index("mediaAssetId").openCursor(), db = this;
        cursor.addEventListener("error", (e) => {
          error(`Error deleting old uploads: ${e}`);
        }), cursor.addEventListener("success", function(e) {
          let cursor2 = this.result;
          if (!cursor2) {
            error("Error opening upload cursor");
            return;
          }
          let deleteAfter = parseDeleteAfter(cursor2.value.deleteAfter);
          if (timestamp - deleteAfter <= cursor2.value.updatedAt) {
            log(`deleting upload: ${cursor2.value.mediaAssetId}`), cursor2.delete();
            let mediaAssetId = cursor2.value.mediaAssetId, draftCursor = db.db.transaction(DRAFT_TABLE_NAME, "readwrite").objectStore(DRAFT_TABLE_NAME).index("mediaAssetId").openCursor();
            draftCursor.addEventListener("error", (e2) => {
              error(`Error deleting old drafts: ${e2}`);
            }), draftCursor.addEventListener("success", function(e2) {
              let cursor3 = this.result;
              if (!cursor3) {
                error("Error opening draft cursor");
                return;
              }
              cursor3.value.mediaAssetId === mediaAssetId && cursor3.delete(), cursor3.continue();
            });
          }
          cursor2.continue();
        });
      });
    }
    getUpload(mediaAssetId) {
      return new Promise((resolve, reject) => {
        let transaction = this.db.transaction(UPLOAD_TABLE_NAME, "readonly"), request = transaction.objectStore(UPLOAD_TABLE_NAME).get(mediaAssetId);
        transaction.addEventListener("error", (e) => {
          error(`Error getting upload: ${e}`), resolve(null);
        }), request.addEventListener("success", function(e) {
          resolve(this.result);
        });
      });
    }
    getDraft(id) {
      return new Promise((resolve, reject) => {
        let transaction = this.db.transaction(DRAFT_TABLE_NAME, "readonly"), request = transaction.objectStore(DRAFT_TABLE_NAME).get(id);
        transaction.addEventListener("error", (e) => {
          error(`Error getting draft: ${e}`), resolve(null);
        }), request.addEventListener("success", function(e) {
          resolve(this.result);
        });
      });
    }
    getAllDrafts(mediaAssetId) {
      return new Promise((resolve, reject) => {
        let transaction = this.db.transaction(DRAFT_TABLE_NAME, "readonly"), cursor = transaction.objectStore(DRAFT_TABLE_NAME).index("mediaAssetId").openCursor(null, "prev"), ret = [];
        cursor.addEventListener("success", function(e) {
          let cursor2 = this.result;
          cursor2 && (cursor2.value.mediaAssetId === mediaAssetId && ret.push(cursor2.value), cursor2.continue());
        }), transaction.addEventListener("error", (e) => {
          error(`Error getting drafts for ${mediaAssetId}: ${e}`), resolve([]);
        }), transaction.addEventListener("complete", (e) => {
          resolve(ret);
        });
      });
    }
    putUpload(upload) {
      return new Promise((resolve, reject) => {
        let transaction = this.db.transaction(UPLOAD_TABLE_NAME, "readwrite"), request = transaction.objectStore(UPLOAD_TABLE_NAME).put(upload);
        transaction.addEventListener("error", (e) => {
          error(`Error putting upload: ${e}`), resolve(!1);
        }), request.addEventListener("success", (e) => {
          resolve(!0);
        });
      });
    }
    putDraft(draft) {
      return new Promise((resolve, reject) => {
        let transaction = this.db.transaction(DRAFT_TABLE_NAME, "readwrite"), request = transaction.objectStore(DRAFT_TABLE_NAME).put(draft, "id");
        transaction.addEventListener("error", (e) => {
          error(`Error putting draft: ${e}`), resolve(!1);
        }), request.addEventListener("success", (e) => {
          resolve(!0);
        });
      });
    }
    static initialize() {
      return new Promise((resolve, reject) => {
        let openOrCreate = window.indexedDB.open(DB_NAME, 1);
        openOrCreate.addEventListener("upgradeneeded", function(e) {
          let db = this.result;
          db.addEventListener("error", () => {
            reject(new Error("Error loading DB"));
          });
          let uploadsTable = db.createObjectStore(UPLOAD_TABLE_NAME, {
            keyPath: "mediaAssetId"
          });
          uploadsTable.createIndex("mediaAssetId", "mediaAssetId", { unique: !0 }), uploadsTable.createIndex("deleteAfter", "deleteAfter", { unique: !1 }), uploadsTable.createIndex("updatedAt", "updatedAt", { unique: !1 });
          let draftsTable = db.createObjectStore(DRAFT_TABLE_NAME, {
            keyPath: "id",
            autoIncrement: !0
          });
          draftsTable.createIndex("id", "id", { unique: !0 }), draftsTable.createIndex("mediaAssetId", "mediaAssetId", { unique: !1 }), draftsTable.createIndex("rating", "rating", { unique: !1 }), draftsTable.createIndex("tags", "tags", { unique: !1 }), draftsTable.createIndex("source", "source", { unique: !1 }), draftsTable.createIndex("originalTitle", "originalTitle", { unique: !1 }), draftsTable.createIndex("originalDescription", "originalDescription", { unique: !1 }), draftsTable.createIndex("translatedTitle", "translatedTitle", { unique: !1 }), draftsTable.createIndex("translatedDescription", "translatedDescription", { unique: !1 }), draftsTable.createIndex("parentId", "parentId", { unique: !1 }), draftsTable.createIndex("timestamp", "timestamp", { unique: !1 });
        }), openOrCreate.addEventListener("error", () => {
          reject(new Error("Error opening DB"));
        }), openOrCreate.addEventListener("success", function() {
          resolve(new _DB(this.result));
        });
      });
    }
  }, UploadsPage = class {
    db;
    mediaAssetId;
    $deleteAfterInput;
    $setDeleteAfterButton;
    $selectAllCheckbox;
    $deleteSelectedButton;
    $saveDraftButton;
    $draftsList;
    constructor(db, mediaAssetId) {
      this.db = db, this.mediaAssetId = mediaAssetId, this.$deleteAfterInput = document.querySelector("#ddtou-delete-after"), this.$setDeleteAfterButton = document.querySelector("#ddtou-set-delete-after"), this.$selectAllCheckbox = document.querySelector("#ddtou-select-all"), this.$deleteSelectedButton = document.querySelector("#ddtou-delete-selected"), this.$saveDraftButton = document.querySelector("#ddtou-save-draft"), this.$draftsList = document.querySelector("#ddtou-drafts-list");
    }
    async updateUpload() {
      await this.db.putUpload({
        mediaAssetId: this.mediaAssetId,
        deleteAfter: this.$deleteAfterInput.value,
        updatedAt: currentTimeInMillis()
      });
    }
    setupListeners() {
      this.$deleteAfterInput.addEventListener("submit", (e) => {
        e.preventDefault(), this.updateUpload();
      }), this.$setDeleteAfterButton.addEventListener("click", (e) => {
        e.preventDefault(), this.updateUpload();
      }), this.$selectAllCheckbox.addEventListener("click", (e) => {
        let drafts = document.querySelectorAll(".ddtou-draft"), checked = document.querySelectorAll(".ddtou-draft input:checked").length === 0;
        for (let draft of drafts)
          draft.querySelector("input").checked = checked;
        this.$selectAllCheckbox.indeterminate = !1, this.$selectAllCheckbox.checked = checked, this.$deleteSelectedButton.disabled = !checked;
      }), this.$deleteSelectedButton.addEventListener("click", async (e) => {
        e.preventDefault();
        let drafts = document.querySelectorAll(".ddtou-draft");
        for (let draft of drafts)
          draft.querySelector("input").checked && (log(`deleting: id #${draft.getAttribute("data-id")}`), await this.db.deleteDraft(+draft.getAttribute("data-id")), draft.parentElement?.removeChild(draft));
        this.$selectAllCheckbox.indeterminate = !1, this.$selectAllCheckbox.checked = !1, this.$deleteSelectedButton.disabled = !0;
      }), this.$saveDraftButton.addEventListener("click", async (e) => {
        e.preventDefault(), await this.updateUpload(), await this.db.addDraft({
          mediaAssetId: this.mediaAssetId,
          rating: document.querySelector("span.radio input[type='radio']:checked")?.value,
          tags: document.querySelector("#post_tag_string").value,
          source: document.querySelector("#post_source").value,
          originalTitle: document.querySelector("#post_artist_commentary_title").value,
          originalDescription: document.querySelector("#post_artist_commentary_desc").value,
          translatedTitle: document.querySelector("#post_translated_commentary_title").value,
          translatedDescription: document.querySelector("#post_translated_commentary_desc").value,
          parentId: document.querySelector("#post_parent_id").value,
          timestamp: currentTimeInMillis()
        }), log(`Saved draft for media asset: ${this.mediaAssetId}`), Danbooru.notice(`Saved draft for media asset: ${this.mediaAssetId}`), this.populateDraftList();
      });
    }
    updateSelected() {
      let drafts = document.querySelectorAll(".ddtou-draft"), checkedCount = document.querySelectorAll(".ddtou-draft input:checked").length;
      this.$deleteSelectedButton.disabled = checkedCount === 0, checkedCount === 0 ? (this.$selectAllCheckbox.indeterminate = !1, this.$selectAllCheckbox.checked = !1) : checkedCount === drafts.length ? (this.$selectAllCheckbox.indeterminate = !1, this.$selectAllCheckbox.checked = !0) : (this.$selectAllCheckbox.indeterminate = !0, this.$selectAllCheckbox.checked = !1);
    }
    async populateDraftList() {
      this.$draftsList.innerHTML = "";
      let drafts = await this.db.getAllDrafts(this.mediaAssetId);
      for (let draft of drafts)
        this.$draftsList.append(this.createDraftElement(draft));
    }
    createDraftElement(draft) {
      let el = document.createElement("div");
      el.classList.add("ddtou-draft"), el.classList.add("flex"), el.classList.add("justify-between"), el.setAttribute("data-id", draft.id.toString());
      let span = document.createElement("span"), cb = document.createElement("input");
      cb.classList.add("ddtou-select"), cb.type = "checkbox", cb.addEventListener("click", (e) => {
        this.updateSelected();
      });
      let label = document.createElement("label");
      label.setAttribute("for", "ddtou-select"), label.classList.add("ddtou-timestamp"), label.innerText = new Date(draft.timestamp).toString(), span.append(cb), span.append(label);
      let loadButton = document.createElement("button");
      return loadButton.classList.add("ui-button"), loadButton.classList.add("ui-widget"), loadButton.classList.add("ui-corner-all"), loadButton.textContent = "Load", loadButton.addEventListener("click", async (e) => {
        e.preventDefault();
        let {
          rating,
          tags,
          source,
          originalTitle,
          originalDescription,
          translatedTitle,
          translatedDescription,
          parentId
        } = draft;
        rating !== void 0 && (document.querySelector(`#post_rating_${rating}`).checked = !0), document.querySelector("#post_tag_string").value = tags, document.querySelector("#post_source").value = source, document.querySelector("#post_artist_commentary_title").value = originalTitle, document.querySelector("#post_artist_commentary_desc").value = originalDescription, document.querySelector("#post_translated_commentary_title").value = translatedTitle, document.querySelector("#post_translated_commentary_desc").value = translatedDescription, document.querySelector("#post_parent_id").value = parentId, log(`Loaded draft for media asset: ${this.mediaAssetId}`), Danbooru.notice(`Loaded draft for media asset: ${this.mediaAssetId}`);
      }), el.append(span), el.append(loadButton), el;
    }
    async run(uploadId) {
      let upload = await this.db.getUpload(this.mediaAssetId);
      upload ? (this.$deleteAfterInput.value = upload.deleteAfter, this.populateDraftList()) : (this.$deleteAfterInput.value = DEFAULT_DELETE_AFTER, await this.db.addUpload({
        mediaAssetId: this.mediaAssetId,
        deleteAfter: DEFAULT_DELETE_AFTER,
        updatedAt: currentTimeInMillis()
      }));
    }
  };
  async function runPosts(db) {
    let link = document.querySelector('a[href^="/media_assets/"]');
    if (!link)
      return;
    let match = /(\d+)/.exec(link.getAttribute("href"));
    if (!match)
      return;
    let mediaAssetId = +match[1];
    log(`deleting stuff for media asset ${mediaAssetId}`), await db.deleteUpload(mediaAssetId), await db.deleteOld(currentTimeInMillis());
  }
  function addDraftsTab() {
    document.querySelector("div.tab-list")?.insertAdjacentHTML(
      "beforeend",
      TAB
    ), document.querySelector("div.tab-panels")?.insertAdjacentHTML(
      "beforeend",
      TAB_PANEL
    );
    let icon = document.querySelector("a.help-tooltip-link")?.cloneNode(!0);
    icon.classList.remove("help-tooltip-link"), icon.removeAttribute("aria-expanded"), document.querySelector("span.question-mark-icon")?.insertAdjacentElement("afterbegin", icon);
  }
  function initialize() {
    DB.initialize().then((db) => {
      if (/\/uploads\/(\d+)/.test(window.location.pathname)) {
        let link = document.querySelector('a[href^="/media_assets/"]');
        if (!link)
          return;
        let match = /(\d+)/.exec(link.getAttribute("href"));
        if (!match)
          return;
        let mediaAssetId = +match[1];
        GM_addStyle(CSS), addDraftsTab();
        let uploadsPage = new UploadsPage(db, mediaAssetId);
        uploadsPage.setupListeners(), uploadsPage.run(+match[1]);
      } else /\/posts\/(\d+)/.test(window.location.pathname) ? runPosts(db) : error(`running on unknown page: ${window.location.href}`);
    }).catch((err) => error(`Error loading DB: ${err}`));
  }
  initialize();
})();
