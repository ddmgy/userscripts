// ==UserScript==
// @name        danbooru-sort-tags
// @version     0.1.3
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

"use strict";(()=>{var d=`
<section id="dst-section">
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
`,g="name";function u(o,t){return o.name<t.name?-1:1}function T(o,t){return o.count-t.count}HTMLElement.prototype.nestingLevel=function(){let o=/tag\-nesting\-level\-(\d+)/;for(let[t,e]of this.classList.entries()){let s=o.exec(e);if(s!==null)return+s[1]}return 0};var c=class{element;name;count;children;_nestingLevel=void 0;constructor(t){this.element=t,this.name=$("a.search-tag",t).text().trim();let e=$("span.post-count",t).attr("title");e===void 0?this.count=0:this.count=+e,this.children=[]}get nestingLevel(){return this._nestingLevel??=this.element.nestingLevel()}flattenTo(t){t.push(this.element);for(let e of this.children)e.flattenTo(t)}sort(t){this.children.sort(t);for(let e of this.children)e.sort(t)}toString(){return`${"  ".repeat(this.nestingLevel)}"${this.name}" ${this.count}`}},a=class{$sortBy;$sortAscending;get sortBy(){return this.$sortBy}set sortBy(t){let e=t!==this.$sortBy;this.$sortBy=t,e&&GM_setValue("dst_sort_by",this.$sortBy)}get sortAscending(){return this.$sortAscending}set sortAscending(t){let e=t!==this.$sortAscending;this.$sortAscending=t,e&&GM_setValue("dst_sort_ascending",this.$sortAscending)}get isDefault(){return this.$sortBy===g&&this.$sortAscending===!0}constructor(){this.$sortBy=GM_getValue("dst_sort_by",g),this.$sortAscending=GM_getValue("dst_sort_ascending",!0)}},l=class{$sorting=!1;$taglists=[];constructor(){for(let e of["artist","copyright","character","general","meta"]){let s=`ul.${e}-tag-list`,n=$(s),i=$("li",n);if(i.length===0)continue;let r=i.clone().get().map(h=>new c(h));t:for(;;){for(var t=r.length-1;t>=1;){if(r[t].nestingLevel-r[t-1].nestingLevel==1){r[t-1].children.push(...r.splice(t,1));continue t}t-=1}break}this.$taglists.push({anchor:s,trees:r})}}sort(t,e){if(this.$sorting)return;this.$sorting=!0;let s=t==="count"?T:u;if(!e){let n=s;s=(i,r)=>-n(i,r)}for(let n of this.$taglists){n.trees.sort(s);let i=[];for(let r of n.trees)r.sort(s),r.flattenTo(i);$("li",n.anchor).detach(),$(n.anchor).append(...i)}this.$sorting=!1}};function f(){let o=$("section#tag-list");if(o.length===0)return;o.before(d);let t=new a,e=new l;$("select#dst-sort-by option").removeAttr("selected").filter(`[value=${t.sortBy}]`).prop("selected","selected").trigger("change"),$("input#dst-sort-ascending").prop("checked",t.sortAscending).trigger("change"),$("select#dst-sort-by").on("change",s=>{let n=$("select#dst-sort-by option:selected").val();t.sortBy=n,e.sort(t.sortBy,t.sortAscending)}),$("input#dst-sort-ascending").on("change",s=>{let n=$("input#dst-sort-ascending").prop("checked");t.sortAscending=n,e.sort(t.sortBy,t.sortAscending)}),t.isDefault||e.sort(t.sortBy,t.sortAscending)}$(f);})();
