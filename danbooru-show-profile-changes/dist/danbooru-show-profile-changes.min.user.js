// ==UserScript==
// @name        danbooru-show-profile-changes
// @version     0.1.1
// @description Show changes to your Danbooru profile page
// @author      ddmgy
// @namespace   ddmgy
// @match       *://*.donmai.us/profile
// @match       *://*.donmai.us/users/*
// @grant       none
// @downloadURL https://github.com/ddmgy/userscripts/blob/master/danbooru-show-profile-changes/dist/danbooru-show-profile-changes.min.user.js?raw=true
// @updateURL   https://github.com/ddmgy/userscripts/blob/master/danbooru-show-profile-changes/dist/danbooru-show-profile-changes.min.user.js?raw=true
// ==/UserScript==

"use strict";(()=>{var h=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports);var m=h(()=>{"use strict"});var g=m();function b(t){if(t===""||typeof window>"u")return;let e=document.createElement("style");e.setAttribute("type","text/css"),e.innerHTML=t,document.head.appendChild(e)}var d=class{static number(e){let s=/(\d+)/.exec(e.text());return s===null?null:+s[1]}},u=class{static numbers(e,s){return s-e}static objects(e,s){let r={};for(let a of Object.keys(e))r[a]=s[a]-e[a];return r}},l=class{static get(e){let s=window.localStorage.getItem(`dspc-${e}`);return s===null?null:JSON.parse(s)}static set(e,s){window.localStorage.setItem(`dspc-${e}`,JSON.stringify(s))}static remove(e){window.localStorage.removeItem(`dspc-${e}`)}};function v(t){let e=s=>{if(typeof s=="string")return s!=="";if(typeof s=="number")return s>0;if(typeof s=="boolean")return s;if(typeof s=="object"){for(let r of Object.values(s))if(!e(r))return!1;return!0}return!1};return t===0?"neutral":e(t)?"positive":"negative"}function y(t,e){return`
    <sup class="dspc-${v(t)}" title="${e===void 0?"":e}">
      ${t}
    </sup>
  `}var p=class t{static infos=[{key:"upload_limit_pending",selector:"tr.user-upload-limit a:nth-of-type(1)"},{key:"upload_limit_total",selector:"tr.user-upload-limit abbr"},{key:"uploads",selector:"tr.user-uploads a:nth-of-type(1)"},{key:"deleted_uploads",selector:"tr.user-deleted-uploads a"},{key:"favorites",selector:"tr.user-favorites a:nth-of-type(1)"},{key:"votes_posts",selector:"tr.user-votes a:nth-of-type(1)"},{key:"votes_comments",selector:"tr.user-votes a:nth-of-type(2)"},{key:"votes_forum_posts",selector:"tr.user-votes a:nth-of-type(3)"},{key:"favorite_groups",selector:"tr.user-favorite-groups a"},{key:"post_changes",selector:"tr.user-post-changes a:nth-of-type(1)"},{key:"note_changes_total",selector:"tr.user-note-changes a:nth-of-type(1)"},{key:"note_changes_posts",selector:"tr.user-note-changes a:nth-of-type(2)"},{key:"wiki_page_changes",selector:"tr.user-wiki-page-changes a"},{key:"artist_changes",selector:"tr.user-artist-changes a"},{key:"commentary_changes",selector:"tr.user-commentary-changes a"},{key:"forum_posts",selector:"tr.user-forum-posts a"},{key:"approvals",selector:"tr.user-approvals a"},{key:"comments_total",selector:"tr.user-comments a:nth-of-type(1)"},{key:"comments_posts",selector:"tr.user-comments a:nth-of-type(2)"},{key:"appeals",selector:"tr.user-appeals a"},{key:"flags",selector:"tr.user-flags a"},{key:"feedback",selector:"tr.user-feedback a",extractor:e=>{let r=/positive:(\d+)\s+neutral:(\d+)\s+negative:(\d+)/.exec(e.text());return r===null?null:{positive:+r[1],neutral:+r[2],negative:+r[3]}},compare:u.objects,render:(e,s,r,a)=>{let i=$(e).attr("href"),n=o=>`
          <a href="${i}&search%5Bcategory%5D=${o}" title="${s[o]}">
            ${o}:${r[o]}
            ${y(a[o])}
          </a>
        `;$(e).replaceWith(`
          <div>
            <a href="${i}">all</a>
            ${n("positive")}
            ${n("neutral")}
            ${n("negative")}
          </div>
        `)}}];static initialize(){let e=$("body").attr("data-current-user-id"),s=$("body").attr("data-current-user-name");if(e===void 0||s===void 0){g.error("Unable to retrieve user information");return}s===$("a.user").text()&&(b(`
    .dspc-positive {
      color: var(--green-4);
    }
    .dspc-neutral {
      color: var(--grey-4);
      display: none;
    }
    .dspc-negative {
      color: var(--red-4);
    }
    #dspc-clear-button {
      font-size: 14px;
    }
    `),t.addClassNames(),t.processAll(),t.addButton())}static addClassNames(){let e=[{index:1,className:"user-id"},{index:2,className:"user-join-date"},{index:4,className:"user-level"},{index:5,className:"user-upload-limit"},{index:6,className:"user-uploads"},{index:7,className:"user-deleted-uploads"},{index:8,className:"user-favorites"},{index:9,className:"user-votes"},{index:10,className:"user-favorite-groups"},{index:11,className:"user-post-changes"},{index:12,className:"user-note-changes"},{index:13,className:"user-wiki-page-changes"},{index:14,className:"user-artist-changes"},{index:15,className:"user-commentary-changes"},{index:16,className:"user-pool-changes"},{index:17,className:"user-forum-posts"},{index:18,className:"user-approvals"},{index:19,className:"user-comments"},{index:20,className:"user-appeals"},{index:21,className:"user-flags"},{index:22,className:"user-feedback"},{index:23,className:"user-api-key"}];for(let{index:s,className:r}of e)$(`tr:nth-of-type(${s})`).addClass(r)}static processAll(){for(let e of t.infos)t.processInfo(e)}static processInfo({key:e,selector:s,extractor:r=d.number,comparator:a=u.numbers,render:i}){let n=l.get(e),o=$(s);if(o.length===0){console.error(`[danbooru-show-profile-changes] Cannot selector element for key "${e}"`);return}let c=r(o);if(c===null){console.error(`[danbooru-show-profile-changes] Cannot extract data for key "${e}`);return}if(n!==null){let f=a(n,c);i!==void 0?i(o,n,c,f):$(o).after(y(f,n.toString()))}l.set(e,c)}static addButton(){$("a.user").after(`
      <div class="dspc-clear-data">
        <button id="dspc-clear-button" title="Reset danbooru-show-profile-changes stored data">\u27F3</button>
      </div>
    `),$("#dspc-clear-button").on("click",()=>{for(let{key:e}of t.infos)console.log(`[danbooru-show-profile-changes] removing key "${e}"`),l.remove(e);g.notice("Cleared stored data for danbooru-show-profile-changes")})}};$(p.initialize);})();
