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
// @downloadURL https://github.com/ddmgy/userscripts/blob/master/danbooru-page-selector/dist/danbooru-page-selector.min.user.js?raw=true
// @updateURL   https://github.com/ddmgy/userscripts/blob/master/danbooru-page-selector/dist/danbooru-page-selector.min.user.js?raw=true
// ==/UserScript==

"use strict";(()=>{function o(t){let e=new window.URL(window.location.href),i=+(e.searchParams.get("page")??1);$(t).replaceWith(`
    <form id="dps-form" >
      <input id="dps-input" type="number" min="1" value="${i}" size="8" maxlength="8" />
    </form>
  `),$("#dps-form").off().on("submit",a=>{a.preventDefault();let n=$("#dps-input").val();n===void 0||n===""||+n===i||(e.searchParams.set("page",n.toString()),window.location.href=e.toString())})}function r(){$("span.paginator-current").each((t,e)=>o(e))}$(r);})();
