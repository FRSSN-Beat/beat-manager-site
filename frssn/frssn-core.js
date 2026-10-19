/* =========================================================
   FRSSN CORE // ROUTING + JSON DB ENGINE
   Data source: frssn-db.json
   Desktop / Android HTML contains UI only.
   Build: 2026-10-19
========================================================= */
(() => {
  "use strict";

  const CORE_SCRIPT_URL = (() => {
    try { return new URL(document.currentScript?.src || "frssn-core.js", location.href); }
    catch (_) { return new URL("frssn-core.js", location.href); }
  })();

  function clone(value){
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function currentFile(){
    return location.pathname.split("/").pop() || "index.html";
  }

  function queryView(){
    const value = new URLSearchParams(location.search).get("view");
    if(value === "android" || value === "mobile") return "android";
    if(value === "desktop") return "desktop";
    return "auto";
  }

  function isMobileDevice(){
    const forced = queryView();
    if(forced === "android") return true;
    if(forced === "desktop") return false;

    if(navigator.userAgentData && typeof navigator.userAgentData.mobile === "boolean"){
      if(navigator.userAgentData.mobile) return true;
    }
    const ua = navigator.userAgent || "";
    if(/Android|iPhone|iPod|Mobile/i.test(ua)) return true;
    if(/Macintosh/i.test(ua) && (navigator.maxTouchPoints || 0) > 1) return true;
    return false;
  }

  const PAGE_PAIRS = {
    "tracks.html":{desktop:"tracks.html",android:"tracks_android.html"},
    "tracks_android.html":{desktop:"tracks.html",android:"tracks_android.html"},
    "track.html":{desktop:"track.html",android:"track_android.html"},
    "track_android.html":{desktop:"track.html",android:"track_android.html"}
  };

  function routeCurrentPage(){
    const params = new URLSearchParams(location.search);
    if(params.get("__frssn_preview_child") === "1" || params.get("__frssn_single_preview_child") === "1") return false;

    const pair = PAGE_PAIRS[currentFile()];
    if(!pair) return false;
    const target = isMobileDevice() ? pair.android : pair.desktop;
    if(target === currentFile()) return false;

    const url = new URL(location.href);
    url.pathname = url.pathname.replace(/[^/]+$/, target);
    location.replace(url.href);
    return true;
  }

  /* Route before fetching the DB / starting heavy player code. */
  if(routeCurrentPage()) return;

  const state = {
    db:null,
    defaults:{},
    defaultStatus:[
      {icon:"dot",label:"FIRST LICENSE",value:"AVAILABLE"},
      {icon:"shield",label:"ORIGINAL SOURCE",value:""},
      {icon:"crown",label:"EXCLUSIVE",value:"AVAILABLE"}
    ],
    defaultStructure:[],
    tracks:[],
    byId:new Map()
  };

  function databaseUrl(){
    return new URL("frssn-db.json", CORE_SCRIPT_URL).href;
  }

  async function loadDatabase(){
    const response = await fetch(databaseUrl(), {cache:"no-store", credentials:"same-origin"});
    if(!response.ok) throw new Error(`frssn-db.json HTTP ${response.status}`);
    const db = await response.json();
    if(!db || !Array.isArray(db.tracks)) throw new Error("frssn-db.json: tracks[] is missing");
    return db;
  }

  function normalizedTrack(raw,index){
    const defaults = state.defaults || {};
    const base = {
      id:`track-${String(index+1).padStart(2,"0")}`,
      signal:String(index+1).padStart(3,"0"),
      title:`TRACK ${String(index+1).padStart(2,"0")}`,
      artist:defaults.artist || "FRSSN",
      typeCode:"",
      audio:"",
      storeCover:"",
      singleCover:"",
      label:"",
      bpm:"—",
      key:"—",
      moods:[],
      sections:clone(state.defaultStructure),
      release:defaults.release || "",
      license:defaults.license || "MP3",
      status:defaults.status || "AVAILABLE",
      file:defaults.file || "CLEAN",
      commercialStatus:clone(state.defaultStatus),
      prices:clone(defaults.prices || {mp3:"$40",wav:"$80",stems:"$150"}),
      checkout:clone(defaults.checkout || {mp3:"",wav:"",stems:""}),
      showcase:false,
      sourceTrackId:null
    };
    const track = Object.assign(base, clone(raw || {}));
    track.prices = Object.assign({}, clone(defaults.prices || {}), clone(raw?.prices || {}));
    track.checkout = Object.assign({}, clone(defaults.checkout || {}), clone(raw?.checkout || {}));
    track.commercialStatus = clone(raw?.commercialStatus || state.defaultStatus);
    track.sections = clone(raw?.sections || state.defaultStructure);
    track.moods = clone(raw?.moods || []);
    if(!track.singleCover) track.singleCover = track.storeCover;
    if(!track.label) track.label = track.singleCover || track.storeCover;
    if(!track.sourceTrackId) track.sourceTrackId = track.id;
    return track;
  }

  function applyDatabase(db){
    state.db = clone(db);
    state.defaults = clone(db.defaults || {});
    state.defaultStatus = clone(db.defaults?.commercialStatus || state.defaultStatus);
    state.defaultStructure = clone(db.structurePresets?.A || []);
    state.tracks = db.tracks.map(normalizedTrack);
    state.byId = new Map(state.tracks.map(track => [track.id,track]));

    api.version = db.version || "2026-10-19-json-db";
    api.schemaVersion = db.schemaVersion || 1;
    api.db = clone(db);
    api.defaultTrackId = db.defaultTrackId || state.tracks[0]?.id || "old";
    api.tracks = clone(state.tracks);
    api.items = clone(state.tracks);
    api.showcaseNames = state.tracks.map(track => track.title);
    api.structures = clone(db.structurePresets || {});
  }

  function getTrack(id){
    const track = state.byId.get(String(id || ""));
    return track ? clone(track) : null;
  }

  function metaFor(id,index=0){
    const real = getTrack(id);
    if(real) return real;
    const i = Number.isFinite(Number(index)) ? Number(index) : 0;
    return normalizedTrack({id:String(id || `track-${i+1}`)},i);
  }

  function trackHref(id,{mobile=isMobileDevice(),canonical=false}={}){
    const page = canonical ? "track.html" : (mobile ? "track_android.html" : "track.html");
    return `${page}?track=${encodeURIComponent(id)}`;
  }

  function trackUrl(id,options={}){
    return new URL(trackHref(id,options),location.href).href;
  }

  function storeHref({mobile=isMobileDevice(),canonical=false}={}){
    return canonical ? "tracks.html" : (mobile ? "tracks_android.html" : "tracks.html");
  }

  function iconSvg(icon){
    if(icon === "shield") return '<svg viewBox="0 0 24 24"><path d="M12 3 19 6v5c0 4.6-2.8 8.1-7 10-4.2-1.9-7-5.4-7-10V6l7-3Z"/><path d="m9.2 12 1.8 1.8 3.9-4"/></svg>';
    if(icon === "crown") return '<svg viewBox="0 0 24 24"><path d="m4 8 4 4 4-6 4 6 4-4-2 9H6L4 8Z"/><path d="M6 20h12"/></svg>';
    return "";
  }

  function statusRailHtml(items){
    return (items || state.defaultStatus).map(item => {
      const icon = item.icon === "dot"
        ? '<span class="statusChipIcon dot"></span>'
        : `<span class="statusChipIcon">${iconSvg(item.icon)}</span>`;
      const value = item.value ? `<span class="statusValue">// ${item.value}</span>` : "";
      return `<span class="statusChip">${icon}<span>${item.label}</span>${value}</span>`;
    }).join("");
  }

  function structureHtml(sections){
    return (sections || state.defaultStructure).map((section,index) => {
      const width = Math.max(.02, Number(section.end)-Number(section.start));
      const cls = index === 0 ? "structureSegment is-current" : "structureSegment";
      return `<button class="${cls}" type="button" data-section-start="${Number(section.start)}" style="flex:0 0 ${Math.round(width*10000)/100}%">${section.name}</button>`;
    }).join("");
  }

  function setCheckout(anchor,tier,track){
    if(!anchor) return;
    anchor.dataset.licenseTier = tier;
    const price = anchor.querySelector(".tierPrice");
    if(price) price.textContent = track.prices?.[tier] || "—";
    const url = track.checkout?.[tier] || "";
    if(url){
      anchor.href = url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.removeAttribute("data-placeholder-checkout");
    }else{
      anchor.href = "#";
      anchor.removeAttribute("target");
      anchor.removeAttribute("rel");
      anchor.dataset.placeholderCheckout = "1";
    }
  }

  function patchStoreCard(card,track,mobile){
    if(!card || !track) return;
    card.dataset.trackId = track.id;
    card.dataset.audio = track.audio;

    const titleLink = card.querySelector(".trackTitleLink");
    if(titleLink){ titleLink.textContent = track.title; titleLink.href = trackHref(track.id,{mobile}); }
    const typeCode = card.querySelector(".typeCode");
    if(typeCode) typeCode.textContent = track.typeCode;

    const label = card.querySelector(".recordLabel img");
    if(label){ label.src = track.label || track.storeCover; label.alt = track.title; }
    const cover = card.querySelector(".sleeve .cover");
    if(cover){ cover.src = track.storeCover; cover.alt = `${track.title} cover`; }

    const rail = card.querySelector(".commercialStatusRail");
    if(rail) rail.innerHTML = statusRailHtml(track.commercialStatus);

    const structure = card.querySelector(".trackStructure");
    if(structure) structure.innerHTML = structureHtml(track.sections);

    [...card.querySelectorAll(".coreProperty")].forEach(prop => {
      const labelText = prop.querySelector(".coreLabel")?.textContent?.trim().toUpperCase();
      const value = prop.querySelector(".coreValue");
      if(!value) return;
      if(labelText === "BPM") value.textContent = track.bpm;
      if(labelText === "KEY") value.textContent = track.key;
    });

    const moodBlock = card.querySelector(".moodBlock");
    if(moodBlock) moodBlock.innerHTML = (track.moods || []).slice(0,3).map(tag=>`<span class="moodTag">${tag}</span>`).join("");

    card.querySelectorAll(".purchaseOption").forEach(anchor => {
      const tier = (anchor.dataset.licenseTier || anchor.querySelector("span")?.textContent || "").trim().toLowerCase();
      if(["mp3","wav","stems"].includes(tier)) setCheckout(anchor,tier,track);
    });
  }

  function hydrateStore(doc=document,{mobile=isMobileDevice()}={}){
    const list = doc.querySelector(".trackList");
    if(!list || !state.tracks.length) return;
    let cards = [...list.querySelectorAll(":scope > .track")];
    if(!cards.length) return;

    const template = cards[cards.length-1];
    state.tracks.forEach(track => {
      let card = list.querySelector(`:scope > .track[data-track-id="${CSS.escape(track.id)}"]`);
      if(!card){ card = template.cloneNode(true); list.appendChild(card); }
      patchStoreCard(card,track,mobile);
    });

    [...list.querySelectorAll(":scope > .track")].forEach(card => {
      if(!state.byId.has(card.dataset.trackId)) card.remove();
    });

    const count = state.tracks.length;
    const micro = doc.getElementById("microstatus");
    if(micro) micro.textContent = `Connection stable // ${String(count).padStart(2,"0")} signals detected`;
    const sectionCount = doc.querySelector(".sectionTitle span");
    if(sectionCount) sectionCount.textContent = `${String(count).padStart(2,"0")} SIGNAL${count===1?"":"S"} // DIRECT LICENSE CHANNEL`;
  }

  function patchSingleCard(card,track,mobile){
    if(!card || !track) return;
    card.dataset.trackId = track.id;
    card.dataset.audio = track.audio;

    const titleLink = card.querySelector(".trackTitleLink");
    if(titleLink){ titleLink.textContent = track.title; titleLink.href = trackHref(track.id,{mobile}); }
    const typeCode = card.querySelector(".typeCode");
    if(typeCode) typeCode.textContent = track.typeCode;
    const artist = card.querySelector(".artist");
    if(artist) artist.textContent = track.artist || "FRSSN";

    const label = card.querySelector(".recordLabel img");
    if(label){ label.src = track.label || track.singleCover || track.storeCover; label.alt = track.title; }
    const cover = card.querySelector(".sleeve .cover");
    if(cover){ cover.src = track.singleCover || track.storeCover; cover.alt = `${track.title} cover`; }

    const signal = card.querySelector(".meta span");
    if(signal) signal.textContent = `Signal // ${track.signal}`;

    card.querySelectorAll(".purchaseOption").forEach(anchor => {
      const tier = (anchor.dataset.licenseTier || anchor.querySelector(".purchaseName")?.textContent || anchor.querySelector("span")?.textContent || "").trim().toLowerCase();
      if(["mp3","wav","stems"].includes(tier)) setCheckout(anchor,tier,track);
    });
  }

  function hydrateSingle(doc=document,{mobile=isMobileDevice()}={}){
    const list = doc.querySelector(".detailSourceTrackList");
    if(!list || !state.tracks.length) return;
    let cards = [...list.querySelectorAll(":scope > .track")];
    if(!cards.length) return;
    const template = cards[cards.length-1];

    state.tracks.forEach(track => {
      let card = list.querySelector(`:scope > .track[data-track-id="${CSS.escape(track.id)}"]`);
      if(!card){ card = template.cloneNode(true); list.appendChild(card); }
      patchSingleCard(card,track,mobile);
    });
    [...list.querySelectorAll(":scope > .track")].forEach(card => {
      if(!state.byId.has(card.dataset.trackId)) card.remove();
    });
  }

  function patchIndexLinks(doc=document){
    const mobile = isMobileDevice();
    doc.querySelectorAll('a[href="tracks.html"],a[href="tracks_android.html"]').forEach(anchor=>{
      anchor.href = storeHref({mobile});
    });
  }

  const api = {
    version:"loading",
    schemaVersion:1,
    db:null,
    defaultTrackId:"old",
    tracks:[],
    items:[],
    showcaseNames:[],
    structures:{},
    isMobileDevice,
    getTrack,
    metaFor,
    trackHref,
    trackUrl,
    canonicalTrackHref:id=>trackHref(id,{canonical:true}),
    canonicalTrackUrl:id=>trackUrl(id,{canonical:true}),
    storeHref,
    hydrateStore,
    hydrateSingle,
    patchIndexLinks,
    ready:null
  };

  window.FRSSN = api;

  api.ready = loadDatabase()
    .then(db => {
      applyDatabase(db);
      window.dispatchEvent(new CustomEvent("frssn:db-ready",{detail:{version:api.version,count:state.tracks.length}}));
      return api;
    })
    .catch(error => {
      console.error("FRSSN DB LOAD FAILED", error);
      api.version = "db-load-failed";
      /* Keep the two static fallback cards functional if JSON is unavailable. */
      return api;
    });

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",()=>patchIndexLinks(document),{once:true});
  else patchIndexLinks(document);
})();
