// ==UserScript==
// @name        danbooru-page-selector
// @version     0.1.1
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
  function createPageSelector(element) {
    const url = new window.URL(window.location.href);
    const page = +(url.searchParams.get("page") ?? 1);
    $(element).replaceWith(`
    <form id="dps-form" >
      <input id="dps-input" type="number" min="1" value="${page}" size="8" maxlength="8" />
    </form>
  `);
    $("#dps-form").off().on("submit", (event) => {
      event.preventDefault();
      const newPage = $("#dps-input").val();
      if (newPage === void 0 || newPage === "" || +newPage === page) {
        return;
      }
      url.searchParams.set("page", newPage.toString());
      window.location.href = url.toString();
    });
  }
  function initialize() {
    $("span.paginator-current").each((_, el) => createPageSelector(el));
  }
  $(initialize);
})();
