const DSPC_OPEN_DIALOG_BUTTON = `
<button id="dspc-open-dialog" title="Open DSPC control dialog" style="margin-left: 1em">DPSC</button>
`;
const DSPC_DIALOG = `
<dialog id="dspc-dialog">
  <div>
    <div id="dspc-main">
      <div id="dspc-intervals-section">
        <label>
          Interval(s):
          <input id="dspc-intervals" type="text" name="intervals" placeholder="1 day" />
        </label>
      </div>
      <div id="dspc-intervals-error">Error text</div>
      <div>
        <label>
          Hide:
          <select id="dspc-hide-select" name="hide">
            <option value="none">None</option>
            <option value="neutral">Neutral</option>
            <option value="all">All</option>
          </select>
        </label>
      </div>
    </div>
    <span id="dspc-buttons">
      <button id="dspc-clear-data" class="ui-button ui-widget ui-corner-all">Clear</button>
      <div id="dspc-button-spacer"></div>
      <button id="dspc-close-dialog" class="ui-button ui-widget ui-corner-all">Close</button>
      <button id="dspc-save-dialog" class="ui-button ui-widget ui-corner-all">Save</button>
    </span>
  </div>
</dialog>
`;
const DSPC_CSS = `
#dspc-dialog {
  background-color: var(--card-background-color);
  color: var(--text-color);
}
#dspc-main {
  margin-bottom: 1rem;
}
#dspc-intervals-section {
  margin-bottom: 1rem;
}
#dspc-intervals-error {
  display: none;
  color: var(--error-color);
}
#dspc-buttons {
  display: flex;
}
#dspc-button-spacer {
  flex: 1;
}
.dspc-positive {
  color: var(--green-4);
}
.dspc-neutral {
  color: var(--grey-4);
}
.dspc-negative {
  color: var(--red-4);
}
.dspc-info {
  padding-left: 0.25em;
  vertical-align: middle;
}
`;

const REQUEST_LIMIT: number = 20;
const INTERVALS_RE = /(\d+)\s*(day|week|month)s?/;
const DEFAULT_INTERVAL: string = "1 day";
const MILLISECONDS_PER = {
  day: 86_400_000,
  week: 604_800_000, // 7 days
  month: 2_678_400_000, // 31 days
};
const DEFAULT_HIDE: string = "none";
const CENTER_DOT: string = "·";

const userName = document.body.getAttribute("data-current-user-name");
const userId = document.body.getAttribute("data-current-user-id");

function log(msg: any) {
  console.log(`[danbooru-show-profile-changes] ${msg}`);
}

function error(msg: any) {
  console.error(`[danbooru-show-profiles-changes] ${msg}`);
}

function __getKey(key: string): string {
  return `dspc-${key}`;
}

class DSPCStorage {
  static get<T>(key: string, defaultValue?: T): T | undefined {
    return GM_getValue<T>(__getKey(key), defaultValue);
  }

  static set<T>(key: string, value: T): void {
    GM_setValue(__getKey(key), value);
  }

  static keys(): string[] {
    return GM_listValues();
  }

  static clear(): void {
    for (const key of DSPCStorage.keys()) {
      GM_deleteValue(key);
    }
  }

  static remove(key: string): void {
    GM_deleteValue(__getKey(key));
  }
}

class Intervals {
  static parse(input: string): number {
    const match = INTERVALS_RE.exec(input)!;
    const scalar = +match[1];
    const key = match[2] as (keyof typeof MILLISECONDS_PER);
    return scalar * MILLISECONDS_PER[key];
  }
}

function __makeSup(value: number, title?: string): HTMLElement {
  const clazz = value === 0 ? "neutral" : (value > 0 ? "positive" : "negative");
  const el = document.createElement("sup");
  el.classList.add(`dspc-${clazz}`);
  if (title) el.title = title;
  el.innerText = value.toString();
  return el;
}

type Info = {
  name: string,
  endpoint: string,
  selector: string,
  timeKey: string,
  options?: { [index: string]: any },
};

type GetResult = {
  info: Info,
  values: number[],
};

type Interval = {
  name: string,
  timestamp: number,
};

type DialogResult = {
  intervals: string,
  hide: string,
};

const infos: Info[] = [
  {
    name: "uploads",
    endpoint: "posts",
    selector: "tr.user-uploads a:nth-of-type(1)",
    timeKey: "created_at",
    options: {
      "tags": `user:${userName}`,
    },
  },
  {
    name: "deleted_uploads",
    endpoint: "posts",
    selector: "tr.user-deleted-uploads a",
    timeKey: "updated_at",
    options : {
      "tags": `user:${userName}+status:deleted`,
    },
  },
  {
    name: "favorites",
    endpoint: "posts",
    selector: "tr.user-favorites a:nth-of-type(1)",
    timeKey: "updated_at",
    options : {
      "tags": `ordfav:${userName}`,
    },
  },
  {
    name: "post_votes",
    endpoint: "post_votes",
    selector: "tr.user-votes a:nth-of-type(1)",
    timeKey: "updated_at",
    options : {
      "search[user_id]": `${userId}`,
    }
  },
  {
    name: "comment_votes",
    endpoint: "comment_votes",
    selector: "tr.user-votes a:nth-of-type(2)",
    timeKey: "updated_at",
    options : {
      "search[user_id]": `${userId}`,
    },
  },
  {
    name: "forum_post_votes",
    endpoint: "forum_post_votes",
    selector: "tr.user-votes a:nth-of-type(3)",
    timeKey: "updated_at",
    options : {
      "search[creator_id]": `${userId}`,
    },
  },
  {
    name: "favorite_groups",
    endpoint: "favorite_groups",
    selector: "tr.user-favorite-groups a",
    timeKey: "updated_at",
    options : {
      "search[creator_id]": `${userId}`,
    },
  },
  {
    name: "post_versions",
    endpoint: "post_versions",
    selector: "tr.user-post-changes a:nth-of-type(1)",
    timeKey: "updated_at",
    options : {
      "search[updater_id]": `${userId}`,
    },
  },
  {
    name: "note_versions",
    endpoint: "note_versions",
    selector: "tr.user-note-changes a:nth-of-type(1)",
    timeKey: "created_at",
    options : {
      "search[updater_id]": `${userId}`,
    },
  },
  {
    name: "note_versions_posts",
    endpoint: "posts",
    selector: "tr.user-note-changes a:nth-of-type(2)",
    timeKey: "last_noted_at",
    options : {
      "tags": `noteupdated:${userName}+order:note`,
    },
  },
  {
    name: "wiki_page_versions",
    endpoint: "wiki_page_versions",
    selector: "tr.user-wiki-page-changes a",
    timeKey: "updated_at",
    options : {
      "search[updater_id]": `${userId}`,
    },
  },
  {
    name: "artist_versions",
    endpoint: "artist_versions",
    selector: "tr.user-artist-changes a",
    timeKey: "updated_at",
    options : {
      "search[updater_id]": `${userId}`,
    },
  },
  {
    name: "artist_commentary_versions",
    endpoint: "artist_commentary_versions",
    selector: "tr.user-commentary-changes a",
    timeKey: "updated_at",
    options : {
      "search[updater_id]": `${userId}`,
    },
  },
  {
    name: "pool_versions",
    endpoint: "pool_versions",
    selector: "tr.user-pool-changes a",
    timeKey: "updated_at",
    options : {
      "search[updater_id]": `${userId}`,
    },
  },
  {
    name: "forum_posts",
    endpoint: "forum_posts",
    selector: "tr.user-forum-posts a",
    timeKey: "updated_at",
    options : {
      "search[creator_id]": `${userId}`,
    },
  },
  {
    name: "approvals",
    endpoint: "posts",
    selector: "tr.user-approvals a",
    timeKey: "updated_at",
    options : {
      "tags": `approver:${userName}`,
    },
  },
  {
    name: "comments_total",
    endpoint: "comments",
    selector: "tr.user-comments a:nth-of-type(1)",
    timeKey: "updated_at",
    options : {
      "group_by": "comment",
      "search[creator_id]": `${userId}`,
    },
  },
  {
    name: "comments_posts",
    endpoint: "posts",
    selector: "tr.user-comments a:nth-of-type(2)",
    timeKey: "updated_at",
    options : {
      "tags": `commenter:${userName}+order:comment_bumped`,
    },
  },
  {
    name: "post_appeals",
    endpoint: "post_appeals",
    selector: "tr.user-appeals a",
    timeKey: "updated_at",
    options : {
      "search[creator_id]": `${userId}`,
    },
  },
  {
    name: "post_flags",
    endpoint: "post_flags",
    selector: "tr.user-flags a",
    timeKey: "updated_at",
    options : {
      "search[creator_id]": `${userId}`,
    },
  },
  {
    name: "feedback_positive",
    endpoint: "user_feedbacks",
    selector: "tr.user-feedback a:nth-of-type(2)",
    timeKey: "updated_at",
    options : {
      "search[user_id]": `${userId}`,
      "search[category]": "positive",
    },
  },
  {
    name: "feedback_neutral",
    endpoint: "user_feedbacks",
    selector: "tr.user-feedback a:nth-of-type(3)",
    timeKey: "updated_at",
    options : {
      "search[user_id]": `${userId}`,
      "search[category]": "neutral",
    },
  },
  {
    name: "feedback_negative",
    endpoint: "user_feedbacks",
    selector: "tr.user-feedback a:nth-of-type(4)",
    timeKey: "updated_at",
    options : {
      "search[user_id]": `${userId}`,
      "search[category]": "negative",
    },
  },
];

function getApiUrl(endpoint: string): URL {
  const url = new URL(`https://danbooru.donmai.us/${endpoint}.json`);
  url.searchParams.set("limit", `${REQUEST_LIMIT}`);
  url.searchParams.set("page", "1");

  return url;
}

function replaceFeedbackLink(): void {
  const all = document.querySelector("tr.user-feedback a")!.cloneNode(true) as HTMLElement;
  const match = /positive:(\d+)\s+neutral:(\d+)\s+negative:(\d+)/.exec(all.innerText);
  if (match === null) {
    return;
  }

  const href = all.getAttribute("href");
  all.innerText = "all"

  const replacement = document.createElement("div");
  replacement.append(all);
  replacement.insertAdjacentHTML("beforeend", `<a href="${href}&search[category]=positive"> positive:${match[1]}</a>`);
  replacement.insertAdjacentHTML("beforeend", `<a href="${href}&search[category]=neutral"> neutral:${match[2]}</a>`);
  replacement.insertAdjacentHTML("beforeend", `<a href="${href}&search[category]=negative"> negative:${match[3]}</a>`);

  document.querySelector("tr.user-feedback a")!.replaceWith(replacement);
}

async function get(
  intervals: Interval[],
  forceUpdate: boolean,
  info: Info,
): Promise<GetResult> {
  const stored = DSPCStorage.get<string>(info.name);
  if (!forceUpdate && stored !== undefined) {
    return {
      info,
      values: stored.split(CENTER_DOT).map((s) => +s),
    };
  }

  const apiUrl = getApiUrl(info.endpoint);
  if (info.options) {
    for (const [ key, value ] of Object.entries(info.options)) {
      apiUrl.searchParams.set(key, value.toString());
    }
  }
  apiUrl.searchParams.set("only", info.timeKey);
  const count = intervals.length;
  const totals: number[] = [];
  for (var i = 0; i < count; i++) {
    totals.push(0);
  }
  var page: number = 1;

  outer: while (true) {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      break;
    }

    const result = await response.json();
    if (result.length === 0) {
      break;
    }

    for (const res of result) {
      const updated = Date.parse(res[info.timeKey].substring(0, 16));
      var anyUpdated: boolean = false;
      for (var i = 0; i < count; i++) {
        if (updated >= intervals[i].timestamp) {
          totals[i] += 1;
          anyUpdated = true;
        }
      }

      if (!anyUpdated) { break outer; }
    }

    if (result.length != REQUEST_LIMIT) {
      break;
    }

    page += 1;
    apiUrl.searchParams.set("page", `${page}`);
  }

  return {
    info,
    values: totals,
  };
}

function addClassNames(): void {
  const classNames = [
    { className: "user-id", regex: /^User ID$/ },
    { className: "user-join-date", regex: /^Join Date$/ },
    { className: "user-level", regex: /^Level$/ },
    { className: "user-upload-limit", regex: /^Upload Limit$/ },
    { className: "user-uploads", regex: /^Uploads$/ },
    { className: "user-deleted-uploads", regex: /^Deleted Uploads$/ },
    { className: "user-favorites", regex: /^Favorites$/ },
    { className: "user-votes", regex: /^Votes$/ },
    { className: "user-favorite-groups", regex: /^Favorite Groups$/ },
    { className: "user-post-changes", regex: /^Post Changes$/ },
    { className: "user-note-changes", regex: /^Note Changes$/ },
    { className: "user-wiki-page-changes", regex: /^Wiki Page Changes$/ },
    { className: "user-artist-changes", regex: /^Artist Changes$/ },
    { className: "user-commentary-changes", regex: /^Commentary Changes$/ },
    { className: "user-pool-changes", regex: /^Pool Changes$/ },
    { className: "user-forum-posts", regex: /^Forum Posts$/ },
    { className: "user-approvals", regex: /^Approvals$/ },
    { className: "user-comments", regex: /^Comments$/ },
    { className: "user-appeals", regex: /^Appeals$/ },
    { className: "user-flags", regex: /^Flags$/ },
    { className: "user-feedback", regex: /^Feedback$/ },
    { className: "user-saved-searches", regex: /^Saved Searches$/ },
    { className: "user-api-key", regex: /^API Key$/ },
  ];
  const rows = Array.from(document.querySelectorAll("table.user-statistics tr"));

  for (const { className, regex } of classNames) {
    const index = rows.findIndex((element) => regex.test((element.firstElementChild! as HTMLElement).innerText));
    if (index === -1) { continue; }
    rows[index].classList.add(className);
    rows.splice(index, 1);
  }
}

async function openDialog(): Promise<DialogResult> {
  return new Promise((resolve, reject) => {
    if (!document.querySelector("#dspc-dialog")) {
      document.body.insertAdjacentHTML("beforeend", DSPC_DIALOG);
    }

    const dspcDialog = document.querySelector("#dspc-dialog")! as HTMLDialogElement;

    const clearDataButton = document.querySelector("#dspc-clear-data")! as HTMLButtonElement;
    const closeDialogButton = document.querySelector("#dspc-close-dialog")! as HTMLButtonElement;
    const saveDialogButton = document.querySelector("#dspc-save-dialog")! as HTMLButtonElement;
    const intervalsInput = document.querySelector("#dspc-intervals")! as HTMLInputElement;
    const intervalsError = document.querySelector("#dspc-intervals-error")! as HTMLDivElement;
    const hideSelect = document.querySelector("#dspc-hide-select")! as HTMLSelectElement;

    intervalsInput.value = DSPCStorage.get<string>("intervals", DEFAULT_INTERVAL)!;
    hideSelect.value = DSPCStorage.get<string>("hide", DEFAULT_HIDE)!;

    intervalsInput.addEventListener("keyup", (event) => {
      const currentValues = intervalsInput.value.trim().split(/\s*,\s*/);
      const allValid = currentValues.every((value) => INTERVALS_RE.test(value));
      if (allValid) {
        intervalsError.style.display = "none";
        saveDialogButton.disabled = false;
      } else {
        intervalsError.style.display = "block";
        intervalsError.innerText = "Invalid interval(s)";
        saveDialogButton.disabled = true;
        return;
      }

      if (currentValues.length > 3) {
        intervalsError.style.display = "block";
        intervalsError.innerText = "Max of 3 intervals allowed";
        saveDialogButton.disabled = true;
      }

      const intervals = currentValues.map((value) => {
        return Intervals.parse(value);
      }).sort();
      const allLessThanOneMonth = intervals.every((interval) => interval <= MILLISECONDS_PER.month);
      if (!allLessThanOneMonth) {
        intervalsError.style.display = "block";
        intervalsError.innerText = "No interval may be longer than 1 month";
        saveDialogButton.disabled = true;
        return;
      }
    });

    clearDataButton.addEventListener("click", () => {
      // @ts-ignore-
      Danbooru.notice("Clearing danbooru-show-profile-changes stored data");
      log("clearing stored values");
      DSPCStorage.clear();
    });
    closeDialogButton.addEventListener("click", () => {
      dspcDialog.close();
      reject("nothing to see here");
    });
    saveDialogButton.addEventListener("click", () => {
      dspcDialog.close();
      resolve({ intervals: intervalsInput.value.trim().split(/\s*,\s*/).join(", "), hide: hideSelect.value });
    });

    dspcDialog.showModal();
  });
}

function hideElements(hide: string): void {
  const changeEm = (selector: string, visibility: string) => {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      (element as HTMLElement).style.display = visibility;
    }
  };
  const hideEm = (selector: string) => {
    changeEm(selector, "none");
  };
  const showEm = (selector: string) => {
    changeEm(selector, "inline");
  };
  if (hide === "all") {
    hideEm("span.dspc-info, sup.dspc-positive, sup.dspc-neutral, sup.dspc-negative");
  } else if (hide === "neutral") {
    showEm("span.dspc-info, sup.dspc-positive, sup.dspc-neutral, sup.dspc-negative");
    hideEm("sup.dspc-neutral");
  } else if (hide === "none") {
    showEm("span.dspc-info, sup.dspc-positive, sup.dspc-neutral, sup.dspc-negative");
  }
}

function addButton(): void {
  document.querySelector("a.user")?.insertAdjacentHTML("afterend", DSPC_OPEN_DIALOG_BUTTON);
  document.querySelector("#dspc-open-dialog")?.addEventListener("click", (event) => {
    openDialog().then(
      (result) => {
        if (result.intervals !== DSPCStorage.get<string>("intervals", DEFAULT_INTERVAL)!) {
          DSPCStorage.clear();
        }
        DSPCStorage.set<string>("intervals", result.intervals);
        DSPCStorage.set<string>("hide", result.hide);
        hideElements(result.hide);
      },
      (reason) => {},
    );
  });
}

function initialize(): void {
  if (userId === undefined || userName === undefined || userName !== document.querySelector("a.user")?.getAttribute("data-user-name")) {
    return;
  }

  GM_addStyle(DSPC_CSS);
  addClassNames();
  addButton();
  replaceFeedbackLink();

  // Create a date object at midnight, current day
  const date = new Date();
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  const midnight = date.getTime();

  const year = date.getFullYear().toString().padStart(4, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const dateKey = `${year}-${month}-${day}`;

  const prevDateKey = DSPCStorage.get<string>("date_key");
  const forceUpdate = prevDateKey !== dateKey;

  DSPCStorage.set("date_key", dateKey);

  const intervals = DSPCStorage.get<string>("intervals")!
    .split(/\s*,\s*/g)
    .map((value) => { return { name: value, timestamp: midnight - Intervals.parse(value) + MILLISECONDS_PER.day }; })
    .sort((a, b) => b.timestamp - a.timestamp);

  const fetchers: Promise<GetResult>[] = infos.map(
    (info) => get(intervals, forceUpdate, info),
  );

  Promise.all(fetchers).then((results) => {
    for (const result of results) {
      const element = document.querySelector(result.info.selector) as HTMLElement;
      if (!element) { continue; }

      const match = /(\d+)/.exec(element.innerText);
      if (match === null) {
        continue;
      }

      const stored = DSPCStorage.get<string>(result.info.name)?.split(CENTER_DOT).map((value) => +value);
      const current = +match[1];
      const before = result.values.map((value, i) => {
        return (stored === undefined || forceUpdate)
          ? (current - value)
          : stored[i];
      });

      const sups = before.map((value, i) => __makeSup(current - value, `${intervals[i].name}: ${value}`));
      const span = document.createElement("span");
      span.classList.add("dspc-info");

      const spanChildren: HTMLElement[] = [];
      sups.forEach((sup, i) => {
        if (i > 0) {
          const dot = document.createElement("sup");
          dot.classList.add(spanChildren[i - 1].className);
          dot.innerText = CENTER_DOT;
          spanChildren.push(dot);
        }
        spanChildren.push(sup);
      });
      span.append(...spanChildren);

      element.insertAdjacentElement("afterend", span);

      DSPCStorage.set(result.info.name, before.join(CENTER_DOT));
    }
  }).then(() => hideElements(DSPCStorage.get<string>("hide", DEFAULT_HIDE)!));
}

initialize();
