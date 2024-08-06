// ==UserScript==
// @name        danbooru-show-profile-changes (minified)
// @version     0.4.0
// @description Show changes to your Danbooru profile page
// @author      ddmgy
// @namespace   ddmgy
// @match       *://*.donmai.us/profile
// @match       *://*.donmai.us/users/*
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @downloadURL https://github.com/ddmgy/userscripts/blob/master/packages/danbooru-show-profile-changes/dist/danbooru-show-profile-changes.min.user.js?raw=true
// @updateURL   https://github.com/ddmgy/userscripts/blob/master/packages/danbooru-show-profile-changes/dist/danbooru-show-profile-changes.min.user.js?raw=true
// ==/UserScript==

"use strict";
(() => {
  // src/index.ts
  var DSPC_OPEN_DIALOG_BUTTON = `
<button id="dspc-open-dialog" title="Open DSPC control dialog" style="margin-left: 1em">DPSC</button>
`, DSPC_DIALOG = `
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
`, DSPC_CSS = `
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
  var INTERVALS_RE = /(\d+)\s*(day|week|month)s?/, DEFAULT_INTERVAL = "1 day", MILLISECONDS_PER = {
    day: 864e5,
    week: 6048e5,
    // 7 days
    month: 26784e5
    // 31 days
  }, DEFAULT_HIDE = "none", CENTER_DOT = "\xB7", userName = document.body.getAttribute("data-current-user-name"), userId = document.body.getAttribute("data-current-user-id");
  function log(msg) {
    console.log(`[danbooru-show-profile-changes] ${msg}`);
  }
  function __getKey(key) {
    return `dspc-${key}`;
  }
  var DSPCStorage = class _DSPCStorage {
    static get(key, defaultValue) {
      return GM_getValue(__getKey(key), defaultValue);
    }
    static set(key, value) {
      GM_setValue(__getKey(key), value);
    }
    static keys() {
      return GM_listValues();
    }
    static clear() {
      for (let key of _DSPCStorage.keys())
        GM_deleteValue(key);
    }
    static remove(key) {
      GM_deleteValue(__getKey(key));
    }
  }, Intervals = class {
    static parse(input) {
      let match = INTERVALS_RE.exec(input), scalar = +match[1], key = match[2];
      return scalar * MILLISECONDS_PER[key];
    }
  };
  function __makeSup(value, title) {
    let clazz = value === 0 ? "neutral" : value > 0 ? "positive" : "negative", el = document.createElement("sup");
    return el.classList.add(`dspc-${clazz}`), title && (el.title = title), el.innerText = value.toString(), el;
  }
  var infos = [
    {
      name: "uploads",
      endpoint: "posts",
      selector: "tr.user-uploads a:nth-of-type(1)",
      timeKey: "created_at",
      options: {
        tags: `user:${userName}`
      }
    },
    {
      name: "deleted_uploads",
      endpoint: "posts",
      selector: "tr.user-deleted-uploads a",
      timeKey: "updated_at",
      options: {
        tags: `user:${userName}+status:deleted`
      }
    },
    {
      name: "favorites",
      endpoint: "posts",
      selector: "tr.user-favorites a:nth-of-type(1)",
      timeKey: "updated_at",
      options: {
        tags: `ordfav:${userName}`
      }
    },
    {
      name: "post_votes",
      endpoint: "post_votes",
      selector: "tr.user-votes a:nth-of-type(1)",
      timeKey: "updated_at",
      options: {
        "search[user_id]": `${userId}`
      }
    },
    {
      name: "comment_votes",
      endpoint: "comment_votes",
      selector: "tr.user-votes a:nth-of-type(2)",
      timeKey: "updated_at",
      options: {
        "search[user_id]": `${userId}`
      }
    },
    {
      name: "forum_post_votes",
      endpoint: "forum_post_votes",
      selector: "tr.user-votes a:nth-of-type(3)",
      timeKey: "updated_at",
      options: {
        "search[creator_id]": `${userId}`
      }
    },
    {
      name: "favorite_groups",
      endpoint: "favorite_groups",
      selector: "tr.user-favorite-groups a",
      timeKey: "updated_at",
      options: {
        "search[creator_id]": `${userId}`
      }
    },
    {
      name: "post_versions",
      endpoint: "post_versions",
      selector: "tr.user-post-changes a:nth-of-type(1)",
      timeKey: "updated_at",
      options: {
        "search[updater_id]": `${userId}`
      }
    },
    {
      name: "note_versions",
      endpoint: "note_versions",
      selector: "tr.user-note-changes a:nth-of-type(1)",
      timeKey: "created_at",
      options: {
        "search[updater_id]": `${userId}`
      }
    },
    {
      name: "note_versions_posts",
      endpoint: "posts",
      selector: "tr.user-note-changes a:nth-of-type(2)",
      timeKey: "last_noted_at",
      options: {
        tags: `noteupdated:${userName}+order:note`
      }
    },
    {
      name: "wiki_page_versions",
      endpoint: "wiki_page_versions",
      selector: "tr.user-wiki-page-changes a",
      timeKey: "updated_at",
      options: {
        "search[updater_id]": `${userId}`
      }
    },
    {
      name: "artist_versions",
      endpoint: "artist_versions",
      selector: "tr.user-artist-changes a",
      timeKey: "updated_at",
      options: {
        "search[updater_id]": `${userId}`
      }
    },
    {
      name: "artist_commentary_versions",
      endpoint: "artist_commentary_versions",
      selector: "tr.user-commentary-changes a",
      timeKey: "updated_at",
      options: {
        "search[updater_id]": `${userId}`
      }
    },
    {
      name: "pool_versions",
      endpoint: "pool_versions",
      selector: "tr.user-pool-changes a",
      timeKey: "updated_at",
      options: {
        "search[updater_id]": `${userId}`
      }
    },
    {
      name: "forum_posts",
      endpoint: "forum_posts",
      selector: "tr.user-forum-posts a",
      timeKey: "updated_at",
      options: {
        "search[creator_id]": `${userId}`
      }
    },
    {
      name: "approvals",
      endpoint: "posts",
      selector: "tr.user-approvals a",
      timeKey: "updated_at",
      options: {
        tags: `approver:${userName}`
      }
    },
    {
      name: "comments_total",
      endpoint: "comments",
      selector: "tr.user-comments a:nth-of-type(1)",
      timeKey: "updated_at",
      options: {
        group_by: "comment",
        "search[creator_id]": `${userId}`
      }
    },
    {
      name: "comments_posts",
      endpoint: "posts",
      selector: "tr.user-comments a:nth-of-type(2)",
      timeKey: "updated_at",
      options: {
        tags: `commenter:${userName}+order:comment_bumped`
      }
    },
    {
      name: "post_appeals",
      endpoint: "post_appeals",
      selector: "tr.user-appeals a",
      timeKey: "updated_at",
      options: {
        "search[creator_id]": `${userId}`
      }
    },
    {
      name: "post_flags",
      endpoint: "post_flags",
      selector: "tr.user-flags a",
      timeKey: "updated_at",
      options: {
        "search[creator_id]": `${userId}`
      }
    },
    {
      name: "feedback_positive",
      endpoint: "user_feedbacks",
      selector: "tr.user-feedback a:nth-of-type(2)",
      timeKey: "updated_at",
      options: {
        "search[user_id]": `${userId}`,
        "search[category]": "positive"
      }
    },
    {
      name: "feedback_neutral",
      endpoint: "user_feedbacks",
      selector: "tr.user-feedback a:nth-of-type(3)",
      timeKey: "updated_at",
      options: {
        "search[user_id]": `${userId}`,
        "search[category]": "neutral"
      }
    },
    {
      name: "feedback_negative",
      endpoint: "user_feedbacks",
      selector: "tr.user-feedback a:nth-of-type(4)",
      timeKey: "updated_at",
      options: {
        "search[user_id]": `${userId}`,
        "search[category]": "negative"
      }
    }
  ];
  function getApiUrl(endpoint) {
    let url = new URL(`https://danbooru.donmai.us/${endpoint}.json`);
    return url.searchParams.set("limit", "20"), url.searchParams.set("page", "1"), url;
  }
  function replaceFeedbackLink() {
    let all = document.querySelector("tr.user-feedback a").cloneNode(!0), match = /positive:(\d+)\s+neutral:(\d+)\s+negative:(\d+)/.exec(all.innerText);
    if (match === null)
      return;
    let href = all.getAttribute("href");
    all.innerText = "all";
    let replacement = document.createElement("div");
    replacement.append(all), replacement.insertAdjacentHTML("beforeend", `<a href="${href}&search[category]=positive"> positive:${match[1]}</a>`), replacement.insertAdjacentHTML("beforeend", `<a href="${href}&search[category]=neutral"> neutral:${match[2]}</a>`), replacement.insertAdjacentHTML("beforeend", `<a href="${href}&search[category]=negative"> negative:${match[3]}</a>`), document.querySelector("tr.user-feedback a").replaceWith(replacement);
  }
  async function get(intervals, forceUpdate, info) {
    let stored = DSPCStorage.get(info.name);
    if (!forceUpdate && stored !== void 0)
      return {
        info,
        values: stored.split(CENTER_DOT).map((s) => +s)
      };
    let apiUrl = getApiUrl(info.endpoint);
    if (info.options)
      for (let [key, value] of Object.entries(info.options))
        apiUrl.searchParams.set(key, value.toString());
    apiUrl.searchParams.set("only", info.timeKey);
    let count = intervals.length, totals = [];
    for (var i = 0; i < count; i++)
      totals.push(0);
    var page = 1;
    outer: for (; ; ) {
      let response = await fetch(apiUrl);
      if (!response.ok)
        break;
      let result = await response.json();
      if (result.length === 0)
        break;
      for (let res of result) {
        let updated = Date.parse(res[info.timeKey].substring(0, 16));
        for (var anyUpdated = !1, i = 0; i < count; i++)
          updated >= intervals[i].timestamp && (totals[i] += 1, anyUpdated = !0);
        if (!anyUpdated)
          break outer;
      }
      if (result.length != 20)
        break;
      page += 1, apiUrl.searchParams.set("page", `${page}`);
    }
    return {
      info,
      values: totals
    };
  }
  function addClassNames() {
    let classNames = [
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
      { className: "user-api-key", regex: /^API Key$/ }
    ], rows = Array.from(document.querySelectorAll("table.user-statistics tr"));
    for (let { className, regex } of classNames) {
      let index = rows.findIndex((element) => regex.test(element.firstElementChild.innerText));
      index !== -1 && (rows[index].classList.add(className), rows.splice(index, 1));
    }
  }
  async function openDialog() {
    return new Promise((resolve, reject) => {
      document.querySelector("#dspc-dialog") || document.body.insertAdjacentHTML("beforeend", DSPC_DIALOG);
      let dspcDialog = document.querySelector("#dspc-dialog"), clearDataButton = document.querySelector("#dspc-clear-data"), closeDialogButton = document.querySelector("#dspc-close-dialog"), saveDialogButton = document.querySelector("#dspc-save-dialog"), intervalsInput = document.querySelector("#dspc-intervals"), intervalsError = document.querySelector("#dspc-intervals-error"), hideSelect = document.querySelector("#dspc-hide-select");
      intervalsInput.value = DSPCStorage.get("intervals", DEFAULT_INTERVAL), hideSelect.value = DSPCStorage.get("hide", DEFAULT_HIDE), intervalsInput.addEventListener("keyup", (event) => {
        let currentValues = intervalsInput.value.trim().split(/\s*,\s*/);
        if (currentValues.every((value) => INTERVALS_RE.test(value)))
          intervalsError.style.display = "none", saveDialogButton.disabled = !1;
        else {
          intervalsError.style.display = "block", intervalsError.innerText = "Invalid interval(s)", saveDialogButton.disabled = !0;
          return;
        }
        if (currentValues.length > 3 && (intervalsError.style.display = "block", intervalsError.innerText = "Max of 3 intervals allowed", saveDialogButton.disabled = !0), !currentValues.map((value) => Intervals.parse(value)).sort().every((interval) => interval <= MILLISECONDS_PER.month)) {
          intervalsError.style.display = "block", intervalsError.innerText = "No interval may be longer than 1 month", saveDialogButton.disabled = !0;
          return;
        }
      }), clearDataButton.addEventListener("click", () => {
        Danbooru.notice("Clearing danbooru-show-profile-changes stored data"), log("clearing stored values"), DSPCStorage.clear();
      }), closeDialogButton.addEventListener("click", () => {
        dspcDialog.close(), reject("nothing to see here");
      }), saveDialogButton.addEventListener("click", () => {
        dspcDialog.close(), resolve({ intervals: intervalsInput.value.trim().split(/\s*,\s*/).join(", "), hide: hideSelect.value });
      }), dspcDialog.showModal();
    });
  }
  function hideElements(hide) {
    let changeEm = (selector, visibility) => {
      let elements = document.querySelectorAll(selector);
      for (let element of elements)
        element.style.display = visibility;
    }, hideEm = (selector) => {
      changeEm(selector, "none");
    }, showEm = (selector) => {
      changeEm(selector, "inline");
    };
    hide === "all" ? hideEm("span.dspc-info, sup.dspc-positive, sup.dspc-neutral, sup.dspc-negative") : hide === "neutral" ? (showEm("span.dspc-info, sup.dspc-positive, sup.dspc-neutral, sup.dspc-negative"), hideEm("sup.dspc-neutral")) : hide === "none" && showEm("span.dspc-info, sup.dspc-positive, sup.dspc-neutral, sup.dspc-negative");
  }
  function addButton() {
    document.querySelector("a.user")?.insertAdjacentHTML("afterend", DSPC_OPEN_DIALOG_BUTTON), document.querySelector("#dspc-open-dialog")?.addEventListener("click", (event) => {
      openDialog().then(
        (result) => {
          result.intervals !== DSPCStorage.get("intervals", DEFAULT_INTERVAL) && DSPCStorage.clear(), DSPCStorage.set("intervals", result.intervals), DSPCStorage.set("hide", result.hide), hideElements(result.hide);
        },
        (reason) => {
        }
      );
    });
  }
  function initialize() {
    if (userId === void 0 || userName === void 0 || userName !== document.querySelector("a.user")?.getAttribute("data-user-name"))
      return;
    GM_addStyle(DSPC_CSS), addClassNames(), addButton(), replaceFeedbackLink();
    let date = /* @__PURE__ */ new Date();
    date.setHours(0), date.setMinutes(0), date.setSeconds(0), date.setMilliseconds(0);
    let midnight = date.getTime(), year = date.getFullYear().toString().padStart(4, "0"), month = (date.getMonth() + 1).toString().padStart(2, "0"), day = date.getDate().toString().padStart(2, "0"), dateKey = `${year}-${month}-${day}`, forceUpdate = DSPCStorage.get("date_key") !== dateKey;
    DSPCStorage.set("date_key", dateKey);
    let intervals = DSPCStorage.get("intervals").split(/\s*,\s*/g).map((value) => ({ name: value, timestamp: midnight - Intervals.parse(value) + MILLISECONDS_PER.day })).sort((a, b) => b.timestamp - a.timestamp), fetchers = infos.map(
      (info) => get(intervals, forceUpdate, info)
    );
    Promise.all(fetchers).then((results) => {
      for (let result of results) {
        let element = document.querySelector(result.info.selector);
        if (!element)
          continue;
        let match = /(\d+)/.exec(element.innerText);
        if (match === null)
          continue;
        let stored = DSPCStorage.get(result.info.name)?.split(CENTER_DOT).map((value) => +value), current = +match[1], before = result.values.map((value, i) => stored === void 0 || forceUpdate ? current - value : stored[i]), sups = before.map((value, i) => __makeSup(current - value, `${intervals[i].name}: ${value}`)), span = document.createElement("span");
        span.classList.add("dspc-info");
        let spanChildren = [];
        sups.forEach((sup, i) => {
          if (i > 0) {
            let dot = document.createElement("sup");
            dot.classList.add(spanChildren[i - 1].className), dot.innerText = CENTER_DOT, spanChildren.push(dot);
          }
          spanChildren.push(sup);
        }), span.append(...spanChildren), element.insertAdjacentElement("afterend", span), DSPCStorage.set(result.info.name, before.join(CENTER_DOT));
      }
    }).then(() => hideElements(DSPCStorage.get("hide", DEFAULT_HIDE)));
  }
  initialize();
})();
