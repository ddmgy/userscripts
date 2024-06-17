// ==UserScript==
// @name        danbooru-panzoom-on-posts
// @version     0.1.0
// @description Add panzoom to posts on Danbooru
// @author      ddmgy
// @namespace   ddmgy
// @match       *://*.donmai.us/posts/*
// @grant       none
// @downloadURL https://github.com/ddmgy/userscripts/blob/master/danbooru-panzoom-on-posts/dist/danbooru-panzoom-on-posts.user.js?raw=true
// @updateURL   https://github.com/ddmgy/userscripts/blob/master/danbooru-panzoom-on-posts/dist/danbooru-panzoom-on-posts.user.js?raw=true
// @require     https://unpkg.com/panzoom@^9.4.3/dist/panzoom.min.js
// ==/UserScript==

"use strict";
(() => {
  // src/index.ts
  function __insertStyle(css) {
    if (css === "" || typeof window === "undefined") {
      return;
    }
    const style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.innerHTML = css;
    document.head.appendChild(style);
  }
  __insertStyle(`
.image-container:not(:hover) .image-zoom-level {
  opacity: 0;
}
.image-zoom-level {
  color: var(--preview-icon-color);
  background: var(--preview-icon-background);
}
`);
  var PanzoomOnPosts = class _PanzoomOnPosts {
    static initialize() {
      $("img#image").each((_, el) => {
        if (el.hasAttribute("ex-panzoom-on-posts")) {
          return;
        }
        el.setAttribute("ex-panzoom-on-posts", "");
        new _PanzoomOnPosts(el);
      });
    }
    $component;
    $container;
    $zoomLevels;
    $panzoom;
    $image;
    panzoom;
    constructor(element) {
      this.$component = $("<div>", { "class": "image-component" });
      this.$component.css({
        "top": "1rem",
        "position": "sticky",
        "--height": "calc(max(var(__min-asset-height), 100vh - max(1rem, var(--header-visible-height))))",
        "max-height": "var(--height)",
        "min-height": "var(--height)",
        "overflow": "hidden"
      });
      this.$container = $("<div>", { "class": "image-asset-container" });
      this.$container.css({
        "width": "100%",
        "height": "100%"
      });
      const zoomLevel = $("<div>", { "class": "image-zoom-level absolute p-1 m-0.5 leading-none rounded text-xs font-arial font-bold pointer-events-none transition-opacity" });
      this.$zoomLevels = new Array();
      for (const [c1, c2] of [["top", "left"], ["top", "right"], ["bottom", "left"], ["bottom", "right"]]) {
        const el = zoomLevel.clone();
        el.addClass(`${c1}-0.5`);
        el.addClass(`${c2}-0.5`);
        el.css({
          "z-index": "1",
          "cursor": "pointer",
          "pointer-events": "all"
        });
        el.on("click", (e) => this.fit());
        this.$zoomLevels.push(el);
      }
      this.$panzoom = $("<div>", { "class": "image-panzoom" });
      this.$panzoom.css({
        "width": "100%",
        "height": "100%",
        "flex": "1",
        "display": "flex",
        "align-items": "center",
        "justify-content": "center"
      });
      this.$image = $(element);
      this.$component.append(this.$container);
      this.$container.append(...this.$zoomLevels, this.$panzoom);
      this.$image.before(this.$component);
      this.$image.detach().appendTo(this.$panzoom);
      this.$image.off();
      this.$image.css({
        "cursor": "default",
        "max-height": "100%",
        "max-width": "100%"
      });
      this.panzoom = panzoom(this.$panzoom.get(0), {
        zoomDoubleClickSpeed: 1,
        onDoubleClick: (e) => {
          this.fit();
          return false;
        }
      });
      this.fit();
      this.updateZoom();
      this.panzoom.on("zoom", () => this.updateZoom());
      new ResizeObserver(() => this.updateZoom()).observe(this.$image.get(0));
    }
    fit() {
      this.panzoom.zoomAbs(0, 0, 1);
      this.panzoom.moveTo(0, 0);
    }
    updateZoom() {
      const zoomLevel = this.zoomLevel;
      const text = `${Math.round(100 * zoomLevel)}%`;
      for (const el of this.$zoomLevels) {
        el.removeClass("hidden").text(text);
      }
      this.$container.css("image-rendering", zoomLevel > 1 ? "pixelated" : "auto");
    }
    get zoomLevel() {
      return this.$image.width() * this.panzoom.getTransform().scale / Number(this.$image.attr("width"));
    }
  };
  $(PanzoomOnPosts.initialize);
  new MutationObserver((_mutationList, _observer) => {
    $(PanzoomOnPosts.initialize);
  }).observe(document.body, { childList: true, subtree: true });
})();
