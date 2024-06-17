// ==UserScript==
// @name        danbooru-show-tag-counts
// @version     0.1.3
// @description Show tag counts on Danbooru posts
// @author      ddmgy
// @namespace   ddmgy
// @match       *://*.donmai.us/posts/*
// @exclude     /^https?://\w+\.donmai\.us/posts/.*\.(xml|json|atom)(\?|$)/
// @grant       GM_addStyle
// @downloadURL https://github.com/ddmgy/userscripts/blob/master/packages/danbooru-show-tag-counts/dist/danbooru-show-tag-counts.user.js?raw=true
// @updateURL   https://github.com/ddmgy/userscripts/blob/master/packages/danbooru-show-tag-counts/dist/danbooru-show-tag-counts.user.js?raw=true
// ==/UserScript==

"use strict";
(() => {
  // src/index.ts
  var DSTC_CSS = `
.dstc-post-count {
  font-weight: normal;
  color: var(--tag-count-color);
}
`;
  function addTagCount({ headerSelector, tagSelector }) {
    const original = $(`h3.${headerSelector}-tag-list`);
    if (original.length === 0) {
      console.log(`[danbooru-show-tag-counts] h3.${headerSelector}-tag-list does not exist, skipping`);
      return;
    }
    $(original).append($("<span></span>", {
      "class": "dstc-post-count",
      "text": $(`.tag-type-${tagSelector}`).length
    }));
  }
  function initialize() {
    $(".dstc-post-count").remove();
    const tagTypes = [
      {
        headerSelector: "artist",
        tagSelector: "1"
      },
      {
        headerSelector: "copyright",
        tagSelector: "3"
      },
      {
        headerSelector: "character",
        tagSelector: "4"
      },
      {
        headerSelector: "general",
        tagSelector: "0"
      },
      {
        headerSelector: "meta",
        tagSelector: "5"
      }
    ];
    for (const tagType of tagTypes) {
      addTagCount(tagType);
    }
  }
  GM_addStyle(DSTC_CSS);
  $(initialize);
})();
