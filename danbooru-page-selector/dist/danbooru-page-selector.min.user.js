// ==UserScript==
// @name        danbooru-page-selector
// @version     0.1.0
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

"use strict";(()=>{function r(n){let e=new window.URL(window.location.href),a=+(e.searchParams.get("page")??1);$(n).replaceWith(`
    <form id="dps-paginator-selector-form" >
      <input id="dps-paginator-selector" type="number" min="1" value="${a}" size="8" maxlength="8" />
    </form>
  `),$("dps-paginator-selector-form").on("submit",o=>{o.preventDefault();let t=$("#dps-paginator-selector").val();t===void 0||t===""||t===a||(e.searchParams.set("page",t.toString()),window.location.href=e.toString())})}function i(){$("span.paginator-current").each((n,e)=>r(e))}$(i);})();
