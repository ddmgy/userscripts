const Danbooru = require("./Danbooru.d.ts");

function __insertStyle(css: string): void {
  if (css === "" || typeof window === "undefined") {
    return;
  }

  const style = document.createElement("style");
  style.setAttribute("type", "text/css");
  style.innerHTML = css;
  document.head.appendChild(style);
}

type JSONValue = number | string | boolean | {[key: string]: JSONValue};

type ShowProfileChangesOptions = {
  key: string;
  selector: string;
  extractor?: (el: JQuery) => JSONValue | null;
  comparator?: (a: JSONValue, b: JSONValue) => JSONValue;
  render?: (el: JQuery, oldValue: JSONValue, newValue: JSONValue, diff: JSONValue) => void;
};

class Extractor {
  static number(element: JQuery): number | null {
    const match = /(\d+)/.exec(element.text());

    if (match === null) {
      return null;
    }

    return +match[1];
  }
}

class Comparator {
  static numbers(a: number, b: number): number {
    return b - a;
  }

  static objects(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
    const ret: Record<string, number> = {};

    for (const key of Object.keys(a)) {
      ret[key] = b[key] - a[key];
    }

    return ret;
  }
}

class DSPCStorage {
  static get(key: string): JSONValue | null {
    const stored = window.localStorage.getItem(`dspc-${key}`);

    if (stored === null) {
      return null;
    }

    return JSON.parse(stored);
  }

  static set(key: string, value: JSONValue): void {
    window.localStorage.setItem(`dspc-${key}`, JSON.stringify(value));
  }

  static remove(key: string): void {
    window.localStorage.removeItem(`dspc-${key}`);
  }
}

function __getClass(value: JSONValue): string {
  const isPositive = (value: JSONValue) => {
    if (typeof value === "string") {
      return value !== "";
    } else if (typeof value === "number") {
      return value > 0;
    } else if (typeof value === "boolean") {
      return value;
    } else if (typeof value === "object") {
      for (const v of Object.values(value)) {
        if (!isPositive(v)) {
          return false;
        }
      }

      return true;
    }

    return false;
  };

  return value === 0 ? "neutral" : (isPositive(value) ? "positive" : "negative");
}

function __makeSup(value: JSONValue, title?: string): string {
  return `
    <sup class="dspc-${__getClass(value)}" title="${title === undefined ? "" : title}">
      ${value}
    </sup>
  `;
}

class ShowProfileChanges {
  static infos: ShowProfileChangesOptions[] = [
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
      extractor: (el: JQuery) => {
        const re = /positive:(\d+)\s+neutral:(\d+)\s+negative:(\d+)/;
        const match = re.exec(el.text());

        if (match === null) {
          return null;
        }

        return {
          positive: +match[1],
          neutral: +match[2],
          negative: +match[3],
        };
      },
      // @ts-expect-error
      comparator: Comparator.objects,
      // @ts-expect-error
      render: (el: JQuery, oldValue: Record<string, number>, newValue: Record<string, number>, diff: Record<string, number>) => {
        const allUrl = $(el).attr("href");

        const link = (key: string) => `
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
      },
    },
  ];

  static initialize(): void {
    const userId = $("body").attr("data-current-user-id");
    const userName = $("body").attr("data-current-user-name");

    if (userId === undefined || userName === undefined) {
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

    ShowProfileChanges.addClassNames();
    ShowProfileChanges.processAll();
    ShowProfileChanges.addButton();
  }

  static addClassNames(): void {
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
  }

  static processAll(): void {
    for (const info of ShowProfileChanges.infos) {
      ShowProfileChanges.processInfo(info);
    }
  }

  // @ts-expect-error
  static processInfo({ key, selector, extractor = Extractor.number, comparator = Comparator.numbers, render }: ShowProfileChangesOptions): void {
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

      if (render !== undefined) {
        render(element, stored, extracted, diff);
      } else {
        $(element).after(__makeSup(diff, stored.toString()));
      }
    }

    DSPCStorage.set(key, extracted);
  }

  static addButton(): void {
    $("a.user").after(`
      <div class="dspc-clear-data">
        <button id="dspc-clear-button" title="Reset danbooru-show-profile-changes stored data">⟳</button>
      </div>
    `);

    $("#dspc-clear-button").on("click", () => {
      for (const { key } of ShowProfileChanges.infos) {
        console.log(`[danbooru-show-profile-changes] removing key "${key}"`);
        DSPCStorage.remove(key);
      }

      Danbooru.notice("Cleared stored data for danbooru-show-profile-changes");
    });
  }
}

$(ShowProfileChanges.initialize);
