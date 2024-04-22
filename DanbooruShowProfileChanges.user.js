// ==UserScript==
// @name         Danbooru Show Profile Changes
// @namespace    https://github.com/ddmgy/userscripts
// @version      0.1.0
// @description  Show changes to your Danbooru profile page
// @author       ddmgy
// @match        *://*.donmai.us/profile
// @match        *://*.donmai.us/users/*
// @grant        none
// @run-at       document-idle
// @downloadURL  https://raw.githubusercontent.com/ddmgy/userscripts/master/DanbooruShowProfileChanges.user.js
// @updateURL    https://raw.githubusercontent.com/ddmgy/userscripts/master/DanbooruShowProfileChanges.user.js
// ==/UserScript==

const userId = $("body").attr("data-current-user-id");
const userName = $("body").attr("data-current-user-name");

if (userId === null || userName === null) {
  Danbooru.error("Unable to retrieve user information");
  return;
}

const userIdMatch = /\/users\/(\d+)\/?/.exec(window.location.pathname);
if (userName !== $("a.user").text()) {
  return;
}

function __insertStyle(css) {
  if (!css) { return; }
  if (typeof window === 'undefined') { return; }

  const style = document.createElement("style");
  style.setAttribute("type", "text/css");
  style.innerHTML = css;
  document.head.appendChild(style);
}

class Extractor {
  static number(element) {
    return +(/(\d+)/.exec(element.text())[1]);
  }
}

Object.freeze(Extractor);

class Compare {
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
}

Object.freeze(Compare);

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
  { index: 23, className: "user-api-key" },
];

for (const { index, className } of classNames) {
  $(`tr:nth-of-type(${index})`).addClass(className);
}

/*
 * new info processing
 * key: identifying string, to store data
 * selector: used to select element
 * compare: get diff between previous and extracted values
 * render: function (element, old, new, diff) to create element to show changes
*/
const infos = [
  {
    key: "upload_limit_pending",
    selector: "tr.user-upload-limit a:nth-of-type(1)",
  },
  {
    key: "upload_limit_total",
    selector: "tr.user-upload-limit abbr",
  },
  {
    key: "uploads",
    selector: "tr.user-uploads a:nth-of-type(1)",
  },
  {
    key: "deleted_uploads",
    selector: "tr.user-deleted-uploads a",
  },
  {
    key: "favorites",
    selector: "tr.user-favorites a:nth-of-type(1)",
  },
  {
    key: "votes_posts",
    selector: "tr.user-votes a:nth-of-type(1)",
  },
  {
    key: "votes_comments",
    selector: "tr.user-votes a:nth-of-type(2)",
  },
  {
    key: "votes_forum_posts",
    selector: "tr.user-votes a:nth-of-type(3)",
  },
  {
    key: "favorite_groups",
    selector: "tr.user-favorite-groups a",
  },
  {
    key: "post_changes",
    selector: "tr.user-post-changes a:nth-of-type(1)",
  },
  {
    key: "note_changes_total",
    selector: "tr.user-note-changes a:nth-of-type(1)",
  },
  {
    key: "note_changes_posts",
    selector: "tr.user-note-changes a:nth-of-type(2)",
  },
  {
    key: "wiki_page_changes",
    selector: "tr.user-wiki-page-changes a",
  },
  {
    key: "artist_changes",
    selector: "tr.user-artist-changes a",
  },
  {
    key: "commentary_changes",
    selector: "tr.user-commentary-changes a",
  },
  {
    key: "forum_posts",
    selector: "tr.user-forum-posts a",
  },
  {
    key: "approvals",
    selector: "tr.user-approvals a",
  },
  {
    key: "comments_total",
    selector: "tr.user-comments a:nth-of-type(1)",
  },
  {
    key: "comments_posts",
    selector: "tr.user-comments a:nth-of-type(2)",
  },
  {
    key: "appeals",
    selector: "tr.user-appeals a",
  },
  {
    key: "flags",
    selector: "tr.user-flags a",
  },
  {
    key: "feedback",
    selector: "tr.user-feedback a",
    extractor: (el) => {
      const re = /positive:(\d+)\s+neutral:(\d+)\s+negative:(\d+)/;
      const match = re.exec(el.text());

      return {
        positive: +match[1],
        neutral: +match[2],
        negative: +match[3],
      };
    },
    compare: Compare.objects,
    render: (el, oldValue, newValue, diff) => {
      const allUrl = $(el).attr("href");

      const getClass = (value) => value === 0 ? "neutral" : (value > 0 ? "positive" : "negative");
      const link = (key) => `<a href="${allUrl}&search%5Bcategory%5D=${key}" title="${oldValue[key]}">${key}:${newValue[key]}<sup class="dspc-${getClass(diff[key])}">${diff[key]}</sup></a>`;

      $(el).replaceWith(`
        <div>
          <a href="${allUrl}">all</a>
          ${link("positive")}
          ${link("neutral")}
          ${link("negative")}
        </div>
      `);
    },
  },
];


async function processInfo({ key, selector, extractor = Extractor.number, compare = Compare.numbers, render }) {
  const stored = JSON.parse(window.localStorage.getItem(`dspc-${key}`));

  const element = $(selector);
  if (!element) {
    console.error(`cannot select element for key "${key}"`);
    return;
  }

  const extracted = extractor(element);
  if (extracted === undefined) {
    console.error(`cannot extract data for key "${key}"`);
    return;
  }

  if (stored !== null) {
    const diff = compare(stored, extracted);

    if (render !== undefined) {
      render(element, stored, extracted, diff);
    } else {
      const className = diff === 0 ? "neutral" : (diff > 0 ? "positive" : "negative");
      $(element).after(`<sup class="dspc-${className}" title="${stored}">${diff}</sup>`);
    }
  }

  window.localStorage.setItem(`dspc-${key}`, JSON.stringify(extracted));
}

infos.forEach(processInfo);

$("a.user").after(`
  <div class="dspc-clear-data">
    <button id="dspc-clear-button" title="Reset Danbooru Show Profile Changes stored data">⟳</button>
  </div>
`);

$("#dspc-clear-button").on("click", function () {
  for (const { key } of infos) {
    console.log(`removing key "${key}"`);
    window.localStorage.removeItem(`dspc-${key}`);
  }

  Danbooru.notice("Cleared stored data for Danbooru Show Profile Changes");
});
