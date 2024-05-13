// ==UserScript==
// @name        danbooru-sort-tags
// @version     0.1.0
// @description Sort tags on Danbooru by name or post count
// @author      ddmgy
// @namespace   ddmgy
// @match       *://*.donmai.us/posts/*
// @match       *://*.donmai.us/posts?*
// @exclude     /^https?://\w+\.donmai\.us/posts/.*\.(xml|json|atom)(\?|$)/
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// @downloadURL https://github.com/ddmgy/userscripts/blob/master/danbooru-sort-tags/dist/danbooru-sort-tags.user.js?raw=true
// @updateURL   https://github.com/ddmgy/userscripts/blob/master/danbooru-sort-tags/dist/danbooru-sort-tags.user.js?raw=true
// ==/UserScript==

"use strict";
(() => {
  // src/index.ts
  var DST_SECTION = `
<section class="dst-collapsible" id="dst-section">
  <h2>Sorting</h2>
  <label for="dst-sort-by">Sort by:</label>
  <select id="dst-sort-by">
    <option value="name" selected="selected">Name</option>
    <option value="count">Post count</option>
  </select>
  <br />
  <label for="dst-sort-ascending">Sort ascending? </label>
  <input id="dst-sort-ascending" type="checkbox" checked="on" />
</section>
`;
  var DEFAULT_SORT_BY = "name";
  var DEFAULT_SORT_ASCENDING = true;
  var _sorting = false;
  function sortByName(a, b) {
    return a.name < b.name ? -1 : 1;
  }
  function sortByCount(a, b) {
    return a.count - b.count;
  }
  HTMLElement.prototype.nestingLevel = function() {
    const LEVEL_RE = /tag\-nesting\-level\-(\d+)/;
    for (const [_, name] of this.classList.entries()) {
      const match = LEVEL_RE.exec(name);
      if (match !== null) {
        return +match[1];
      }
    }
    return 0;
  };
  var TagTree = class {
    element;
    name;
    count;
    children;
    _nestingLevel = void 0;
    constructor(element) {
      this.element = element;
      this.name = $("a.search-tag", element).text().trim();
      const title = $("span.post-count", element).attr("title");
      if (title === void 0) {
        this.count = 0;
      } else {
        this.count = +title;
      }
      this.children = [];
    }
    get nestingLevel() {
      return this._nestingLevel ??= this.element.nestingLevel();
    }
    flattenTo(elements) {
      elements.push(this.element);
      for (const child of this.children) {
        child.flattenTo(elements);
      }
    }
    sort(compareFn) {
      this.children.sort(compareFn);
      for (const child of this.children) {
        child.sort(compareFn);
      }
    }
    toString() {
      return `"${this.name}" ${this.count}`;
    }
  };
  function sortTagList(container) {
    if (_sorting) {
      return;
    }
    _sorting = true;
    const tags = $("li", container);
    if (tags.length <= 1) {
      _sorting = false;
      return;
    }
    const sortBy = $("select#dst-sort-by option:selected").val();
    const sortAscending = $("input#dst-sort-ascending").prop("checked");
    let sortFn = sortBy === "count" ? sortByCount : sortByName;
    if (!sortAscending) {
      const origSortFn = sortFn;
      sortFn = (a, b) => {
        return -origSortFn(a, b);
      };
    }
    const trees = tags.detach().get().map((el) => new TagTree(el));
    resetLoop: while (true) {
      var index = trees.length - 1;
      while (index >= 1) {
        if (trees[index].nestingLevel - trees[index - 1].nestingLevel == 1) {
          trees[index - 1].children.push(...trees.splice(index, 1));
          continue resetLoop;
        }
        index -= 1;
      }
      break;
    }
    trees.sort(sortFn);
    const sortedElements = [];
    for (const tree of trees) {
      tree.sort(sortFn);
      tree.flattenTo(sortedElements);
    }
    $(container).append(...sortedElements);
    _sorting = false;
  }
  function sortAll() {
    const containers = [
      "ul.artist-tag-list",
      "ul.copyright-tag-list",
      "ul.character-tag-list",
      "ul.general-tag-list",
      "ul.meta-tag-list",
      "ul.search-tag-list"
    ];
    for (const container of containers) {
      $(container).each((_, el) => sortTagList(el));
    }
  }
  function setupUI(anchorSelector) {
    const anchor = $(anchorSelector);
    if (anchor.length === 0) {
      return;
    }
    anchor.before(DST_SECTION);
    const { sortBy, sortAscending } = loadSettings();
    $("select#dst-sort-by option").removeAttr("selected").filter(`[value=${sortBy}]`).prop("selected", "selected").trigger("change");
    $("input#dst-sort-ascending").prop("checked", sortAscending).trigger("change");
    $("select#dst-sort-by, input#dst-sort-ascending").on("change", (_) => {
      saveSettings();
      sortAll();
    });
    if (sortBy === DEFAULT_SORT_BY || sortAscending === DEFAULT_SORT_ASCENDING) {
      sortAll();
    }
  }
  function saveSettings() {
    const sortBy = $("select#dst-sort-by option:selected").val();
    const sortAscending = $("input#dst-sort-ascending").prop("checked");
    GM_setValue("dst_sort_by", sortBy);
    GM_setValue("dst_sort_ascending", sortAscending);
  }
  function loadSettings() {
    const sortBy = GM_getValue("dst_sort_by", DEFAULT_SORT_BY);
    const sortAscending = GM_getValue("dst_sort_ascending", DEFAULT_SORT_ASCENDING);
    return { sortBy, sortAscending };
  }
  function initialize() {
    const tagListContainers = [
      "section#tag-list",
      "section#tag-box"
    ];
    for (const tagListContainer of tagListContainers) {
      setupUI(tagListContainer);
    }
  }
  $(initialize);
})();
