// ==UserScript==
// @name        danbooru-page-selector (minified)
// @version     0.1.3
// @description Adds a page selector to any page on Danbooru that has a paginator
// @author      ddmgy
// @namespace   ddmgy
// @match       *://*.donmai.us/*
// @exclude     /^https?://\w+\.donmai\.us/.*\.(xml|json|atom)(\?|$)/
// @grant       none
// @run-at      document-idle
// @downloadURL https://github.com/ddmgy/userscripts/blob/master/packages/danbooru-page-selector/dist/danbooru-page-selector.min.user.js?raw=true
// @updateURL   https://github.com/ddmgy/userscripts/blob/master/packages/danbooru-page-selector/dist/danbooru-page-selector.min.user.js?raw=true
// ==/UserScript==

"use strict";(()=>{function o(e,t){let i=new window.URL(window.location.href),r=+(i.searchParams.get("page")??1);$(t).replaceWith(`
    <form id="dps-form-${e}" >
      <input id="dps-input-${e}" type="number" min="1" value="${r}" size="8" maxlength="8" />
    </form>
  `),$(`#dps-form-${e}`).off().on("submit",a=>{a.preventDefault();let n=$(`#dps-input-${e}`).val();n===void 0||n===""||+n===r||(i.searchParams.set("page",n.toString()),window.location.href=i.toString())})}function u(){$("span.paginator-current").each((e,t)=>o(e,t))}$(u);})();
