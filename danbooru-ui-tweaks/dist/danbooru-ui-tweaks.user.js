// ==UserScript==
// @name        danbooru-ui-tweaks
// @version     0.1.0
// @description Tweaks to the Danbooru interface
// @author      ddmgy
// @namespace   ddmgy
// @match       *://*.donmai.us/posts/*
// @exclude     /^https?://\w+\.donmai\.us/posts/.*\.(xml|json|atom)(\?|$)/
// @grant       none
// @downloadURL https://github.com/ddmgy/userscripts/blob/master/danbooru-ui-tweaks/dist/danbooru-ui-tweaks.user.js?raw=true
// @updateURL   https://github.com/ddmgy/userscripts/blob/master/danbooru-ui-tweaks/dist/danbooru-ui-tweaks.user.js?raw=true
// ==/UserScript==

"use strict";
(() => {
  // src/index.ts
  function addTagCount({ headerSelector, tagSelector }) {
    const original = $(`h3.${headerSelector}-tag-list`);
    if (original.length === 0) {
      console.log(`[danbooru-ui-tweaks] h3.${headerSelector}-tag-list does not exist, skipping`);
      return;
    }
    $(original).append($("<span></span>", {
      "class": "post-count",
      "text": $(`.tag-type-${tagSelector}`).length,
      "style": "font-weight: normal"
    }));
  }
  function initialize() {
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
  $(initialize);
})();
