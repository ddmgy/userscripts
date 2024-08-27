// ==UserScript==
// @name        danbooru-show-tag-counts (minified)
// @version     0.2.0
// @description Show tag counts on Danbooru posts
// @author      ddmgy
// @namespace   ddmgy
// @match       *://*.donmai.us/posts/*
// @exclude     /^https?://\w+\.donmai\.us/posts/.*\.(xml|json|atom)(\?|$)/
// @grant       none
// @run-at      document-idle
// @downloadURL https://github.com/ddmgy/userscripts/blob/master/packages/danbooru-show-tag-counts/dist/danbooru-show-tag-counts.min.user.js?raw=true
// @updateURL   https://github.com/ddmgy/userscripts/blob/master/packages/danbooru-show-tag-counts/dist/danbooru-show-tag-counts.min.user.js?raw=true
// ==/UserScript==

"use strict";
(() => {
  // src/index.ts
  function addTagCount(headerSelector) {
    let header = document.querySelector(`h3.${headerSelector}-tag-list`);
    if (!header)
      return;
    let count = header.nextElementSibling?.querySelectorAll(".search-tag").length;
    count && (console.log(count), header.insertAdjacentHTML(
      "beforeend",
      `<span class="post-count" style="font-weight: normal;">${count}</span>`
    ));
  }
  function initialize() {
    let headerSelectors = [
      "artist",
      "copyright",
      "character",
      "general",
      "meta"
    ];
    for (let headerSelector of headerSelectors)
      addTagCount(headerSelector);
  }
  initialize();
})();
