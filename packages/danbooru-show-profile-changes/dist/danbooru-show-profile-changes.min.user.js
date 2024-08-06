// ==UserScript==
// @name        danbooru-show-profile-changes (minified)
// @version     0.4.0
// @description Show changes to your Danbooru profile page
// @author      ddmgy
// @namespace   ddmgy
// @match       *://*.donmai.us/profile
// @match       *://*.donmai.us/users/*
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @downloadURL https://github.com/ddmgy/userscripts/blob/master/packages/danbooru-show-profile-changes/dist/danbooru-show-profile-changes.min.user.js?raw=true
// @updateURL   https://github.com/ddmgy/userscripts/blob/master/packages/danbooru-show-profile-changes/dist/danbooru-show-profile-changes.min.user.js?raw=true
// ==/UserScript==

"use strict";(()=>{(()=>{let A=`
<button id="dspc-open-dialog" title="Open DSPC control dialog" style="margin-left: 1em">DPSC</button>
`,C=`
<dialog id="dspc-dialog">
  <div>
    <div id="dspc-main">
      <div id="dspc-intervals-section">
        <label>
          Interval(s):
          <input id="dspc-intervals" type="text" name="intervals" placeholder="1 day" />
        </label>
      </div>
      <div id="dspc-intervals-error">Error text</div>
      <div>
        <label>
          Hide:
          <select id="dspc-hide-select" name="hide">
            <option value="none">None</option>
            <option value="neutral">Neutral</option>
            <option value="all">All</option>
          </select>
        </label>
      </div>
    </div>
    <span id="dspc-buttons">
      <button id="dspc-clear-data" class="ui-button ui-widget ui-corner-all">Clear</button>
      <div id="dspc-button-spacer"></div>
      <button id="dspc-close-dialog" class="ui-button ui-widget ui-corner-all">Close</button>
      <button id="dspc-save-dialog" class="ui-button ui-widget ui-corner-all">Save</button>
    </span>
  </div>
</dialog>
`,P=`
#dspc-dialog {
  background-color: var(--card-background-color);
  color: var(--text-color);
}
#dspc-main {
  margin-bottom: 1rem;
}
#dspc-intervals-section {
  margin-bottom: 1rem;
}
#dspc-intervals-error {
  display: none;
  color: var(--error-color);
}
#dspc-buttons {
  display: flex;
}
#dspc-button-spacer {
  flex: 1;
}
.dspc-positive {
  color: var(--green-4);
}
.dspc-neutral {
  color: var(--grey-4);
}
.dspc-negative {
  color: var(--red-4);
}
.dspc-info {
  padding-left: 0.25em;
  vertical-align: middle;
}
`,S=/(\d+)\s*(day|week|month)s?/,x="1 day",E={day:864e5,week:6048e5,month:26784e5},N="none",b="\xB7",u=document.body.getAttribute("data-current-user-name"),i=document.body.getAttribute("data-current-user-id");function w(t){console.log(`[danbooru-show-profile-changes] ${t}`)}function Q(t){console.error(`[danbooru-show-profiles-changes] ${t}`)}function T(t){return`dspc-${t}`}class c{static get(e,s){return GM_getValue(T(e),s)}static set(e,s){GM_setValue(T(e),s)}static keys(){return GM_listValues()}static clear(){for(let e of c.keys())GM_deleteValue(e)}static remove(e){GM_deleteValue(T(e))}}class M{static parse(e){let s=S.exec(e),n=+s[1],a=s[2];return n*E[a]}}function H(t,e){let s=t===0?"neutral":t>0?"positive":"negative",n=document.createElement("sup");return n.classList.add(`dspc-${s}`),e&&(n.title=e),n.innerText=t.toString(),n}let q=[{name:"uploads",endpoint:"posts",selector:"tr.user-uploads a:nth-of-type(1)",timeKey:"created_at",options:{tags:`user:${u}`}},{name:"deleted_uploads",endpoint:"posts",selector:"tr.user-deleted-uploads a",timeKey:"updated_at",options:{tags:`user:${u}+status:deleted`}},{name:"favorites",endpoint:"posts",selector:"tr.user-favorites a:nth-of-type(1)",timeKey:"updated_at",options:{tags:`ordfav:${u}`}},{name:"post_votes",endpoint:"post_votes",selector:"tr.user-votes a:nth-of-type(1)",timeKey:"updated_at",options:{"search[user_id]":`${i}`}},{name:"comment_votes",endpoint:"comment_votes",selector:"tr.user-votes a:nth-of-type(2)",timeKey:"updated_at",options:{"search[user_id]":`${i}`}},{name:"forum_post_votes",endpoint:"forum_post_votes",selector:"tr.user-votes a:nth-of-type(3)",timeKey:"updated_at",options:{"search[creator_id]":`${i}`}},{name:"favorite_groups",endpoint:"favorite_groups",selector:"tr.user-favorite-groups a",timeKey:"updated_at",options:{"search[creator_id]":`${i}`}},{name:"post_versions",endpoint:"post_versions",selector:"tr.user-post-changes a:nth-of-type(1)",timeKey:"updated_at",options:{"search[updater_id]":`${i}`}},{name:"note_versions",endpoint:"note_versions",selector:"tr.user-note-changes a:nth-of-type(1)",timeKey:"created_at",options:{"search[updater_id]":`${i}`}},{name:"note_versions_posts",endpoint:"posts",selector:"tr.user-note-changes a:nth-of-type(2)",timeKey:"last_noted_at",options:{tags:`noteupdated:${u}+order:note`}},{name:"wiki_page_versions",endpoint:"wiki_page_versions",selector:"tr.user-wiki-page-changes a",timeKey:"updated_at",options:{"search[updater_id]":`${i}`}},{name:"artist_versions",endpoint:"artist_versions",selector:"tr.user-artist-changes a",timeKey:"updated_at",options:{"search[updater_id]":`${i}`}},{name:"artist_commentary_versions",endpoint:"artist_commentary_versions",selector:"tr.user-commentary-changes a",timeKey:"updated_at",options:{"search[updater_id]":`${i}`}},{name:"pool_versions",endpoint:"pool_versions",selector:"tr.user-pool-changes a",timeKey:"updated_at",options:{"search[updater_id]":`${i}`}},{name:"forum_posts",endpoint:"forum_posts",selector:"tr.user-forum-posts a",timeKey:"updated_at",options:{"search[creator_id]":`${i}`}},{name:"approvals",endpoint:"posts",selector:"tr.user-approvals a",timeKey:"updated_at",options:{tags:`approver:${u}`}},{name:"comments_total",endpoint:"comments",selector:"tr.user-comments a:nth-of-type(1)",timeKey:"updated_at",options:{group_by:"comment","search[creator_id]":`${i}`}},{name:"comments_posts",endpoint:"posts",selector:"tr.user-comments a:nth-of-type(2)",timeKey:"updated_at",options:{tags:`commenter:${u}+order:comment_bumped`}},{name:"post_appeals",endpoint:"post_appeals",selector:"tr.user-appeals a",timeKey:"updated_at",options:{"search[creator_id]":`${i}`}},{name:"post_flags",endpoint:"post_flags",selector:"tr.user-flags a",timeKey:"updated_at",options:{"search[creator_id]":`${i}`}},{name:"feedback_positive",endpoint:"user_feedbacks",selector:"tr.user-feedback a:nth-of-type(2)",timeKey:"updated_at",options:{"search[user_id]":`${i}`,"search[category]":"positive"}},{name:"feedback_neutral",endpoint:"user_feedbacks",selector:"tr.user-feedback a:nth-of-type(3)",timeKey:"updated_at",options:{"search[user_id]":`${i}`,"search[category]":"neutral"}},{name:"feedback_negative",endpoint:"user_feedbacks",selector:"tr.user-feedback a:nth-of-type(4)",timeKey:"updated_at",options:{"search[user_id]":`${i}`,"search[category]":"negative"}}];function R(t){let e=new URL(`https://danbooru.donmai.us/${t}.json`);return e.searchParams.set("limit","20"),e.searchParams.set("page","1"),e}function U(){let t=document.querySelector("tr.user-feedback a").cloneNode(!0),e=/positive:(\d+)\s+neutral:(\d+)\s+negative:(\d+)/.exec(t.innerText);if(e===null)return;let s=t.getAttribute("href");t.innerText="all";let n=document.createElement("div");n.append(t),n.insertAdjacentHTML("beforeend",`<a href="${s}&search[category]=positive"> positive:${e[1]}</a>`),n.insertAdjacentHTML("beforeend",`<a href="${s}&search[category]=neutral"> neutral:${e[2]}</a>`),n.insertAdjacentHTML("beforeend",`<a href="${s}&search[category]=negative"> negative:${e[3]}</a>`),document.querySelector("tr.user-feedback a").replaceWith(n)}async function j(t,e,s){let n=c.get(s.name);if(!e&&n!==void 0)return{info:s,values:n.split(b).map(r=>+r)};let a=R(s.endpoint);if(s.options)for(let[r,l]of Object.entries(s.options))a.searchParams.set(r,l.toString());a.searchParams.set("only",s.timeKey);let d=t.length,p=[];for(var o=0;o<d;o++)p.push(0);var m=1;e:for(;;){let r=await fetch(a);if(!r.ok)break;let l=await r.json();if(l.length===0)break;for(let f of l){let _=Date.parse(f[s.timeKey].substring(0,16));for(var y=!1,o=0;o<d;o++)_>=t[o].timestamp&&(p[o]+=1,y=!0);if(!y)break e}if(l.length!=20)break;m+=1,a.searchParams.set("page",`${m}`)}return{info:s,values:p}}function G(){let t=[{className:"user-id",regex:/^User ID$/},{className:"user-join-date",regex:/^Join Date$/},{className:"user-level",regex:/^Level$/},{className:"user-upload-limit",regex:/^Upload Limit$/},{className:"user-uploads",regex:/^Uploads$/},{className:"user-deleted-uploads",regex:/^Deleted Uploads$/},{className:"user-favorites",regex:/^Favorites$/},{className:"user-votes",regex:/^Votes$/},{className:"user-favorite-groups",regex:/^Favorite Groups$/},{className:"user-post-changes",regex:/^Post Changes$/},{className:"user-note-changes",regex:/^Note Changes$/},{className:"user-wiki-page-changes",regex:/^Wiki Page Changes$/},{className:"user-artist-changes",regex:/^Artist Changes$/},{className:"user-commentary-changes",regex:/^Commentary Changes$/},{className:"user-pool-changes",regex:/^Pool Changes$/},{className:"user-forum-posts",regex:/^Forum Posts$/},{className:"user-approvals",regex:/^Approvals$/},{className:"user-comments",regex:/^Comments$/},{className:"user-appeals",regex:/^Appeals$/},{className:"user-flags",regex:/^Flags$/},{className:"user-feedback",regex:/^Feedback$/},{className:"user-saved-searches",regex:/^Saved Searches$/},{className:"user-api-key",regex:/^API Key$/}],e=Array.from(document.querySelectorAll("table.user-statistics tr"));for(let{className:s,regex:n}of t){let a=e.findIndex(d=>n.test(d.firstElementChild.innerText));a!==-1&&(e[a].classList.add(s),e.splice(a,1))}}async function O(){return new Promise((t,e)=>{document.querySelector("#dspc-dialog")||document.body.insertAdjacentHTML("beforeend",C);let s=document.querySelector("#dspc-dialog"),n=document.querySelector("#dspc-clear-data"),a=document.querySelector("#dspc-close-dialog"),d=document.querySelector("#dspc-save-dialog"),p=document.querySelector("#dspc-intervals"),o=document.querySelector("#dspc-intervals-error"),m=document.querySelector("#dspc-hide-select");p.value=c.get("intervals",x),m.value=c.get("hide",N),p.addEventListener("keyup",y=>{let r=p.value.trim().split(/\s*,\s*/);if(r.every(g=>S.test(g)))o.style.display="none",d.disabled=!1;else{o.style.display="block",o.innerText="Invalid interval(s)",d.disabled=!0;return}if(r.length>3&&(o.style.display="block",o.innerText="Max of 3 intervals allowed",d.disabled=!0),!r.map(g=>M.parse(g)).sort().every(g=>g<=E.month)){o.style.display="block",o.innerText="No interval may be longer than 1 month",d.disabled=!0;return}}),n.addEventListener("click",()=>{Danbooru.notice("Clearing danbooru-show-profile-changes stored data"),w("clearing stored values"),c.clear()}),a.addEventListener("click",()=>{s.close(),e("nothing to see here")}),d.addEventListener("click",()=>{s.close(),t({intervals:p.value.trim().split(/\s*,\s*/).join(", "),hide:m.value})}),s.showModal()})}function D(t){let e=(a,d)=>{let p=document.querySelectorAll(a);for(let o of p)o.style.display=d},s=a=>{e(a,"none")},n=a=>{e(a,"inline")};t==="all"?s("span.dspc-info, sup.dspc-positive, sup.dspc-neutral, sup.dspc-negative"):t==="neutral"?(n("span.dspc-info, sup.dspc-positive, sup.dspc-neutral, sup.dspc-negative"),s("sup.dspc-neutral")):t==="none"&&n("span.dspc-info, sup.dspc-positive, sup.dspc-neutral, sup.dspc-negative")}function V(){document.querySelector("a.user")?.insertAdjacentHTML("afterend",A),document.querySelector("#dspc-open-dialog")?.addEventListener("click",t=>{O().then(e=>{e.intervals!==c.get("intervals",x)&&c.clear(),c.set("intervals",e.intervals),c.set("hide",e.hide),D(e.hide)},e=>{})})}function F(){if(i===void 0||u===void 0||u!==document.querySelector("a.user")?.getAttribute("data-user-name"))return;GM_addStyle(P),G(),V(),U();let t=new Date;t.setHours(0),t.setMinutes(0),t.setSeconds(0),t.setMilliseconds(0);let e=t.getTime(),s=t.getFullYear().toString().padStart(4,"0"),n=(t.getMonth()+1).toString().padStart(2,"0"),a=t.getDate().toString().padStart(2,"0"),d=`${s}-${n}-${a}`,o=c.get("date_key")!==d;c.set("date_key",d);let m=c.get("intervals").split(/\s*,\s*/g).map(r=>({name:r,timestamp:e-M.parse(r)+E.day})).sort((r,l)=>l.timestamp-r.timestamp),y=q.map(r=>j(m,o,r));Promise.all(y).then(r=>{for(let l of r){let f=document.querySelector(l.info.selector);if(!f)continue;let _=/(\d+)/.exec(f.innerText);if(_===null)continue;let g=c.get(l.info.name)?.split(b).map(v=>+v),K=+_[1],I=l.values.map((v,h)=>g===void 0||o?K-v:g[h]),B=I.map((v,h)=>H(K-v,`${m[h].name}: ${v}`)),k=document.createElement("span");k.classList.add("dspc-info");let $=[];B.forEach((v,h)=>{if(h>0){let L=document.createElement("sup");L.classList.add($[h-1].className),L.innerText=b,$.push(L)}$.push(v)}),k.append(...$),f.insertAdjacentElement("afterend",k),c.set(l.info.name,I.join(b))}}).then(()=>D(c.get("hide",N)))}F()})();})();
