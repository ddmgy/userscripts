// ==UserScript==
// @name        danbooru-panzoom-on-posts (minified)
// @version     0.1.0
// @description Add panzoom to posts on Danbooru
// @author      ddmgy
// @namespace   ddmgy
// @match       *://*.donmai.us/posts/*
// @grant       none
// @downloadURL https://github.com/ddmgy/userscripts/blob/master/packages/danbooru-panzoom-on-posts/dist/danbooru-panzoom-on-posts.min.user.js?raw=true
// @updateURL   https://github.com/ddmgy/userscripts/blob/master/packages/danbooru-panzoom-on-posts/dist/danbooru-panzoom-on-posts.min.user.js?raw=true
// @require     https://unpkg.com/panzoom@^9.4.3/dist/panzoom.min.js
// ==/UserScript==

"use strict";(()=>{function r(o){if(o===""||typeof window>"u")return;let e=document.createElement("style");e.setAttribute("type","text/css"),e.innerHTML=o,document.head.appendChild(e)}r(`
.image-container:not(:hover) .image-zoom-level {
  opacity: 0;
}
.image-zoom-level {
  color: var(--preview-icon-color);
  background: var(--preview-icon-background);
}
`);var s=class o{static initialize(){$("img#image").each((e,t)=>{t.hasAttribute("ex-panzoom-on-posts")||(t.setAttribute("ex-panzoom-on-posts",""),new o(t))})}$component;$container;$zoomLevels;$panzoom;$image;panzoom;constructor(e){this.$component=$("<div>",{class:"image-component"}),this.$component.css({top:"1rem",position:"sticky","--height":"calc(max(var(__min-asset-height), 100vh - max(1rem, var(--header-visible-height))))","max-height":"var(--height)","min-height":"var(--height)",overflow:"hidden"}),this.$container=$("<div>",{class:"image-asset-container"}),this.$container.css({width:"100%",height:"100%"});let t=$("<div>",{class:"image-zoom-level absolute p-1 m-0.5 leading-none rounded text-xs font-arial font-bold pointer-events-none transition-opacity"});this.$zoomLevels=new Array;for(let[n,a]of[["top","left"],["top","right"],["bottom","left"],["bottom","right"]]){let i=t.clone();i.addClass(`${n}-0.5`),i.addClass(`${a}-0.5`),i.css({"z-index":"1",cursor:"pointer","pointer-events":"all"}),i.on("click",m=>this.fit()),this.$zoomLevels.push(i)}this.$panzoom=$("<div>",{class:"image-panzoom"}),this.$panzoom.css({width:"100%",height:"100%",flex:"1",display:"flex","align-items":"center","justify-content":"center"}),this.$image=$(e),this.$component.append(this.$container),this.$container.append(...this.$zoomLevels,this.$panzoom),this.$image.before(this.$component),this.$image.detach().appendTo(this.$panzoom),this.$image.off(),this.$image.css({cursor:"default","max-height":"100%","max-width":"100%"}),this.panzoom=panzoom(this.$panzoom.get(0),{zoomDoubleClickSpeed:1,onDoubleClick:n=>(this.fit(),!1)}),this.fit(),this.updateZoom(),this.panzoom.on("zoom",()=>this.updateZoom()),new ResizeObserver(()=>this.updateZoom()).observe(this.$image.get(0))}fit(){this.panzoom.zoomAbs(0,0,1),this.panzoom.moveTo(0,0)}updateZoom(){let e=this.zoomLevel,t=`${Math.round(100*e)}%`;for(let n of this.$zoomLevels)n.removeClass("hidden").text(t);this.$container.css("image-rendering",e>1?"pixelated":"auto")}get zoomLevel(){return this.$image.width()*this.panzoom.getTransform().scale/Number(this.$image.attr("width"))}};$(s.initialize);new MutationObserver((o,e)=>{$(s.initialize)}).observe(document.body,{childList:!0,subtree:!0});})();
