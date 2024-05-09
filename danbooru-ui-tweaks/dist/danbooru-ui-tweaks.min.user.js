// ==UserScript==
// @name        danbooru-ui-tweaks
// @version     0.1.0
// @description Tweaks to the Danbooru interface
// @author      ddmgy
// @namespace   ddmgy
// @match       *://*.donmai.us/posts/*
// @exclude     /^https?://\w+\.donmai\.us/posts/.*\.(xml|json|atom)(\?|$)/
// @grant       none
// @downloadURL https://github.com/ddmgy/userscripts/blob/master/danbooru-ui-tweaks/dist/danbooru-ui-tweaks.min.user.js?raw=true
// @updateURL   https://github.com/ddmgy/userscripts/blob/master/danbooru-ui-tweaks/dist/danbooru-ui-tweaks.min.user.js?raw=true
// ==/UserScript==

"use strict";(()=>{var i=Object.defineProperty;var l=Object.getOwnPropertyDescriptor;var c=Object.getOwnPropertyNames;var d=Object.prototype.hasOwnProperty;var p=(e,t)=>()=>(e&&(t=e(e=0)),t);var h=(e,t)=>{for(var a in t)i(e,a,{get:t[a],enumerable:!0})},u=(e,t,a,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let r of c(t))!d.call(e,r)&&r!==a&&i(e,r,{get:()=>t[r],enumerable:!(o=l(t,r))||o.enumerable});return e};var S=e=>u(i({},"__esModule",{value:!0}),e);var s={};h(s,{default:()=>n});var n,g=p(()=>{"use strict";n=class e{static initialize(){let t=[{headerSelector:"artist",tagSelector:"1"},{headerSelector:"copyright",tagSelector:"3"},{headerSelector:"character",tagSelector:"4"},{headerSelector:"general",tagSelector:"0"},{headerSelector:"meta",tagSelector:"5"}];for(let a of t)e.addTagCount(a)}static addTagCount({headerSelector:t,tagSelector:a}){let o=$(`h3.${t}-tag-list`);if(o.length===0){console.log(`[danbooru-ui-tweaks] h3.${t}-tag-list does not exist, skipping`);return}$(o).append($("<span></span>",{class:"post-count",text:$(`.tag-type-${a}`).length,style:"font-weight: normal"}))}}});var T=(g(),S(s));$(T.initialize);})();
