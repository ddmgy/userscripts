// ==UserScript==
// @name        danbooru-upload-save-tags
// @version     0.1.1
// @description Add ability to save/load tags on uploads page
// @author      ddmgy
// @namespace   ddmgy
// @match       *://*.donmai.us/uploads/*
// @match       *://*.donmai.us/posts/*
// @grant       none
// @run-at      document-body
// @downloadURL https://github.com/ddmgy/userscripts/blob/master/danbooru-upload-save-tags/dist/danbooru-upload-save-tags.user.js?raw=true
// @updateURL   https://github.com/ddmgy/userscripts/blob/master/danbooru-upload-save-tags/dist/danbooru-upload-save-tags.user.js?raw=true
// ==/UserScript==

"use strict";
(() => {
  // src/index.ts
  var DB_NAME = "danbooru_upload_save_tags";
  var DB_VERSION = 2;
  var TABLE_NAME = "uploads";
  function log(msg) {
    console.log(`[danbooru-upload-save-tags] ${msg}`);
  }
  function error(msg) {
    console.error(`[danbooru-upload-save-tags] ${msg}`);
  }
  var DB = class _DB {
    db;
    constructor(db) {
      this.db = db;
    }
    add(upload) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(TABLE_NAME, "readwrite");
        transaction.addEventListener("error", (event) => {
          error(`Error adding item: ${event}`);
          resolve(false);
        });
        const store = transaction.objectStore(TABLE_NAME);
        const request = store.add(upload);
        request.addEventListener("error", (event) => {
          error(`Error adding item: ${event}`);
          resolve(false);
        });
        request.addEventListener("success", (event) => resolve(true));
      });
    }
    clear() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(TABLE_NAME, "readwrite");
        transaction.addEventListener("error", (event) => {
          error(`Error clearing database: ${event}`);
          resolve(false);
        });
        const store = transaction.objectStore(TABLE_NAME);
        const request = store.clear();
        request.addEventListener("error", (event) => {
          error(`Error clearing database: ${event}`);
          resolve(false);
        });
        request.addEventListener("success", (event) => resolve(true));
      });
    }
    count() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(TABLE_NAME, "readonly");
        transaction.addEventListener("error", (event) => {
          error(`Error counting items: ${event}`);
          resolve(-1);
        });
        const store = transaction.objectStore(TABLE_NAME);
        const request = store.count();
        request.addEventListener("error", (event) => {
          error(`Error counting items: ${event}`);
          resolve(-1);
        });
        request.addEventListener("success", (event) => resolve(request.result));
      });
    }
    delete(key) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(TABLE_NAME, "readwrite");
        transaction.addEventListener("error", (event) => {
          error(`Error deleting item: ${event}`);
          resolve(false);
        });
        const store = transaction.objectStore(TABLE_NAME);
        const request = store.delete(key);
        request.addEventListener("error", (event) => {
          error(`Error deleting item: ${event}`);
          resolve(false);
        });
        request.addEventListener("success", (event) => resolve(true));
      });
    }
    deleteOld(now) {
      return new Promise(async (resolve, reject) => {
        const timestamp = now - 5 * 24 * 60 * 60 * 1e3;
        const request = await this.getAll();
        for (const upload of request) {
          if (upload.timestamp > timestamp) {
            continue;
          }
          log(`deleting entry: ${upload.mediaAssetId}`);
          const deleted = await this.delete(upload.mediaAssetId);
          log(`  success?: ${deleted}`);
        }
        resolve(true);
      });
    }
    get(key) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(TABLE_NAME, "readonly");
        transaction.addEventListener("error", (event) => {
          error(`Error getting item: ${event}`);
          reject(new Error(`Error getting item: ${event}`));
        });
        const store = transaction.objectStore(TABLE_NAME);
        const request = store.get(key);
        request.addEventListener("error", (event) => {
          error(`Error getting item: ${event}`);
          reject(new Error(`Error getting item: ${event}`));
        });
        request.addEventListener("success", function(event) {
          resolve(this.result);
        });
      });
    }
    getAll() {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(TABLE_NAME, "readonly");
        transaction.addEventListener("error", (event) => {
          error(`Error getting items: ${event}`);
          reject(new Error(`Error getting items: ${event}`));
        });
        const store = transaction.objectStore(TABLE_NAME);
        const request = store.getAll();
        request.addEventListener("error", (event) => {
          error(`Error getting items: ${event}`);
          reject(new Error(`Error getting items: ${event}`));
        });
        request.addEventListener("success", function(event) {
          resolve(this.result);
        });
      });
    }
    put(upload) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(TABLE_NAME, "readwrite");
        transaction.addEventListener("error", (event) => {
          error(`Error putting item: ${event}`);
          resolve(false);
        });
        const store = transaction.objectStore(TABLE_NAME);
        const request = store.put(upload);
        request.addEventListener("error", (event) => {
          error(`Error putting item: ${event}`);
          resolve(false);
        });
        request.addEventListener("success", (event) => resolve(true));
      });
    }
    static initialize() {
      return new Promise((resolve, reject) => {
        const openOrCreate = window.indexedDB.open(DB_NAME, DB_VERSION);
        openOrCreate.addEventListener("upgradeneeded", function(event) {
          const db = this.result;
          db.addEventListener("error", () => {
            reject(new Error("Error loading DB"));
          });
          const table = db.createObjectStore(TABLE_NAME, {
            keyPath: "mediaAssetId",
            autoIncrement: true
          });
          table.createIndex("mediaAssetId", "mediaAssetId", { unique: true });
          table.createIndex("rating", "rating", { unique: false });
          table.createIndex("tags", "tags", { unique: false });
          table.createIndex("source", "source", { unique: false });
          table.createIndex("originalTitle", "originalTitle", { unique: false });
          table.createIndex("originalDescription", "originalDescription", { unique: false });
          table.createIndex("translatedTitle", "translatedTitle", { unique: false });
          table.createIndex("translatedDescription", "translatedDescription", { unique: false });
          table.createIndex("parentId", "parentId", { unique: false });
          table.createIndex("timestamp", "timestamp", { unique: false });
        });
        openOrCreate.addEventListener("error", () => {
          reject(new Error("Error opening DB"));
        });
        openOrCreate.addEventListener("success", function() {
          resolve(new _DB(this.result));
        });
      });
    }
  };
  async function runUploads(db, id) {
    const mediaAssetLinks = $("a[href^='/media_assets/']");
    if (!mediaAssetLinks.length) {
      return;
    }
    const match = /\/media_assets\/(\d+)/.exec(mediaAssetLinks.attr("href"));
    if (match === null) {
      return;
    }
    const mediaAssetId = +match[1];
    const saveButton = $(`<button class="ui-button ui-widget ui-corner-all" type="button">Save</button>`);
    const loadButton = $(`<button class="ui-button ui-widget ui-corner-all" type="button">Load</button>`);
    $("div.tab-list").append(saveButton);
    $("div.tab-list").append(loadButton);
    saveButton.on("click", async () => {
      const rating = $("span.radio input[type='radio']:checked").val();
      const tags = $("#post_tag_string").val();
      const source = $("#post_source").val();
      const originalTitle = $("#post_artist_commentary_title").val();
      const originalDescription = $("#post_artist_commentary_desc").val();
      const translatedTitle = $("#post_translated_commentary_title").val();
      const translatedDescription = $("#post_translated_commentary_desc").val();
      const parentId = $("#post_parent_id").val();
      const timestamp = (/* @__PURE__ */ new Date()).getTime();
      await db.put({
        mediaAssetId,
        rating,
        tags,
        source,
        originalTitle,
        originalDescription,
        translatedTitle,
        translatedDescription,
        parentId,
        timestamp
      });
      log(`Saved information for media asset ${mediaAssetId}`);
    });
    loadButton.on("click", async () => {
      const upload = await db.get(mediaAssetId);
      if (upload === void 0) {
        return;
      }
      const {
        rating,
        tags,
        source,
        originalTitle,
        originalDescription,
        translatedTitle,
        translatedDescription,
        parentId
      } = upload;
      if (rating !== void 0) {
        $(`input#post_rating_${rating}`).trigger("click");
      }
      $("#post_tag_string").val(tags);
      $("#post_source").val(source);
      $("#post_artist_commentary_title").val(originalTitle);
      $("#post_artist_commentary_desc").val(originalDescription);
      $("#post_translated_commentary_title").val(translatedTitle);
      $("#post_translated_commentary_desc").val(translatedDescription);
      $("#post_parent_id").val(parentId);
      log(`Loaded information for media asset ${mediaAssetId}`);
    });
  }
  async function runPosts(db, id) {
    const request = await fetch(`/posts/${id}.json?only=media_asset[id]`);
    const mediaAssetId = (await request.json())["media_asset"]["id"];
    await db.delete(mediaAssetId);
    await db.deleteOld((/* @__PURE__ */ new Date()).getTime());
  }
  async function initialize() {
    DB.initialize().then((db) => {
      var match;
      if (match = /\/uploads\/(\d+)/.exec(window.location.pathname)) {
        runUploads(db, +match[1]);
      } else if (match = /\/posts\/(\d+)/.exec(window.location.pathname)) {
        runPosts(db, +match[1]);
      } else {
        error(`running on unknown page: ${window.location.href}`);
      }
    }).catch((err) => error(`Error loading DB: ${err}`));
  }
  $(initialize);
})();
