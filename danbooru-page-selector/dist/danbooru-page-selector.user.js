// ==UserScript==
// @name        danbooru-page-selector
// @version     0.1.2
// @description Adds a page selector to any page on Danbooru that has a paginator
// @author      ddmgy
// @namespace   ddmgy
// @match       *://*.donmai.us/*
// @exclude     /^https?://\w+\.donmai\.us/.*\.(xml|json|atom)(\?|$)/
// @grant       none
// @run-at      document-idle
// @downloadURL https://github.com/ddmgy/userscripts/blob/master/danbooru-page-selector/dist/danbooru-page-selector.user.js?raw=true
// @updateURL   https://github.com/ddmgy/userscripts/blob/master/danbooru-page-selector/dist/danbooru-page-selector.user.js?raw=true
// ==/UserScript==

"use strict";
(() => {
  // src/index.ts
  function createPageSelector(i, element) {
    const url = new window.URL(window.location.href);
    const page = +(url.searchParams.get("page") ?? 1);
    $(element).replaceWith(`
    <form id="dps-form-${i}" >
      <input id="dps-input-${i}" type="number" min="1" value="${page}" size="8" maxlength="8" />
    </form>
  `);
    $(`#dps-form-${i}`).off().on("submit", (event) => {
      event.preventDefault();
      const newPage = $(`#dps-input-${i}`).val();
      if (newPage === void 0 || newPage === "" || +newPage === page) {
        return;
      }
      url.searchParams.set("page", newPage.toString());
      window.location.href = url.toString();
    });
  }
  function initialize() {
    const paginator = $("div.paginator").detach();
    if (paginator.length === 0) {
      return;
    }
    $("div.posts-container").before(paginator.clone()).after(paginator);
    $("span.paginator-current").each((i, el) => createPageSelector(i, el));
  }
  $(initialize);
})();
