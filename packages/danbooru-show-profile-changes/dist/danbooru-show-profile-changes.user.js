// ==UserScript==
// @name        danbooru-show-profile-changes
// @version     0.3.1
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
// @downloadURL https://github.com/ddmgy/userscripts/blob/master/packages/danbooru-show-profile-changes/dist/danbooru-show-profile-changes.user.js?raw=true
// @updateURL   https://github.com/ddmgy/userscripts/blob/master/packages/danbooru-show-profile-changes/dist/danbooru-show-profile-changes.user.js?raw=true
// ==/UserScript==

"use strict";
(() => {
  // src/index.ts
  var DSPC_CSS = `
.dspc-positive {
  color: var(--green-4);
}
.dspc-neutral {
  color: var(--grey-4);
  display: none;
}
.dspc-negative {
  color: var(--red-4);
}
`;
  var REQUEST_LIMIT = 20;
  var userId = $("body").attr("data-current-user-id");
  var userName = $("body").attr("data-current-user-name");
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
      for (const key of _DSPCStorage.keys()) {
        GM_deleteValue(key);
      }
    }
    static remove(key) {
      GM_deleteValue(__getKey(key));
    }
  };
  function __makeSup(value, title) {
    const clazz = value === 0 ? "neutral" : value > 0 ? "positive" : "negative";
    return `
    <sup class="dspc-${clazz}" title="${title === void 0 ? "" : title}">
      ${value}
    </sup>
  `;
  }
  function __userLevelToNumber(userLevel) {
    switch (userLevel) {
      case "Member":
        return 20;
      case "Gold":
        return 30;
      case "Platinum":
        return 31;
      case "Builder":
        return 32;
      case "Contributor":
        return 35;
      case "Approver":
        return 37;
      case "Moderator":
        return 40;
      case "Admin":
        return 50;
      case "Owner":
        return 60;
    }
    ;
    return 10;
  }
  var infos = [
    {
      name: "upload_limit_pending",
      endpoint: "posts",
      selector: "tr.user-upload-limit a:nth-of-type(1)",
      timeKey: "created_at",
      addSearchParams: (params) => {
        params.set("tags", `user:${userName}+status:pending`);
      }
    },
    {
      name: "uploads",
      endpoint: "posts",
      selector: "tr.user-uploads a:nth-of-type(1)",
      timeKey: "created_at",
      addSearchParams: (params) => {
        params.set("tags", `user:${userName}`);
      }
    },
    {
      name: "deleted_uploads",
      endpoint: "posts",
      selector: "tr.user-deleted-uploads a",
      timeKey: "updated_at",
      addSearchParams: (params) => {
        params.set("tags", `user:${userName}+status:deleted`);
      }
    },
    {
      name: "favorites",
      endpoint: "posts",
      selector: "tr.user-favorites a:nth-of-type(1)",
      timeKey: "updated_at",
      addSearchParams: (params) => {
        params.set("tags", `ordfav:${userName}`);
      }
    },
    {
      name: "post_votes",
      endpoint: "post_votes",
      selector: "tr.user-votes a:nth-of-type(1)",
      timeKey: "updated_at",
      addSearchParams: (params) => {
        params.set("search[user_id]", `${userId}`);
      }
    },
    {
      name: "comment_votes",
      endpoint: "comment_votes",
      selector: "tr.user-votes a:nth-of-type(2)",
      timeKey: "updated_at",
      addSearchParams: (params) => {
        params.set("search[user_id]", `${userId}`);
      }
    },
    {
      name: "forum_post_votes",
      endpoint: "forum_post_votes",
      selector: "tr.user-votes a:nth-of-type(3)",
      timeKey: "updated_at",
      addSearchParams: (params) => {
        params.set("search[creator_id]", `${userId}`);
      }
    },
    {
      name: "favorite_groups",
      endpoint: "favorite_groups",
      selector: "tr.user-favorite-groups a",
      timeKey: "updated_at",
      addSearchParams: (params) => {
        params.set("search[creator_id]", `${userId}`);
      }
    },
    {
      name: "post_versions",
      endpoint: "post_versions",
      selector: "tr.user-post-changes a:nth-of-type(1)",
      timeKey: "updated_at",
      addSearchParams: (params) => {
        params.set("search[updater_id]", `${userId}`);
      }
    },
    {
      name: "note_versions",
      endpoint: "note_versions",
      selector: "tr.user-note-changes a:nth-of-type(1)",
      timeKey: "created_at",
      addSearchParams: (params) => {
        params.set("search[updater_id]", `${userId}`);
      }
    },
    {
      name: "note_versions_posts",
      endpoint: "posts",
      selector: "tr.user-note-changes a:nth-of-type(2)",
      timeKey: "last_noted_at",
      addSearchParams: (params) => {
        params.set("tags", `noteupdated:${userName}+order:note`);
      }
    },
    {
      name: "wiki_page_versions",
      endpoint: "wiki_page_versions",
      selector: "tr.user-wiki-page-changes a",
      timeKey: "updated_at",
      addSearchParams: (params) => {
        params.set("search[updater_id]", `${userId}`);
      }
    },
    {
      name: "artist_versions",
      endpoint: "artist_versions",
      selector: "tr.user-artist-changes a",
      timeKey: "updated_at",
      addSearchParams: (params) => {
        params.set("search[updater_id]", `${userId}`);
      }
    },
    {
      name: "artist_commentary_versions",
      endpoint: "artist_commentary_versions",
      selector: "tr.user-commentary-changes a",
      timeKey: "updated_at",
      addSearchParams: (params) => {
        params.set("search[updater_id]", `${userId}`);
      }
    },
    {
      name: "pool_versions",
      endpoint: "pool_versions",
      selector: "tr.user-pool-changes a",
      timeKey: "updated_at",
      addSearchParams: (params) => {
        params.set("search[updater_id]", `${userId}`);
      }
    },
    {
      name: "forum_posts",
      endpoint: "forum_posts",
      selector: "tr.user-forum-posts a",
      timeKey: "updated_at",
      addSearchParams: (params) => {
        params.set("search[creator_id]", `${userId}`);
      }
    },
    {
      name: "approvals",
      endpoint: "posts",
      selector: "tr.user-approvals a",
      timeKey: "updated_at",
      addSearchParams: (params) => {
        params.set("tags", `approver:${userName}`);
      }
    },
    {
      name: "comments_total",
      endpoint: "comments",
      selector: "tr.user-comments a:nth-of-type(1)",
      timeKey: "updated_at",
      addSearchParams: (params) => {
        params.set("group_by", "comment");
        params.set("search[creator_id]", `${userId}`);
      }
    },
    {
      name: "comments_posts",
      endpoint: "posts",
      selector: "tr.user-comments a:nth-of-type(2)",
      timeKey: "updated_at",
      addSearchParams: (params) => {
        params.set("tags", `commenter:${userName}+order:comment_bumped`);
      }
    },
    {
      name: "post_appeals",
      endpoint: "post_appeals",
      selector: "tr.user-appeals a",
      timeKey: "updated_at",
      addSearchParams: (params) => {
        params.set("search[creator_id]", `${userId}`);
      }
    },
    {
      name: "post_flags",
      endpoint: "post_flags",
      selector: "tr.user-flags a",
      timeKey: "updated_at",
      addSearchParams: (params) => {
        params.set("search[creator_id]", `${userId}`);
      }
    },
    {
      name: "feedback_positive",
      endpoint: "user_feedbacks",
      selector: "tr.user-feedback a:nth-of-type(2)",
      timeKey: "updated_at",
      addSearchParams: (params) => {
        params.set("search[user_id]", `${userId}`);
        params.set("search[category]", "positive");
      }
    },
    {
      name: "feedback_neutral",
      endpoint: "user_feedbacks",
      selector: "tr.user-feedback a:nth-of-type(3)",
      timeKey: "updated_at",
      addSearchParams: (params) => {
        params.set("search[user_id]", `${userId}`);
        params.set("search[category]", "neutral");
      }
    },
    {
      name: "feedback_negative",
      endpoint: "user_feedbacks",
      selector: "tr.user-feedback a:nth-of-type(4)",
      timeKey: "updated_at",
      addSearchParams: (params) => {
        params.set("search[user_id]", `${userId}`);
        params.set("search[category]", "negative");
      }
    }
  ];
  function getApiUrl(endpoint) {
    const url = new URL(`https://danbooru.donmai.us/${endpoint}.json`);
    url.searchParams.set("limit", `${REQUEST_LIMIT}`);
    url.searchParams.set("page", "1");
    return url;
  }
  function addClassNames() {
    const encode = (path) => path.replace(/:/g, "%3A");
    const classNames = [
      { className: "user-level", selector: `href^="/upgrade"` },
      { className: "user-upload-limit", selector: `href*="status:pending"` },
      { className: "user-uploads", selector: `href="/posts?tags=user:${userName}"` },
      { className: "user-deleted-uploads", selector: `href*="status:deleted"` },
      { className: "user-favorites", selector: `href*="ordfav:${userName}"` },
      { className: "user-votes", selector: `href^="/post_votes"` },
      { className: "user-favorite-groups", selector: `href^="/favorite_groups"` },
      { className: "user-post-changes", selector: `href^="/post_versions"` },
      { className: "user-note-changes", selector: `href^="/note_versions"` },
      { className: "user-wiki-page-changes", selector: `href^="/wiki_page_versions"` },
      { className: "user-artist-changes", selector: `href^="/artist_versions"` },
      { className: "user-commentary-changes", selector: `href^="/artist_commentary_versions"` },
      { className: "user-pool-changes", selector: `href^="/pool_versions"` },
      { className: "user-forum-posts", selector: `href^="/forum_posts"` },
      { className: "user-approvals", selector: `href*="tags=approver:${userName}"` },
      { className: "user-comments", selector: `href^="/comments"` },
      { className: "user-appeals", selector: `href^="/post_appeals"` },
      { className: "user-flags", selector: `href^="/post_flags"` },
      { className: "user-feedback", selector: `href^="/user_feedbacks"` },
      { className: "user-saved-searches", selector: `href*="search:"` },
      { className: "user-api-key", selector: `href="/users/${userId}/api_keys"` }
    ];
    const rows = $("table.user-statistics tr");
    for (const { className, selector } of classNames) {
      const match = rows.find(`a[${encode(selector)}]:nth-of-type(1)`);
      if (!match.length) {
        continue;
      }
      match.parents("tr").addClass(className);
    }
  }
  function addClearButton() {
    $("table.user-statistics").parent().after(`
    <br />
    <div class="dspc-clear-data">
      <button id="dspc-clear-button">Reset danbooru-show-profile-changes stored data</button>
    </div>
  `);
    $("#dspc-clear-button").on("click", () => {
      Danbooru.notice("Clearing danbooru-show-profile-changes stored data");
      console.log("[danbooru-show-profile-changes] clearing stored values");
      DSPCStorage.clear();
    });
  }
  function replaceFeedbackLink() {
    const all = $("tr.user-feedback a").clone();
    const replacement = $("<div></div>");
    const match = /positive:(\d+)\s+neutral:(\d+)\s+negative:(\d+)/.exec(all.text());
    if (match === null) {
      return;
    }
    replacement.append(all.text("all "));
    replacement.append(`<a href="${all.attr("href")}&search[category]=positive">positive:${+match[1]} </a>`);
    replacement.append(`<a href="${all.attr("href")}&search[category]=neutral">neutral:${+match[2]} </a>`);
    replacement.append(`<a href="${all.attr("href")}&search[category]=negative">negative:${+match[3]} </a>`);
    $("tr.user-feedback a").replaceWith(replacement);
  }
  async function get(timestamp, forceUpdate, info) {
    const stored = DSPCStorage.get(info.name);
    if (!forceUpdate && stored !== void 0) {
      return {
        info,
        value: stored
      };
    }
    const apiUrl = getApiUrl(info.endpoint);
    info.addSearchParams(apiUrl.searchParams);
    apiUrl.searchParams.set("only", info.timeKey);
    var total = 0;
    var page = 1;
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
        if (updated < timestamp) {
          break outer;
        }
        total += 1;
      }
      if (result.length != REQUEST_LIMIT) {
        break;
      }
      page += 1;
      apiUrl.searchParams.set("page", `${page}`);
    }
    return {
      info,
      value: total
    };
  }
  function initialize() {
    if (userId === void 0 || userName === void 0 || userName !== $("a.user").attr("data-user-name")) {
      return;
    }
    GM_addStyle(DSPC_CSS);
    addClassNames();
    addClearButton();
    replaceFeedbackLink();
    const date = /* @__PURE__ */ new Date();
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    const midnight = date.getTime();
    const year = date.getFullYear().toString().padStart(4, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`;
    const prevDateKey = DSPCStorage.get("date_key");
    const forceUpdate = prevDateKey !== dateKey;
    DSPCStorage.set("date_key", dateKey);
    const fetchers = infos.map(
      (info) => get(midnight, forceUpdate, info)
    );
    Promise.all(fetchers).then((results) => {
      for (const result of results) {
        const element = $(result.info.selector);
        if (element.length === 0) {
          continue;
        }
        const match = /(\d+)/.exec(element.text());
        if (match === null) {
          continue;
        }
        const stored = DSPCStorage.get(result.info.name);
        const current = +match[1];
        const beforeMidnight = stored === void 0 || forceUpdate ? current - result.value : stored;
        $(element).after(__makeSup(current - beforeMidnight, `${beforeMidnight}`));
        DSPCStorage.set(result.info.name, beforeMidnight);
      }
    });
    const currLevel = $("body").attr("data-current-user-level-string");
    if (currLevel !== void 0) {
      const prevLevel = DSPCStorage.get("user_level");
      if (prevLevel !== void 0) {
        $("tr.user-level td").replaceWith(`<td>${currLevel} ${__makeSup(__userLevelToNumber(currLevel) - __userLevelToNumber(prevLevel), prevLevel)}</td>`);
      } else {
        $("tr.user-level td").replaceWith(`<td>${currLevel}</td>`);
      }
      DSPCStorage.set("user_level", currLevel);
    }
  }
  $(initialize);
})();
