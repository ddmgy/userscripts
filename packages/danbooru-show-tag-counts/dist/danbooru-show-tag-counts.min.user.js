// ==UserScript==
// @name        danbooru-show-tag-counts (minified)
// @version     0.1.3
// @description Show tag counts on Danbooru posts
// @author      ddmgy
// @namespace   ddmgy
// @match       *://*.donmai.us/posts/*
// @exclude     /^https?://\w+\.donmai\.us/posts/.*\.(xml|json|atom)(\?|$)/
// @grant       GM_addStyle
// @downloadURL https://github.com/ddmgy/userscripts/blob/master/danbooru-show-tag-counts (minified)/dist/danbooru-show-tag-counts.min.user.js?raw=true
// @updateURL   https://github.com/ddmgy/userscripts/blob/master/danbooru-show-tag-counts (minified)/dist/danbooru-show-tag-counts.min.user.js?raw=true
// ==/UserScript==

"use strict";(()=>{var a=`
.dstc-post-count {
  font-weight: normal;
  color: var(--tag-count-color);
}
`;function n({headerSelector:t,tagSelector:e}){let o=$(`h3.${t}-tag-list`);if(o.length===0){console.log(`[danbooru-show-tag-counts] h3.${t}-tag-list does not exist, skipping`);return}$(o).append($("<span></span>",{class:"dstc-post-count",text:$(`.tag-type-${e}`).length}))}function r(){$(".dstc-post-count").remove();let t=[{headerSelector:"artist",tagSelector:"1"},{headerSelector:"copyright",tagSelector:"3"},{headerSelector:"character",tagSelector:"4"},{headerSelector:"general",tagSelector:"0"},{headerSelector:"meta",tagSelector:"5"}];for(let e of t)n(e)}GM_addStyle(a);$(r);})();
