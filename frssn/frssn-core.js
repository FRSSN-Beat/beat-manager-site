/* =========================================================
   FRSSN CORE // ROUTING + SHARED CATALOG
   One source of truth for desktop and Android storefronts.
   Build: 2026-10-19
========================================================= */
(() => {
  "use strict";

  const STRUCTURE_A = [
    {name:"INTRO",start:0.00,end:0.11},
    {name:"HOOK",start:0.11,end:0.27},
    {name:"VERSE",start:0.27,end:0.52},
    {name:"HOOK",start:0.52,end:0.68},
    {name:"VERSE",start:0.68,end:0.91},
    {name:"OUTRO",start:0.91,end:1.00}
  ];
  const STRUCTURE_B = [
    {name:"INTRO",start:0.00,end:0.09},
    {name:"VERSE",start:0.09,end:0.33},
    {name:"HOOK",start:0.33,end:0.50},
    {name:"VERSE",start:0.50,end:0.74},
    {name:"BRIDGE",start:0.74,end:0.84},
    {name:"HOOK",start:0.84,end:1.00}
  ];

  const DEFAULT_STATUS = [
    {icon:"dot",label:"FIRST LICENSE",value:"AVAILABLE"},
    {icon:"shield",label:"ORIGINAL SOURCE",value:""},
    {icon:"crown",label:"EXCLUSIVE",value:"AVAILABLE"}
  ];

  const tracks = [
    {
      id:"old",
      signal:"001",
      title:"OLD",
      artist:"FRSSN",
      typeCode:"TRAVIS SCOTT × KANYE WEST",
      audio:"old.mp3",
      storeCover:"old-cover.png",
      singleCover:"old-cover-sold.png",
      label:"old-label.png",
      bpm:"142",
      key:"F# MIN",
      moods:["DARK","CINEMATIC","ATMOSPHERIC"],
      sections:STRUCTURE_A,
      release:"16 OCT 2026",
      license:"MP3",
      status:"AVAILABLE",
      file:"CLEAN",
      commercialStatus:DEFAULT_STATUS,
      prices:{mp3:"$40",wav:"$80",stems:"$150"},
      checkout:{mp3:"https://traktrain.com/cart-single-track/1679177",wav:"",stems:""}
    },
    {
      id:"track-02",
      signal:"002",
      title:"TRACK 02",
      artist:"FRSSN",
      typeCode:"TRAVIS SCOTT × DON TOLIVER",
      audio:"track-02.mp3",
      storeCover:"track-02-cover.png",
      singleCover:"track-02-cover.png",
      label:"track-02-cover.png",
      bpm:"136",
      key:"D MIN",
      moods:["NOCTURNAL","TENSE","SPACIOUS"],
      sections:STRUCTURE_B,
      release:"16 OCT 2026",
      license:"MP3",
      status:"AVAILABLE",
      file:"CLEAN",
      commercialStatus:DEFAULT_STATUS,
      prices:{mp3:"$40",wav:"$80",stems:"$150"},
      checkout:{mp3:"",wav:"",stems:""}
    }
  ];

  const showcaseNames = [
    "OLD","TRACK 02","STATIC","VEIL","ECHO","NOCTURNE","NULL",
    "AFTERIMAGE","GHOSTLINE","BLACKOUT","ORBIT","PHASE","DUST","SUBLEVEL",
    "MIRROR","CONTACT","VOID","RECEIVER","COLD SIGNAL","NIGHT NODE","MEMORY",
    "TRACE","DEAD AIR","HORIZON","VECTOR","SILENT ROOM","FREQUENCY","LAST LIGHT"
  ];

  const mockTypeCodes = [
    "TRAVIS SCOTT × DON TOLIVER",
    "KANYE WEST × TRAVIS SCOTT",
    "FUTURE × METRO BOOMIN",
    "PLAYBOI CARTI × TRAVIS SCOTT",
    "DON TOLIVER × TRAVIS SCOTT",
    "THE WEEKND × TRAVIS SCOTT",
    "LIL WAYNE × DRAKE"
  ];
  const mockBpm = [142,136,148,132,140,128,145];
  const mockKey = ["F# MIN","D MIN","C MIN","A MIN","G MIN","E MIN","C# MIN"];
  const mockMoods = [
    ["DARK","CINEMATIC","ATMOSPHERIC"],
    ["NOCTURNAL","TENSE","SPACIOUS"],
    ["COLD","MYSTERIOUS","HEAVY"],
    ["FLOATING","DARK","EMOTIONAL"],
    ["RAW","HYPNOTIC","MINIMAL"]
  ];

  const byId = new Map(tracks.map(track => [track.id, track]));
  const clone = value => {
    if (value == null) return value;
    return JSON.parse(JSON.stringify(value));
  };

  function getTrack(id){
    const track = byId.get(String(id || ""));
    return track ? clone(track) : null;
  }

  function metaFor(id,index=0){
    const real = getTrack(id);
    if(real) return real;
    const i = Number.isFinite(Number(index)) ? Number(index) : 0;
    return {
      signal:String(i+1).padStart(3,"0"),
      typeCode:mockTypeCodes[i%mockTypeCodes.length],
      bpm:String(mockBpm[i%mockBpm.length]),
      key:mockKey[i%mockKey.length],
      moods:clone(mockMoods[i%mockMoods.length]),
      sections:clone(i%2 ? STRUCTURE_B : STRUCTURE_A),
      release:"16 OCT 2026",
      license:"MP3",
      status:"AVAILABLE",
      file:"CLEAN",
      commercialStatus:clone(DEFAULT_STATUS),
      prices:{mp3:"$40",wav:"$80",stems:"$150"},
      checkout:{mp3:"",wav:"",stems:""}
    };
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
    /* iPadOS may report itself as Macintosh. */
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
    /* Never interfere with the internal 432×768 preview iframe. */
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
    return (items || DEFAULT_STATUS).map(item => {
      const icon = item.icon === "dot"
        ? '<span class="statusChipIcon dot"></span>'
        : `<span class="statusChipIcon">${iconSvg(item.icon)}</span>`;
      const value = item.value ? `<span class="statusValue">// ${item.value}</span>` : "";
      return `<span class="statusChip">${icon}<span>${item.label}</span>${value}</span>`;
    }).join("");
  }

  function structureHtml(sections){
    return (sections || STRUCTURE_A).map((section,index) => {
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
    if(titleLink){
      titleLink.textContent = track.title;
      titleLink.href = trackHref(track.id,{mobile});
    }
    const typeCode = card.querySelector(".typeCode");
    if(typeCode) typeCode.textContent = track.typeCode;

    const label = card.querySelector(".recordLabel img");
    if(label){ label.src = track.storeCover || track.label; label.alt = track.title; }
    const cover = card.querySelector(".sleeve .cover");
    if(cover){ cover.src = track.storeCover; cover.alt = `${track.title} cover`; }

    const rail = card.querySelector(".commercialStatusRail");
    if(rail) rail.innerHTML = statusRailHtml(track.commercialStatus);

    const structure = card.querySelector(".trackStructure");
    if(structure) structure.innerHTML = structureHtml(track.sections);

    const properties = [...card.querySelectorAll(".coreProperty")];
    properties.forEach(prop => {
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
    if(!list) return;
    let cards = [...list.querySelectorAll(":scope > .track")];
    if(!cards.length) return;

    const template = cards[cards.length-1];
    tracks.forEach(track => {
      let card = list.querySelector(`:scope > .track[data-track-id="${CSS.escape(track.id)}"]`);
      if(!card){
        card = template.cloneNode(true);
        list.appendChild(card);
      }
      patchStoreCard(card,track,mobile);
    });

    /* The shared catalog is authoritative for the real store list. */
    [...list.querySelectorAll(":scope > .track")].forEach(card => {
      if(!byId.has(card.dataset.trackId)) card.remove();
    });

    const count = tracks.length;
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
    if(titleLink){
      titleLink.textContent = track.title;
      titleLink.href = trackHref(track.id,{mobile});
    }
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
    if(!list) return;
    let cards = [...list.querySelectorAll(":scope > .track")];
    if(!cards.length) return;
    const template = cards[cards.length-1];

    tracks.forEach(track => {
      let card = list.querySelector(`:scope > .track[data-track-id="${CSS.escape(track.id)}"]`);
      if(!card){
        card = template.cloneNode(true);
        list.appendChild(card);
      }
      patchSingleCard(card,track,mobile);
    });
    [...list.querySelectorAll(":scope > .track")].forEach(card => {
      if(!byId.has(card.dataset.trackId)) card.remove();
    });
  }

  function patchIndexLinks(doc=document){
    const mobile = isMobileDevice();
    doc.querySelectorAll('a[href="tracks.html"],a[href="tracks_android.html"]').forEach(anchor=>{
      anchor.href = storeHref({mobile});
    });
  }

  const api = {
    version:"2026-10-19-sync-1",
    tracks:clone(tracks),
    showcaseNames:showcaseNames.slice(),
    mockTypeCodes:mockTypeCodes.slice(),
    mockBpm:mockBpm.slice(),
    mockKey:mockKey.slice(),
    mockMoods:clone(mockMoods),
    structures:{A:clone(STRUCTURE_A),B:clone(STRUCTURE_B)},
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
    patchIndexLinks
  };

  window.FRSSN = api;

  /* Route before heavy player initialization. */
  if(routeCurrentPage()) return;
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",()=>patchIndexLinks(document),{once:true});
  else patchIndexLinks(document);
})();
