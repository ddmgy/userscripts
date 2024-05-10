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
// @downloadURL https://github.com/ddmgy/userscripts/blob/master/danbooru-page-selector/dist/danbooru-page-selector.min.user.js?raw=true
// @updateURL   https://github.com/ddmgy/userscripts/blob/master/danbooru-page-selector/dist/danbooru-page-selector.min.user.js?raw=true
// ==/UserScript==

"use strict";(()=>{function o(e,r){let n=new window.URL(window.location.href),a=+(n.searchParams.get("page")??1);$(r).replaceWith(`
    <form id="dps-form-${e}" >
      <input id="dps-input-${e}" type="number" min="1" value="${a}" size="8" maxlength="8" />
    </form>
  `),$(`#dps-form-${e}`).off().on("submit",i=>{i.preventDefault();let t=$(`#dps-input-${e}`).val();t===void 0||t===""||+t===a||(n.searchParams.set("page",t.toString()),window.location.href=n.toString())})}function c(){let e=$("div.paginator").detach();e.length!==0&&($("div.posts-container").before(e.clone()).after(e),$("span.paginator-current").each((r,n)=>o(r,n)))}$(c);})();
