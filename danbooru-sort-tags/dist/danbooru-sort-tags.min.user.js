// ==UserScript==
// @name        danbooru-sort-tags
// @version     0.1.2
// @description Sort tags on Danbooru by name or post count
// @author      ddmgy
// @namespace   ddmgy
// @match       *://*.donmai.us/posts/*
// @exclude     /^https?://\w+\.donmai\.us/posts/.*\.(xml|json|atom)(\?|$)/
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// @downloadURL https://github.com/ddmgy/userscripts/blob/master/danbooru-sort-tags/dist/danbooru-sort-tags.min.user.js?raw=true
// @updateURL   https://github.com/ddmgy/userscripts/blob/master/danbooru-sort-tags/dist/danbooru-sort-tags.min.user.js?raw=true
// ==/UserScript==

"use strict";(()=>{var T=`
<section class="dst-collapsible" id="dst-section">
  <h3>Sorting</h3>
  <label for="dst-sort-by">Sort by:</label>
  <select id="dst-sort-by">
    <option value="name" selected="selected">Name</option>
    <option value="count">Post count</option>
  </select>
  <br />
  <label for="dst-sort-ascending">Sort ascending? </label>
  <input id="dst-sort-ascending" type="checkbox" checked="on" />
</section>
`,d="name";var l=!1;function p(e,t){return e.name<t.name?-1:1}function m(e,t){return e.count-t.count}HTMLElement.prototype.nestingLevel=function(){let e=/tag\-nesting\-level\-(\d+)/;for(let[t,n]of this.classList.entries()){let s=e.exec(n);if(s!==null)return+s[1]}return 0};var a=class{element;name;count;children;_nestingLevel=void 0;constructor(t){this.element=t,this.name=$("a.search-tag",t).text().trim();let n=$("span.post-count",t).attr("title");n===void 0?this.count=0:this.count=+n,this.children=[]}get nestingLevel(){return this._nestingLevel??=this.element.nestingLevel()}flattenTo(t){t.push(this.element);for(let n of this.children)n.flattenTo(t)}sort(t){this.children.sort(t);for(let n of this.children)n.sort(t)}toString(){return`"${this.name}" ${this.count}`}};function b(e){if(l)return;l=!0;let t=$("li",e);if(t.length<=1){l=!1;return}let n=$("select#dst-sort-by option:selected").val(),s=$("input#dst-sort-ascending").prop("checked"),c=n==="count"?m:p;if(!s){let i=c;c=(h,f)=>-i(h,f)}let o=t.detach().get().map(i=>new a(i));t:for(;;){for(var r=o.length-1;r>=1;){if(o[r].nestingLevel-o[r-1].nestingLevel==1){o[r-1].children.push(...o.splice(r,1));continue t}r-=1}break}o.sort(c);let g=[];for(let i of o)i.sort(c),i.flattenTo(g);$(e).append(...g),l=!1}function u(){let e=["ul.artist-tag-list","ul.copyright-tag-list","ul.character-tag-list","ul.general-tag-list","ul.meta-tag-list"];for(let t of e)$(t).each((n,s)=>b(s))}function _(e){let t=$(e);if(t.length===0)return;t.before(T);let{sortBy:n,sortAscending:s}=L();$("select#dst-sort-by option").removeAttr("selected").filter(`[value=${n}]`).prop("selected","selected").trigger("change"),$("input#dst-sort-ascending").prop("checked",s).trigger("change"),$("select#dst-sort-by, input#dst-sort-ascending").on("change",c=>{v(),u()}),(n===d||s===!0)&&u()}function v(){let e=$("select#dst-sort-by option:selected").val(),t=$("input#dst-sort-ascending").prop("checked");GM_setValue("dst_sort_by",e),GM_setValue("dst_sort_ascending",t)}function L(){let e=GM_getValue("dst_sort_by",d),t=GM_getValue("dst_sort_ascending",!0);return{sortBy:e,sortAscending:t}}function y(){_("section#tag-list")}$(y);})();
