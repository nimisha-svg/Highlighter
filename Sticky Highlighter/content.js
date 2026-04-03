(()=>{console.log("[Sticky Highlighter] Content script initialized");var g=null,d=null,i=null,m=!0,S=()=>{if(!document.getElementById("sticky-hl-styles")){let e=document.createElement("style");e.id="sticky-hl-styles",e.textContent=`
      body.sticky-hl-disabled .sticky-hl-mark {
        background-color: transparent !important;
        color: inherit !important;
      }
    `,document.head.appendChild(e)}};S();var E=e=>{m=e,e?document.body.classList.remove("sticky-hl-disabled"):(document.body.classList.add("sticky-hl-disabled"),h())},w=[{id:"yellow",hex:"#d4cb8a"},{id:"green",hex:"#9ebf9f"},{id:"pink",hex:"#d4a5b4"},{id:"blue",hex:"#95a8b8"}],L=e=>{if(e.tagName.toLowerCase()==="body")return"body";if(e.id)return`#${e.id}`;let o=[],t=e;for(;t&&t.tagName.toLowerCase()!=="body";){let n=t.tagName.toLowerCase();if(t.id){n=`#${t.id}`,o.unshift(n);break}else{let l=t,r=1;for(;l.previousElementSibling;)l=l.previousElementSibling,l.tagName.toLowerCase()===n&&r++;if(r!==1&&(n+=`:nth-of-type(${r})`),t.className&&typeof t.className=="string"){let s=t.className.split(/\s+/).filter(c=>c&&!c.includes("sticky-hl")).join(".");s&&(n+=`.${s}`)}}o.unshift(n),t=t.parentElement}return o.join(" > ")},v=()=>{i||(i=document.createElement("div"),i.id="sticky-highlighter-toolbar",i.style.cssText=`
    position: absolute;
    z-index: 2147483647;
    background: #1e293b;
    border-radius: 8px;
    padding: 6px;
    display: flex;
    gap: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border: 1px solid #334155;
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.1s;
  `,w.forEach(({id:e,hex:o})=>{let t=document.createElement("button");t.style.cssText=`
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid transparent;
      background-color: ${o};
      cursor: pointer;
      transition: transform 0.1s;
    `,t.onmouseover=()=>t.style.transform="scale(1.1)",t.onmouseout=()=>t.style.transform="scale(1)",t.onclick=n=>{n.stopPropagation(),n.preventDefault(),k(e),h()},i==null||i.appendChild(t)}),document.body.appendChild(i))},N=e=>{i||v();let o=window.scrollY+e.top-45,t=window.scrollX+e.left+e.width/2-60;i.style.top=`${Math.max(0,o)}px`,i.style.left=`${Math.max(0,t)}px`,i.style.visibility="visible",i.style.opacity="1"},h=()=>{i&&(i.style.opacity="0",setTimeout(()=>{i&&(i.style.visibility="hidden")},100))};document.addEventListener("mouseup",e=>{e.target.closest("#sticky-highlighter-toolbar")||m&&setTimeout(()=>{let o=window.getSelection(),t=o==null?void 0:o.toString().trim();if(o&&t&&t.length>0){g=o,d=o.getRangeAt(0);let n=d.getBoundingClientRect();N(n)}else h()},10)});document.addEventListener("mousedown",e=>{e.target.closest("#sticky-highlighter-toolbar")||h()});var k=e=>{var c;if(!m||!d||!g)return;let o=g.toString().trim(),t=d.commonAncestorContainer,n=t.nodeType===3?t.parentElement:t;if(!n)return;let l=L(n),s={id:`hl-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,text:o,color:e,containerSelector:l,createdAt:Date.now()};R(s),H(s,!0),(c=window.getSelection())==null||c.removeAllRanges()},H=(e,o=!1)=>{var p,y;let t=((p=w.find(a=>a.id===e.color))==null?void 0:p.hex)||"#fef08a",n=document.querySelector(e.containerSelector);if(!n)return;let l=document.createTreeWalker(n,NodeFilter.SHOW_TEXT,null),r,s=[];for(;r=l.nextNode();)s.push(r);let c=new RegExp(`(${$(e.text)})`,"g");for(let a of s)if(a.nodeValue&&a.nodeValue.includes(e.text)&&!((y=a.parentElement)!=null&&y.classList.contains("sticky-hl-mark"))){let f=a.parentElement;if(f){let C=a.nodeValue.replace(e.text,`<mark class="sticky-hl-mark" data-hl-id="${e.id}" style="background-color: ${t}; border-radius: 3px; padding: 0 2px; color: inherit;">${e.text}</mark>`),b=document.createElement("span");b.innerHTML=C,f.replaceChild(b,a);break}}},$=e=>e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),T=()=>window.location.origin+window.location.pathname+window.location.search,R=e=>{let o=T();chrome.storage.local.get(["highlights"],t=>{let n=t.highlights||{};n[o]||(n[o]=[]),n[o].push(e),chrome.storage.local.set({highlights:n})})},u=()=>{let e=T();chrome.storage.local.get(["highlights","isEnabled"],o=>{o.isEnabled!==void 0&&E(o.isEnabled),o.highlights&&o.highlights[e]&&o.highlights[e].forEach(n=>{try{H(n)}catch(l){console.warn("[Sticky Highlighter] Failed to restore a highlight",l)}})})};chrome.storage.onChanged.addListener((e,o)=>{o==="local"&&e.isEnabled&&E(e.isEnabled.newValue)});chrome.runtime.onMessage.addListener((e,o,t)=>{if(e.type==="CLEAR_ALL")document.querySelectorAll(".sticky-hl-mark").forEach(n=>{var r;let l=document.createTextNode(n.textContent||"");(r=n.parentNode)==null||r.replaceChild(l,n)});else if(e.type==="REMOVE_HIGHLIGHT"){let n=e.payload.id;document.querySelectorAll(`.sticky-hl-mark[data-hl-id="${n}"]`).forEach(l=>{var s;let r=document.createTextNode(l.textContent||"");(s=l.parentNode)==null||s.replaceChild(r,l)})}else e.type==="HIGHLIGHT_CONTEXT_MENU"&&k(e.payload.color)});document.readyState==="loading"?document.addEventListener("DOMContentLoaded",u):u();var x,M=new MutationObserver(e=>{let o=!1;for(let t of e)if(t.addedNodes.length>0){o=!0;break}o&&(clearTimeout(x),x=setTimeout(u,1e3))});M.observe(document.body,{childList:!0,subtree:!0});})();
