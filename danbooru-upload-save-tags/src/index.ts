const DB_NAME: string = "danbooru_upload_save_tags";
const DB_VERSION: number = 2;
const TABLE_NAME: string = "uploads";

type Upload = {
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

class DB {
  private db: IDBDatabase;

  constructor(db: IDBDatabase) {
    this.db = db;
  }

  add(upload: Upload): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(TABLE_NAME, "readwrite");

      transaction.addEventListener("error", (event) => {
        console.error(`[danbooru-upload-save-tags] Error adding item: ${event}`);
        resolve(false);
      });

      const store = transaction.objectStore(TABLE_NAME);
      const request = store.add(upload);

      request.addEventListener("error", (event) => {
        console.error(`[danbooru-upload-save-tags] Error adding item: ${event}`);
        resolve(false);
      });
      request.addEventListener("success", (event) => resolve(true));
    });
  }

  clear(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(TABLE_NAME, "readwrite");

      transaction.addEventListener("error", (event) => {
        console.error(`[danbooru-upload-save-tags] Error clearing database: ${event}`);
        resolve(false);
      });

      const store = transaction.objectStore(TABLE_NAME);
      const request = store.clear();

      request.addEventListener("error", (event) => {
        console.error(`[danbooru-upload-save-tags] Error clearing database: ${event}`);
        resolve(false);
      });
      request.addEventListener("success", (event) => resolve(true));
    });
  }

  count(): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(TABLE_NAME, "readonly");

      transaction.addEventListener("error", (event) => {
        console.error(`[danbooru-upload-save-tags] Error counting items: ${event}`);
        resolve(-1);
      });

      const store = transaction.objectStore(TABLE_NAME);
      const request = store.count();

      request.addEventListener("error", (event) => {
        console.error(`[danbooru-upload-save-tags] Error counting items: ${event}`);
        resolve(-1);
      });
      request.addEventListener("success", (event) => resolve(request.result));
    });
  }

  delete(key: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(TABLE_NAME, "readwrite");

      transaction.addEventListener("error", (event) => {
        console.error(`[danbooru-upload-save-tags] Error deleting item: ${event}`);
        resolve(false);
      });

      const store = transaction.objectStore(TABLE_NAME);
      const request = store.delete(key);

      request.addEventListener("error", (event) => {
        console.error(`[danbooru-upload-save-tags] Error deleting item: ${event}`);
        resolve(false);
      });
      request.addEventListener("success", (event) => resolve(true));
    });
  }

  deleteOld(now: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(TABLE_NAME, "readwrite");

      transaction.addEventListener("error", (event) => {
        console.error(`[danbooru-upload-save-tags] Error deleting items: ${event}`);
        resolve(false);
      });

      const store = transaction.objectStore(TABLE_NAME);
      const request = store.delete(IDBKeyRange.upperBound(now - (5 * 24 * 60 * 60 * 1000)));

      request.addEventListener("error", (event) => {
        console.error(`[danbooru-upload-save-tags] Error deleting items: ${event}`);
        resolve(false);
      });
      request.addEventListener("success", (event) => resolve(true));
    });
  }

  get(key: number): Promise<Upload> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(TABLE_NAME, "readonly");

      transaction.addEventListener("error", (event) => {
        console.error(`[danbooru-upload-save-tags] Error getting item: ${event}`);
        reject(new Error(`Error getting item: ${event}`));
      });

      const store = transaction.objectStore(TABLE_NAME);
      const request = store.get(key);

      request.addEventListener("error", (event) => {
        console.error(`[danbooru-upload-save-tags] Error getting item: ${event}`);
        reject(new Error(`Error getting item: ${event}`));
      });
      request.addEventListener("success", function (event) {
        resolve(this.result as Upload);
      });
    });
  }

  getAll(): Promise<Upload[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(TABLE_NAME, "readonly");

      transaction.addEventListener("error", (event) => {
        console.error(`[danbooru-upload-save-tags] Error getting items: ${event}`);
        reject(new Error(`Error getting items: ${event}`));
      });

      const store = transaction.objectStore(TABLE_NAME);
      const request = store.getAll();

      request.addEventListener("error", (event) => {
        console.error(`[danbooru-upload-save-tags] Error getting items: ${event}`);
        reject(new Error(`Error getting items: ${event}`));
      });
      request.addEventListener("success", function (event) {
        resolve(this.result as Upload[]);
      });
    });
  }

  put(upload: Upload): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(TABLE_NAME, "readwrite");

      transaction.addEventListener("error", (event) => {
        console.error(`[danbooru-upload-save-tags] Error putting item: ${event}`);
        resolve(false);
      });

      const store = transaction.objectStore(TABLE_NAME);
      const request = store.put(upload);

      request.addEventListener("error", (event) => {
        console.error(`[danbooru-upload-save-tags] Error putting item: ${event}`);
        resolve(false);
      });
      request.addEventListener("success", (event) => resolve(true));
    });
  }

  static initialize(): Promise<DB> {
    return new Promise((resolve, reject) => {
      const openOrCreate = window.indexedDB.open(DB_NAME, DB_VERSION);

      openOrCreate.addEventListener("upgradeneeded", function (event) {
        const db = this.result;

        db.addEventListener("error", () => {
          reject(new Error("Error loading DB"));
        });

        const table = db.createObjectStore(TABLE_NAME, {
          keyPath: "mediaAssetId",
          autoIncrement: true,
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

      openOrCreate.addEventListener("success", function () {
        resolve(new DB(this.result));
      });
    });
  }
}

async function runUploads(db: DB, id: number): Promise<void> {
  const mediaAssetLinks = $("a[href^='/media_assets/']");
  if (!mediaAssetLinks.length) { return; }
  const match = /\/media_assets\/(\d+)/.exec(mediaAssetLinks.attr("href")!);
  if (match === null) { return; }
  const mediaAssetId = +match[1];

  const saveButton = $(`<button class="ui-button ui-widget ui-corner-all" type="button">Save</button>`);
  const loadButton = $(`<button class="ui-button ui-widget ui-corner-all" type="button">Load</button>`);

  $("div.tab-list").append(saveButton);
  $("div.tab-list").append(loadButton);

  saveButton.on("click", async () => {
    const rating = $("span.radio input[type='radio']:checked").val() as string;
    const tags = $("#post_tag_string").val() as string;
    const source = $("#post_source").val() as string;
    const originalTitle = $("#post_artist_commentary_title").val() as string;
    const originalDescription = $("#post_artist_commentary_desc").val() as string;
    const translatedTitle = $("#post_translated_commentary_title").val() as string;
    const translatedDescription = $("#post_translated_commentary_desc").val() as string;
    const parentId = $("#post_parent_id").val() as string;
    const timestamp = new Date().getTime();

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
      timestamp,
    });

    console.log(`[danbooru-upload-save-tags] Saved information for media asset ${mediaAssetId}`);
  });
  loadButton.on("click", async () => {
    const upload = await db.get(mediaAssetId);
    if (upload === undefined) { return; }
    const {
      rating,
      tags,
      source,
      originalTitle,
      originalDescription,
      translatedTitle,
      translatedDescription,
      parentId,
    } = upload;

    if (rating !== undefined) {
      $(`input#post_rating_${rating}`).trigger("click");
    }
    $("#post_tag_string").val(tags);
    $("#post_source").val(source);
    $("#post_artist_commentary_title").val(originalTitle);
    $("#post_artist_commentary_desc").val(originalDescription);
    $("#post_translated_commentary_title").val(translatedTitle);
    $("#post_translated_commentary_desc").val(translatedDescription);
    $("#post_parent_id").val(parentId);

    console.log(`[danbooru-upload-save-tags] Loaded information for media asset ${mediaAssetId}`);
  });
}

async function runPosts(db: DB, id: number): Promise<void> {
  const request = await fetch(`/posts/${id}.json?only=media_asset[id]`);
  const mediaAssetId = (await request.json())["media_asset"]["id"] as number;
  await db.delete(mediaAssetId);
  await db.deleteOld(new Date().getTime());
}

async function initialize() {
  DB.initialize()
  .then((db) => {
    var match: RegExpExecArray | null;
    if (match = /\/uploads\/(\d+)/.exec(window.location.pathname)) {
      runUploads(db, +match[1]);
    } else if (match = /\/posts\/(\d+)/.exec(window.location.pathname)) {
      runPosts(db, +match[1]);
    } else {
      console.error(`[danbooru-upload-save-tags] running on unknown page: ${window.location.href}`);
    }
  })
  .catch((err) => console.error(`[danbooru-upload-save-tags] Error loading DB: ${err}`));
}

$(initialize);
