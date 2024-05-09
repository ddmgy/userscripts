// ==UserScript==
// @name        danbooru-show-profile-changes
// @version     0.1.1
// @description Show changes to your Danbooru profile page
// @author      ddmgy
// @namespace   ddmgy
// @match       *://*.donmai.us/profile
// @match       *://*.donmai.us/users/*
// @grant       none
// @downloadURL https://github.com/ddmgy/userscripts/blob/master/danbooru-show-profile-changes/dist/danbooru-show-profile-changes.user.js?raw=true
// @updateURL   https://github.com/ddmgy/userscripts/blob/master/danbooru-show-profile-changes/dist/danbooru-show-profile-changes.user.js?raw=true
// ==/UserScript==

"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // src/Danbooru.d.ts
  var require_Danbooru_d = __commonJS({
    "src/Danbooru.d.ts"() {
      "use strict";
    }
  });

  // src/index.ts
  var Danbooru = require_Danbooru_d();
  function __insertStyle(css) {
    if (css === "" || typeof window === "undefined") {
      return;
    }
    const style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.innerHTML = css;
    document.head.appendChild(style);
  }
  var Extractor = class {
    static number(element) {
      const match = /(\d+)/.exec(element.text());
      if (match === null) {
        return null;
      }
      return +match[1];
    }
  };
  var Comparator = class {
    static numbers(a, b) {
      return b - a;
    }
    static objects(a, b) {
      const ret = {};
      for (const key of Object.keys(a)) {
        ret[key] = b[key] - a[key];
      }
      return ret;
    }
  };
  var DSPCStorage = class {
    static get(key) {
      const stored = window.localStorage.getItem(`dspc-${key}`);
      if (stored === null) {
        return null;
      }
      return JSON.parse(stored);
    }
    static set(key, value) {
      window.localStorage.setItem(`dspc-${key}`, JSON.stringify(value));
    }
    static remove(key) {
      window.localStorage.removeItem(`dspc-${key}`);
    }
  };
  function __getClass(value) {
    const isPositive = (value2) => {
      if (typeof value2 === "string") {
        return value2 !== "";
      } else if (typeof value2 === "number") {
        return value2 > 0;
      } else if (typeof value2 === "boolean") {
        return value2;
      } else if (typeof value2 === "object") {
        for (const v of Object.values(value2)) {
          if (!isPositive(v)) {
            return false;
          }
        }
        return true;
      }
      return false;
    };
    return value === 0 ? "neutral" : isPositive(value) ? "positive" : "negative";
  }
  function __makeSup(value, title) {
    return `
    <sup class="dspc-${__getClass(value)}" title="${title === void 0 ? "" : title}">
      ${value}
    </sup>
  `;
  }
  var ShowProfileChanges = class _ShowProfileChanges {
    static infos = [
      {
        key: "upload_limit_pending",
        selector: "tr.user-upload-limit a:nth-of-type(1)"
      },
      {
        key: "upload_limit_total",
        selector: "tr.user-upload-limit abbr"
      },
      {
        key: "uploads",
        selector: "tr.user-uploads a:nth-of-type(1)"
      },
      {
        key: "deleted_uploads",
        selector: "tr.user-deleted-uploads a"
      },
      {
        key: "favorites",
        selector: "tr.user-favorites a:nth-of-type(1)"
      },
      {
        key: "votes_posts",
        selector: "tr.user-votes a:nth-of-type(1)"
      },
      {
        key: "votes_comments",
        selector: "tr.user-votes a:nth-of-type(2)"
      },
      {
        key: "votes_forum_posts",
        selector: "tr.user-votes a:nth-of-type(3)"
      },
      {
        key: "favorite_groups",
        selector: "tr.user-favorite-groups a"
      },
      {
        key: "post_changes",
        selector: "tr.user-post-changes a:nth-of-type(1)"
      },
      {
        key: "note_changes_total",
        selector: "tr.user-note-changes a:nth-of-type(1)"
      },
      {
        key: "note_changes_posts",
        selector: "tr.user-note-changes a:nth-of-type(2)"
      },
      {
        key: "wiki_page_changes",
        selector: "tr.user-wiki-page-changes a"
      },
      {
        key: "artist_changes",
        selector: "tr.user-artist-changes a"
      },
      {
        key: "commentary_changes",
        selector: "tr.user-commentary-changes a"
      },
      {
        key: "forum_posts",
        selector: "tr.user-forum-posts a"
      },
      {
        key: "approvals",
        selector: "tr.user-approvals a"
      },
      {
        key: "comments_total",
        selector: "tr.user-comments a:nth-of-type(1)"
      },
      {
        key: "comments_posts",
        selector: "tr.user-comments a:nth-of-type(2)"
      },
      {
        key: "appeals",
        selector: "tr.user-appeals a"
      },
      {
        key: "flags",
        selector: "tr.user-flags a"
      },
      {
        key: "feedback",
        selector: "tr.user-feedback a",
        extractor: (el) => {
          const re = /positive:(\d+)\s+neutral:(\d+)\s+negative:(\d+)/;
          const match = re.exec(el.text());
          if (match === null) {
            return null;
          }
          return {
            positive: +match[1],
            neutral: +match[2],
            negative: +match[3]
          };
        },
        // @ts-expect-error
        comparator: Comparator.objects,
        // @ts-expect-error
        render: (el, oldValue, newValue, diff) => {
          const allUrl = $(el).attr("href");
          const link = (key) => `
          <a href="${allUrl}&search%5Bcategory%5D=${key}" title="${oldValue[key]}">
            ${key}:${newValue[key]}
            ${__makeSup(diff[key])}
          </a>
        `;
          $(el).replaceWith(`
          <div>
            <a href="${allUrl}">all</a>
            ${link("positive")}
            ${link("neutral")}
            ${link("negative")}
          </div>
        `);
        }
      }
    ];
    static initialize() {
      const userId = $("body").attr("data-current-user-id");
      const userName = $("body").attr("data-current-user-name");
      if (userId === void 0 || userName === void 0) {
        Danbooru.error("Unable to retrieve user information");
        return;
      }
      if (userName !== $("a.user").text()) {
        return;
      }
      __insertStyle(`
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
    #dspc-clear-button {
      font-size: 14px;
    }
    `);
      _ShowProfileChanges.addClassNames();
      _ShowProfileChanges.processAll();
      _ShowProfileChanges.addButton();
    }
    static addClassNames() {
      const classNames = [
        { index: 1, className: "user-id" },
        { index: 2, className: "user-join-date" },
        // index 3 already exists
        { index: 4, className: "user-level" },
        { index: 5, className: "user-upload-limit" },
        { index: 6, className: "user-uploads" },
        { index: 7, className: "user-deleted-uploads" },
        { index: 8, className: "user-favorites" },
        { index: 9, className: "user-votes" },
        { index: 10, className: "user-favorite-groups" },
        { index: 11, className: "user-post-changes" },
        { index: 12, className: "user-note-changes" },
        { index: 13, className: "user-wiki-page-changes" },
        { index: 14, className: "user-artist-changes" },
        { index: 15, className: "user-commentary-changes" },
        { index: 16, className: "user-pool-changes" },
        { index: 17, className: "user-forum-posts" },
        { index: 18, className: "user-approvals" },
        { index: 19, className: "user-comments" },
        { index: 20, className: "user-appeals" },
        { index: 21, className: "user-flags" },
        { index: 22, className: "user-feedback" },
        { index: 23, className: "user-api-key" }
      ];
      for (const { index, className } of classNames) {
        $(`tr:nth-of-type(${index})`).addClass(className);
      }
    }
    static processAll() {
      for (const info of _ShowProfileChanges.infos) {
        _ShowProfileChanges.processInfo(info);
      }
    }
    // @ts-expect-error
    static processInfo({ key, selector, extractor = Extractor.number, comparator = Comparator.numbers, render }) {
      const stored = DSPCStorage.get(key);
      const element = $(selector);
      if (element.length === 0) {
        console.error(`[danbooru-show-profile-changes] Cannot selector element for key "${key}"`);
        return;
      }
      const extracted = extractor(element);
      if (extracted === null) {
        console.error(`[danbooru-show-profile-changes] Cannot extract data for key "${key}`);
        return;
      }
      if (stored !== null) {
        const diff = comparator(stored, extracted);
        if (render !== void 0) {
          render(element, stored, extracted, diff);
        } else {
          $(element).after(__makeSup(diff, stored.toString()));
        }
      }
      DSPCStorage.set(key, extracted);
    }
    static addButton() {
      $("a.user").after(`
      <div class="dspc-clear-data">
        <button id="dspc-clear-button" title="Reset danbooru-show-profile-changes stored data">\u27F3</button>
      </div>
    `);
      $("#dspc-clear-button").on("click", () => {
        for (const { key } of _ShowProfileChanges.infos) {
          console.log(`[danbooru-show-profile-changes] removing key "${key}"`);
          DSPCStorage.remove(key);
        }
        Danbooru.notice("Cleared stored data for danbooru-show-profile-changes");
      });
    }
  };
  $(ShowProfileChanges.initialize);
})();
