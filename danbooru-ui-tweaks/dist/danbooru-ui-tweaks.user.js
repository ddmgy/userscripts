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
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/add_tag_count.ts
  var add_tag_count_exports = {};
  __export(add_tag_count_exports, {
    default: () => AddTagCount
  });
  var AddTagCount;
  var init_add_tag_count = __esm({
    "src/add_tag_count.ts"() {
      "use strict";
      AddTagCount = class _AddTagCount {
        static initialize() {
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
            _AddTagCount.addTagCount(tagType);
          }
        }
        static addTagCount({ headerSelector, tagSelector }) {
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
      };
    }
  });

  // src/index.ts
  var AddTagCount2 = (init_add_tag_count(), __toCommonJS(add_tag_count_exports));
  $(AddTagCount2.initialize);
})();
