// ==UserScript==
// @name         Danbooru Page Selector
// @namespace    https://github.com/ddmgy/userscripts
// @version      0.1.0
// @description  Add a page selector to Danbooru
// @author       ddmgy
// @match        *://*.donmai.us/*
// @exclude      /^https?://\w+\.donmai\.us/.*\.(xml|json|atom)(\?|$)/
// @grant        none
// @run-at       document-idle
// @downloadURL  https://raw.githubusercontent.com/ddmgy/userscripts/master/DanbooruPageSelector.user.js
// @updateURL    https://raw.githubusercontent.com/ddmgy/userscripts/master/DanbooruPageSelector.user.js
// ==/UserScript==

'use strict';

function replaceCurrentPaginatorIndicator(currentPaginator) {
  const url = new window.URL(window.location.href);
  const page = +(url.searchParams.get("page") ?? 1);

  $(currentPaginator).replaceWith($(`
    <form id="dps-paginator-selector-form" >
      <input id="dps-paginator-selector" type="number" min="1" value="${page}" size="8" maxlength="8" />
    </form>`
  ));

  $("#dps-paginator-selector-form").on("submit", function (event) {
    event.preventDefault();

    const newPage = $("#dps-paginator-selector").val();
    if (newPage === "" || +newPage === page) {
        return;
    }

    url.searchParams.set("page", newPage);
    window.location.href = url.toString();
  });
}

const currentPaginator = $("span.paginator-current");

if (currentPaginator.length !== 0) {
  replaceCurrentPaginatorIndicator(currentPaginator.first()[0]);
}
