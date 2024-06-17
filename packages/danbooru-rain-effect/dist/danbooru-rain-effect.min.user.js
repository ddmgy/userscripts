// ==UserScript==
// @name        danbooru-rain-effect (minified)
// @version     0.1.0
// @description Add animated rain effect over posts on Danbooru
// @author      ddmgy
// @namespace   ddmgy
// @match       *://*.donmai.us/posts/*
// @grant       GM_addStyle
// @run-at      document-body
// @downloadURL https://github.com/ddmgy/userscripts/blob/master/danbooru-rain-effect (minified)/dist/danbooru-rain-effect.min.user.js?raw=true
// @updateURL   https://github.com/ddmgy/userscripts/blob/master/danbooru-rain-effect (minified)/dist/danbooru-rain-effect.min.user.js?raw=true
// ==/UserScript==

"use strict";(()=>{var o=`
.rain { position: absolute; overflow: hidden; left: 0; width: 100%; height: 100%; }
.rain.layer-1 { z-index: 4; opacity: 0.4; }
.rain.layer-2 { z-index: 3; opacity: 1; }
.rain.layer-3 { z-index: 2; opacity: 0.8; }
.rain.layer-4 { z-index: 1; opacity: 0.5; }
.drop { position: absolute; bottom: 100%; height: 200px; pointer-events: none; filter: blur(1px); animation: drop 1s linear infinite; }
@keyframes drop { 0% { transform: translateY(0vh); } 75% { transform: translateY(90vh); } 100% { transform: translateY(90vh); } }
.layer-1 .drop { width: 7px; }
.layer-2 .drop { width: 3px; }
.layer-3 .drop { width: 3px; }
.layer-4 .drop { width: 1px; }
.stem { width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.25)); animation: stem 1s linear infinite; }
@keyframes stem { 0% { opacity: 1; } 65% { opacity: 1; } 75% { opacity: 0; } 100% { opacity: 0; } }
`;function d(e,t,i){let n=`${i/100}s`,a=`${.2+i/100}s`;return`<div class="drop" style="left: ${e}%; bottom; ${t}%; animation-delay: ${n}; animation-duration: ${a};"><div class="stem" style="animation-delay: ${n}; animation-duration: ${a};"></div></div>`}function l(e){var t,i=[e[0].weight];for(t=1;t<e.length;t++)i[t]=e[t].weight+i[t-1];let n=Math.random()*i[i.length-1];for(t=0;t<i.length&&!(i[t]>n);t++);return e[t].item}function r(e,t){return Math.floor(Math.random()*(t-e+1)+e)}function m(){GM_addStyle(o);for(var e=4;e>0;e--)$("section.image-container").prepend(`<div class="rain layer-${e}"></div>`);for(var t=0;t<100;){let i=r(30,55),n=r(3,1);t+=n;let a=l([{item:1,weight:5},{item:2,weight:40},{item:3,weight:30},{item:4,weight:25}]);$(`.layer-${a}`).append(d(a%2==0?t:100-t,100+n+n-1,i))}}$(m);})();
