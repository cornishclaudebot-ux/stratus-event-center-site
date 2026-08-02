/* ============================================================
   STRATUS EVENT CENTER — shared app logic + data
   (minimal chrome: logo + Menu pill, fullscreen overlay,
    pill buttons, card + list event renderers)
   ============================================================ */
const CONFIG = {
  // --- TICKETS (REAL — Bandsintown routes to official sellers) ---
  tickets: "https://www.bandsintown.com/v/10168441-club-stratus",
  bit: "https://www.bandsintown.com/v/10168441-club-stratus",
  ticketon: "https://ticketon.com/en/cities/phoenix",
  tickeri: "https://www.tickeri.com/venues/599fa07edbddfb5261ea6c7d",
  tm: "https://www.ticketmaster.com/stratus-event-center-boletos-phoenix/venue/205291",
  stubhub: "https://www.stubhub.com/stratus-event-center-tickets/venue/102133143/",
  shazam: "https://www.shazam.com/en-us/event/venue/IB37537E7AB0E9D1E",
  // --- CONTACT (REAL) ---
  phone: "(602) 908-7817",
  phoneRaw: "+16029087817",
  address: "4344 W Indian School Rd, Ste 32, Phoenix, AZ 85031",
  emails: {
    corporate: "Stratuseventcenteraz@gmail.com",
    concert:   "Stratuseventcenteraz@gmail.com",
    shows:     "Stratuseventcenteraz@gmail.com",
    vip:       "Stratuseventcenteraz@gmail.com",
    default:   "Stratuseventcenteraz@gmail.com"
  },
  // --- SOCIALS / REVIEWS (REAL) ---
  ig: "https://www.instagram.com/stratuseventcenteraz/",
  fb: "https://www.facebook.com/StratusEventCenter/",
  yelp: "https://www.yelp.com/biz/stratus-event-center-phoenix",
  // --- PARTNER (REAL — next door, Suite 33) ---
  partner: "https://www.elherraderophoenix.com/",
  partnerPhone: "(623) 247-9144",
  partnerPhoneRaw: "+16232479144"
};
CONFIG.mapGoogle = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(CONFIG.address);
CONFIG.mapApple  = "https://maps.apple.com/?q=" + encodeURIComponent(CONFIG.address);

/* ---- Upcoming events.
   LIVE source: events.json, refreshed daily from the Bandsintown venue
   calendar by scripts/fetch_events.py (launchd job com.stratus.events).
   This baked-in array is only the offline fallback if events.json is
   missing; keep it roughly current but don't hand-edit dates weekly. ---- */
const EVENTS = [
  {date:"2026-07-21", time:"7:00 PM", title:"Lefty Gunplay", tag:"Hip-Hop", flyer:"assets/flyers/2026-07-21-4465daec9695.jpg", url:"https://www.bandsintown.com/e/1039424072-lefty-gunplay-at-club-stratus",
   desc:"Los Angeles rapper Lefty Gunplay brings his live show to the Stratus stage.", lineup:["Lefty Gunplay"]},
  {date:"2026-07-25", time:"8:00 PM", title:"Golden Teacher", tag:"DJ Night", flyer:"assets/flyers/2026-07-25-e187e4dc0efb.jpg", url:"https://posh.vip/e/golden-teacher",
   desc:"DARTYFORLIFE takes over Stratus: lasers, gold haze, and five DJs until 2 AM. Ages 18 & over.", lineup:["Trent","Soto","ZMG","Aaron","Luiso"], ages:"Ages 18 & over"},
  {date:"2026-08-29", time:"9:00 PM", title:"Flex, La Factoría & Makano", tag:"Reggaetón", flyer:"assets/flyers/2026-08-29-835c55aa06d3.jpg", url:"https://ticketon.com/en/events/flex-la-factoria-demphra--mas-en-phoenix-phoenix-az-2026-08-29-bgc4gzbze0do",
   desc:"A triple bill of reggaetón romántico: Flex, La Factoría with Demphra, and Makano on one stage.", lineup:["Flex","La Factoría (Demphra)","Makano"]},
  {date:"2026-09-26", time:"8:00 PM", title:"Durango Fest", tag:"Duranguense", flyer:"assets/flyers/2026-09-26-f903b1ab7e7c.jpg", url:"https://ticketon.com/en/events/durango-fest-en-phoenix-phoenix-az-2026-09-26-wbgo38az3d1z",
   desc:"Durango Fest marks 5 years with a stacked duranguense lineup, all ages, doors 8 PM.", lineup:["Alacranes Musical","Montez de Durango","Patrulla 81","Banda Lamento Show de Durango","Los Príncipes"], ages:"All ages"}
];

const EVENT_TYPES = [
  {key:"corporate", title:"Corporate Events & Galas",
   desc:"Conferences, banquets, award nights, holiday parties, and brand activations with full A/V and a polished, professional setting."},
  {key:"concert", title:"Live Music & Concerts",
   desc:"A proper stage, real sound, and capacity for a crowd. Ticketed shows and private performances, fully managed."},
  {key:"shows", title:"Shows & Entertainment",
   desc:"Comedians, magicians, boxing matches, wrestling nights, and touring acts. If it draws a crowd, we can stage it."},
  {key:"vip", title:"VIP Table Reservation",
   desc:"Reserved couch sections front and center of the stage: $200 for four, $300 for six, $400 for eight to ten."}
];

/* ---- icons ---- */
const IC = {
  ig:'<svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.9.07 3.3.15 4.8 1.7 5 5 .06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.2 3.3-1.7 4.8-5 5-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-3.3-.2-4.8-1.7-5-5C2.04 15.6 2 15.2 2 12s0-3.6.07-4.9c.2-3.3 1.7-4.8 5-5C8.4 2.2 8.8 2.2 12 2.2zm0 4.8a5 5 0 100 10 5 5 0 000-10zm0 8.2a3.2 3.2 0 110-6.4 3.2 3.2 0 010 6.4zm5.2-9.4a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z"/></svg>',
  fb:'<svg viewBox="0 0 24 24"><path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.5 2.9h-2.3v7A10 10 0 0022 12z"/></svg>'
};

/* ============================================================
   BUILD shared chrome (nav + overlay menu + footer + modal)
   ============================================================ */
const path = location.pathname.split('/').pop() || 'index.html';
const isHome = path === '' || path === 'index.html';
const home = isHome ? '' : 'index.html';

const NAV = [
  {h:'index.html', t:'Home'},
  {h:'events.html', t:'Events'},
  {h:'corporate-events.html', t:'Corporate Events'},
  {h:'concert-hall.html', t:'Concert Hall'},
  {h:`${home}#venue`, t:'The Venue'},
  {h:`${home}#tickets`, t:'Tickets'},
  {h:`${home}#vip`, t:'VIP Tables'},
  {h:'book.html', t:'Book a Tour'},
  {h:'book.html#faq', t:'FAQ'}
];

function buildNav(){
  const mount = document.getElementById('nav-mount'); if(!mount) return;
  const active = (h)=> (h===path || (isHome && h==='index.html')) ? ' class="active"' : '';
  mount.outerHTML = `
  <header class="site" id="header">
    <nav class="nav">
      <a href="index.html" class="brand" aria-label="Stratus Event Center home"><img src="assets/logo.png" alt="Stratus Event Center"></a>
      <div class="nav-right">
        <a href="book.html" class="nav-book">Book a Tour</a>
        <button class="pill pill-glass pill-sm" id="menuBtn" aria-expanded="false" aria-controls="menuOverlay">Menu</button>
      </div>
    </nav>
  </header>
  <div class="menu-overlay" id="menuOverlay" aria-hidden="true">
    <div class="menu-links">
      ${NAV.map((l,i)=>`<a href="${l.h}"${active(l.h)} style="transition-delay:${.05+i*.05}s">${l.t}</a>`).join('')}
    </div>
    <div class="menu-foot">
      <a href="${CONFIG.ig}" target="_blank" rel="noopener">Instagram</a>
      <a href="${CONFIG.fb}" target="_blank" rel="noopener">Facebook</a>
      <a href="tel:${CONFIG.phoneRaw}">${CONFIG.phone}</a>
    </div>
  </div>`;
}

function buildFooter(){
  const mount = document.getElementById('footer-mount'); if(!mount) return;
  mount.outerHTML = `
  <footer class="site">
    <div class="foot-inner">
      <img src="assets/logo.png" alt="Stratus Event Center">
      <div class="foot-links">
        <a href="events.html">Events</a>
        <a href="corporate-events.html">Corporate Events</a>
        <a href="concert-hall.html">Concert Hall</a>
        <a href="${home}#venue">The Venue</a>
        <a href="${home}#tickets">Tickets</a>
        <a href="book.html">Book a Tour</a>
        <a href="mailto:${CONFIG.emails.default}">Contact</a>
      </div>
      <div class="foot-social">
        <a href="${CONFIG.ig}" target="_blank" rel="noopener" aria-label="Instagram">${IC.ig}</a>
        <a href="${CONFIG.fb}" target="_blank" rel="noopener" aria-label="Facebook">${IC.fb}</a>
      </div>
      <div class="foot-legal">
        Arizona's premier corporate event venue and concert hall for up to 2,250 guests: corporate productions, live music and entertainment with full-service catering.<br>
        <a href="${CONFIG.mapGoogle}" target="_blank" rel="noopener">4344 W Indian School Rd, Ste 32, Phoenix, AZ 85031</a>
        · <a href="tel:${CONFIG.phoneRaw}">${CONFIG.phone}</a><br>
        © 2026 Stratus Event Center. All rights reserved.<br>
        Proudly serving the Valley: Phoenix, Glendale, Scottsdale, Peoria, Avondale, Surprise &amp; Litchfield Park.
      </div>
    </div>
  </footer>`;
}

function buildModal(){
  if(document.getElementById('modal')) return;
  const d = document.createElement('div');
  d.innerHTML = `
  <div class="modal-overlay" id="modal">
    <div class="modal">
      <button class="modal-close" id="modalClose" aria-label="Close">✕</button>
      <div class="modal-top">
        <div class="k">Tour &amp; Event Request</div>
        <h3 id="modalTitle">Book Your Event</h3>
        <div class="to">Goes straight to <b id="modalEmail">${CONFIG.emails.default}</b></div>
      </div>
      <div class="modal-body">
        <form id="bookForm">
          <input type="hidden" id="evtType">
          <div class="field-row">
            <div class="field"><label>Your Name</label><input type="text" id="fName" required placeholder="First &amp; last"></div>
            <div class="field"><label>Phone</label><input type="tel" id="fPhone" placeholder="(602) 000-0000"></div>
          </div>
          <div class="field"><label>Email</label><input type="email" id="fEmail" required placeholder="you@email.com"></div>
          <div class="field-row">
            <div class="field"><label>Preferred Date</label><input type="date" id="fDate"></div>
            <div class="field"><label>Estimated Guests</label><input type="number" id="fGuests" min="1" placeholder="Approx. guests"></div>
          </div>
          <div class="field"><label>Tell us about your event</label><textarea id="fMsg" placeholder="Vision, headcount, catering &amp; bar needs, anything else..."></textarea></div>
          <button type="submit" class="pill pill-solid" style="width:100%">Request Availability</button>
        </form>
        <div class="modal-success" id="modalSuccess">
          <h4>Almost there, hit send</h4>
          <p>We tried to open a pre-filled email to <span class="em" id="successEmail">${CONFIG.emails.default}</span>. Just press send in your mail app.</p>
          <p class="success-fallback">Nothing opened? Email <a id="successMail" href="mailto:${CONFIG.emails.default}">${CONFIG.emails.default}</a> or call or text <a href="tel:${CONFIG.phoneRaw}">${CONFIG.phone}</a> and we'll take it from there.</p>
        </div>
      </div>
    </div>
  </div>`;
  document.body.appendChild(d.firstElementChild);
}

/* ============================================================
   INIT
   ============================================================ */
buildNav(); buildFooter(); buildModal();

// resolve data-cfg links anywhere on the page
document.querySelectorAll('[data-cfg]').forEach(el=>{
  const k = el.getAttribute('data-cfg');
  const map = {tickets:CONFIG.tickets,bit:CONFIG.bit,ticketon:CONFIG.ticketon,tickeri:CONFIG.tickeri,tm:CONFIG.tm,
               stubhub:CONFIG.stubhub,shazam:CONFIG.shazam,ig:CONFIG.ig,fb:CONFIG.fb,yelp:CONFIG.yelp,partner:CONFIG.partner,
               map:CONFIG.mapGoogle,mapgoogle:CONFIG.mapGoogle,mapapple:CONFIG.mapApple};
  if(k in map) el.href = map[k];
  else if(k==='tel'){ el.href="tel:"+CONFIG.phoneRaw; if(!el.textContent.trim())el.textContent=CONFIG.phone; }
  else if(k==='partnerTel'){ el.href="tel:"+CONFIG.partnerPhoneRaw; if(!el.textContent.trim())el.textContent=CONFIG.partnerPhone; }
  else if(k==='mailDefault') el.href="mailto:"+CONFIG.emails.default;
});

// directions: auto-pick the most convenient maps app for the visitor's platform
(function(){
  const isApple=/Mac|iPhone|iPad|iPod/.test(navigator.platform)||/iPhone|iPad|Mac OS X/.test(navigator.userAgent);
  const primary=isApple?CONFIG.mapApple:CONFIG.mapGoogle;
  const alt=isApple?CONFIG.mapGoogle:CONFIG.mapApple;
  document.querySelectorAll('[data-directions]').forEach(el=>el.href=primary);
  document.querySelectorAll('[data-directions-alt]').forEach(el=>{
    el.href=alt;
    el.textContent=isApple?'Prefer Google Maps?':'Prefer Apple Maps?';
  });
})();

// header scroll state
const header=document.getElementById('header');
if(header) addEventListener('scroll',()=>header.classList.toggle('scrolled',scrollY>40),{passive:true});

// fullscreen menu
(function(){
  const btn=document.getElementById('menuBtn'), ov=document.getElementById('menuOverlay');
  if(!btn||!ov) return;
  function set(open){
    ov.classList.toggle('open',open);
    ov.setAttribute('aria-hidden',String(!open));
    btn.setAttribute('aria-expanded',String(open));
    btn.textContent=open?'Close':'Menu';
    document.body.style.overflow=open?'hidden':'';
  }
  btn.addEventListener('click',()=>set(!ov.classList.contains('open')));
  ov.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>set(false)));
  addEventListener('keydown',e=>{if(e.key==='Escape'&&ov.classList.contains('open'))set(false);});
})();

/* ---------- Hï-style typewriter: [data-type] text types out on first view ---------- */
(function(){
  const els=[...document.querySelectorAll('[data-type]')];
  if(!els.length) return;
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(reduce){ els.forEach(el=>el.textContent=el.dataset.type); return; }
  // lines that share a [data-type-group] container type one after another
  const groups=new Map();
  els.forEach(el=>{
    const g=el.closest('[data-type-group]')||el;
    if(!groups.has(g)) groups.set(g,[]);
    groups.get(g).push(el);
  });
  const SPEED=55;
  function typeGroup(list){
    let li=0;
    (function typeLine(){
      const el=list[li]; const text=el.dataset.type; let i=0;
      el.classList.add('typing');
      const t=setInterval(()=>{
        i++; el.textContent=text.slice(0,i);
        if(i>=text.length){
          clearInterval(t); el.classList.remove('typing');
          li++;
          if(li<list.length) setTimeout(typeLine,140);
          else el.classList.add('typed');
        }
      },SPEED);
    })();
  }
  // registered with the shared viewport ticker below (scroll-checked; more
  // reliable than IntersectionObserver across embedded/in-app browsers)
  const pending=new Set(groups.keys());
  window.__fxTypeCheck=function(vh){
    vh=vh||innerHeight||document.documentElement.clientHeight||800;
    pending.forEach(g=>{
      const r=g.getBoundingClientRect();
      if((r.width||r.height) && r.top<vh*.85 && r.bottom>0){
        pending.delete(g);
        setTimeout(()=>typeGroup(groups.get(g)),120);
      }
    });
  };
})();

// hero: giant type fades and drifts as you scroll past
(function(){
  const stage=document.querySelector('.hero-stage'); if(!stage) return;
  const logo=stage.querySelector('.hero-logo');
  const line=stage.querySelector('.hero-line');
  const cta=stage.querySelector('.hero-cta');
  const meta=stage.querySelector('.hero-meta');
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(reduce) return;
  function onScroll(){
    const total=stage.offsetHeight-innerHeight;
    let p=Math.min(1,Math.max(0,(-stage.getBoundingClientRect().top)/total));
    const fade=Math.max(0,1-p*1.5);
    const drift=p*60;
    if(line){line.style.opacity=fade;line.style.transform=`translateY(${-drift}px) scale(${1-p*.08})`;}
    if(logo){logo.style.opacity=fade;logo.style.transform=`translateY(${-drift*.6}px)`;}
    if(cta){cta.style.opacity=Math.max(0,1-p*2);}
    if(meta){meta.style.opacity=Math.max(0,1-p*2.5);}
  }
  addEventListener('scroll',onScroll,{passive:true});
  onScroll();
})();

/* ---------- booking modal + email routing ---------- */
(function(){
  const modal=document.getElementById('modal'); if(!modal) return;
  const mTitle=document.getElementById('modalTitle'), mEmail=document.getElementById('modalEmail');
  const evtTypeInput=document.getElementById('evtType');
  let activeEmail=CONFIG.emails.default;
  window.openBooking=function(key){
    const ev=EVENT_TYPES.find(e=>e.key===key);
    activeEmail=CONFIG.emails[key]||CONFIG.emails.default;
    mTitle.textContent=ev?ev.title:"Book Your Event";
    mEmail.textContent=activeEmail;
    evtTypeInput.value=ev?ev.title:"General";
    document.getElementById('bookForm').style.display='block';
    document.getElementById('modalSuccess').classList.remove('show');
    modal.classList.add('open'); document.body.style.overflow='hidden';
  };
  function close(){modal.classList.remove('open');document.body.style.overflow='';}
  document.getElementById('modalClose').addEventListener('click',close);
  modal.addEventListener('click',e=>{if(e.target===modal)close();});
  addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  document.getElementById('bookForm').addEventListener('submit',e=>{
    e.preventDefault();
    const g=id=>document.getElementById(id).value;
    const type=evtTypeInput.value;
    const subject=`Stratus Event Center: ${type} Inquiry from ${g('fName')}`;
    const body=`Event type: ${type}\nName: ${g('fName')}\nEmail: ${g('fEmail')}\nPhone: ${g('fPhone')}\nPreferred date: ${g('fDate')||"Flexible"}\nEstimated guests: ${g('fGuests')||"TBD"}\n\nDetails:\n${g('fMsg')}\n\nSent from the Stratus Event Center website`;
    window.location.href=`mailto:${activeEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    document.getElementById('bookForm').style.display='none';
    document.getElementById('successEmail').textContent=activeEmail;
    document.getElementById('modalSuccess').classList.add('show');
  });
})();

/* ---------- render event-type cards (book page) ---------- */
(function(){
  const host=document.getElementById('events-types'); if(!host) return;
  host.innerHTML=EVENT_TYPES.map((ev,i)=>`
    <div class="mcard evt reveal d${i%4}" data-key="${ev.key}" role="button" tabindex="0" aria-label="Request ${ev.title}">
      <div class="num">0${i+1}</div>
      <h3>${ev.title}</h3>
      <p>${ev.desc}</p>
      <div class="go">Request this →</div>
    </div>`).join('');
  host.querySelectorAll('.evt').forEach(c=>{
    const open=()=>window.openBooking(c.dataset.key);
    c.addEventListener('click',open);
    c.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); open(); } });
  });
})();

/* ---------- direct booking from any [data-book] card (home hosts grid) ---------- */
document.querySelectorAll('[data-book]').forEach(c=>{
  c.addEventListener('click',e=>{
    if(typeof window.openBooking!=='function') return; // fall through to href
    e.preventDefault();
    window.openBooking(c.getAttribute('data-book'));
  });
});

/* ---------- render events (cards on home, list on events page) ---------- */
function fmtDate(iso){
  const d=new Date(iso+'T12:00:00');
  return {
    dow:d.toLocaleDateString('en-US',{weekday:'short'}).toUpperCase(),
    dnum:d.getDate(),
    mon:d.toLocaleDateString('en-US',{month:'short'}).toUpperCase(),
    monthKey:d.toLocaleDateString('en-US',{month:'long',year:'numeric'})
  };
}
function upcoming(){
  const src=(window.__LIVE_EVENTS&&window.__LIVE_EVENTS.length)?window.__LIVE_EVENTS:EVENTS;
  const today=new Date(); today.setHours(0,0,0,0);
  return src.filter(e=>new Date(e.date+'T23:59:59')>=today);
}
// home: horizontal card row
function renderHomeCards(){
  const host=document.getElementById('events-cards'); if(!host) return;
  const evs=upcoming();
  if(!evs.length){ host.innerHTML=`<div class="ev-empty">Dates announced soon. Follow Club Stratus on Bandsintown.</div>`; return; }
  host.innerHTML=evs.map((ev,i)=>{
    const f=fmtDate(ev.date);
    const art=ev.flyer
      ? `<img src="${ev.flyer}" alt="${ev.title} flyer" loading="${i<2?'eager':'lazy'}" decoding="async">`
      : `<div class="noart"><span>${ev.title}</span></div>`;
    return `<a class="ecard reveal" href="${ev.url||CONFIG.tickets}" target="_blank" rel="noopener" aria-label="${ev.title} tickets">
      <div class="art">${art}</div>
      <div class="cap">
        <div class="date"><b>${f.dow}</b> ${f.mon} ${f.dnum} · Doors ${ev.time}</div>
        <h3>${ev.title}</h3>
        <span class="pill pill-glass pill-sm">Buy Tickets</span>
      </div>
    </a>`;
  }).join('');
}
// events page: horizontal rows with flyer, blurb and a Show More drawer
function sellerName(url){
  if(!url) return "our box office";
  if(url.includes("posh.vip")) return "Posh";
  if(url.includes("ticketon")) return "Ticketón";
  if(url.includes("bandsintown")) return "Bandsintown";
  if(url.includes("tickeri")) return "Tickeri";
  if(url.includes("ticketmaster")) return "Ticketmaster";
  if(url.includes("stubhub")) return "StubHub";
  return "official sellers";
}
function renderEventsList(){
  const host=document.getElementById('events-list'); if(!host) return;
  const evs=upcoming();
  if(!evs.length){
    host.innerHTML=`<div class="ev-empty">Dates announced soon. Planning an event, or want to know what's coming to Stratus? Reach out and we'll put you on the list.</div>`;
    return;
  }
  let html=''; let curMonth='';
  evs.forEach(ev=>{
    const f=fmtDate(ev.date);
    if(f.monthKey!==curMonth){curMonth=f.monthKey; html+=`<div class="month-label">${f.monthKey}</div>`;}
    const art=ev.flyer
      ? `<img src="${ev.flyer}" alt="${ev.title} flyer" loading="lazy" decoding="async">`
      : `<div class="noart"><span>${ev.title}</span></div>`;
    const lineup=(ev.lineup&&ev.lineup.length)
      ? `<div><div class="lk">Lineup</div><div class="lchips">${ev.lineup.map(a=>`<span class="lchip">${a}</span>`).join('')}</div></div>`:'';
    const facts=[
      `Doors ${ev.time}`,
      ev.ages||null,
      `Stratus Event Center · 4344 W Indian School Rd, Ste 32, Phoenix`,
      `Official tickets on ${sellerName(ev.url)}`
    ].filter(Boolean).map(x=>`<div>${x}</div>`).join('');
    html+=`<div class="lrow lrow-x reveal">
      <div class="when">${f.dow}<b>${f.mon} ${f.dnum}</b></div>
      <a class="lart" href="${ev.url||CONFIG.tickets}" target="_blank" rel="noopener" aria-label="${ev.title} tickets">${art}</a>
      <div class="what">
        <h3>${ev.title}</h3>
        <div class="sub"><em>${ev.tag||'Live'}</em> · Doors ${ev.time}</div>
        ${ev.desc?`<p class="ldesc">${ev.desc}</p>`:''}
      </div>
      <div class="act">
        <a href="${ev.url||CONFIG.tickets}" target="_blank" rel="noopener" class="pill pill-solid pill-sm">Buy Tickets</a>
        <button class="pill pill-glass pill-sm lmore" aria-expanded="false">Show More</button>
      </div>
    </div>
    <div class="ldetail">
      <div class="ldetail-inner">
        ${lineup}
        <div><div class="lk">Details</div><div class="lfact">${facts}</div></div>
      </div>
    </div>`;
  });
  host.innerHTML=html;
  host.querySelectorAll('.lmore').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const row=btn.closest('.lrow');
      const detail=row.nextElementSibling;
      const open=!detail.classList.contains('open');
      detail.classList.toggle('open',open);
      row.classList.toggle('expanded',open);
      btn.setAttribute('aria-expanded',String(open));
      btn.textContent=open?'Show Less':'Show More';
    });
  });
}

/* ---------- viewport ticker: scroll reveals + typewriter triggers ---------- */
let fxLast=0;
function fxTick(){
  const vh=innerHeight||document.documentElement.clientHeight||800;
  // re-query each tick so late-rendered rows (live events fetch) still reveal
  for(const el of document.querySelectorAll('.reveal:not(.in)')){
    const r=el.getBoundingClientRect();
    if((r.width||r.height) && r.top<vh*.92 && r.bottom>0) el.classList.add('in');
  }
  if(window.__fxTypeCheck) window.__fxTypeCheck(vh);
}
function fxSchedule(){ const n=Date.now(); if(n-fxLast>90){ fxLast=n; fxTick(); } }
addEventListener('scroll',fxSchedule,{passive:true});
addEventListener('resize',fxSchedule,{passive:true});
fxTick();
setInterval(fxTick,500); // safety net for in-app browsers that swallow scroll events

/* ---------- SEO: structured data for upcoming events (Google event rich results) ---------- */
function injectEventSchema(){
  document.getElementById('event-schema')?.remove();
  const evs=upcoming(); if(!evs.length) return;
  const SITE='https://stratuseventcenteraz.com/';
  function toISO(ev){
    const m=ev.time.match(/(\d+):(\d+)\s*(AM|PM)/i); if(!m) return ev.date;
    let h=(+m[1])%12; if(/pm/i.test(m[3])) h+=12;
    return ev.date+'T'+String(h).padStart(2,'0')+':'+m[2]+':00-07:00'; // Phoenix, no DST
  }
  const venue={"@type":"EventVenue","name":"Stratus Event Center",
    "address":{"@type":"PostalAddress","streetAddress":"4344 W Indian School Rd, Ste 32",
      "addressLocality":"Phoenix","addressRegion":"AZ","postalCode":"85031","addressCountry":"US"}};
  const data=evs.map(ev=>Object.assign({
    "@context":"https://schema.org","@type":"MusicEvent","name":ev.title,
    "startDate":toISO(ev),
    "eventStatus":"https://schema.org/EventScheduled",
    "eventAttendanceMode":"https://schema.org/OfflineEventAttendanceMode",
    "location":venue,
    "organizer":{"@type":"Organization","name":"Stratus Event Center","url":SITE},
    "performer":{"@type":"MusicGroup","name":ev.title.split(/,| w\//)[0].trim()},
    "offers":{"@type":"Offer","url":ev.url||CONFIG.tickets,"availability":"https://schema.org/InStock"}
  }, ev.flyer?{"image":SITE+ev.flyer}:{}));
  const s=document.createElement('script'); s.type='application/ld+json'; s.id='event-schema';
  s.textContent=JSON.stringify(data); document.head.appendChild(s);
}

/* ---------- load live events (events.json, synced daily from Bandsintown),
   then render; baked EVENTS array is the offline fallback ---------- */
function renderEvents(){ renderHomeCards(); renderEventsList(); injectEventSchema(); }
fetch('events.json?t='+Date.now())
  .then(r=>r.ok?r.json():null)
  .catch(()=>null)
  .then(j=>{
    if(j&&Array.isArray(j.events)&&j.events.length) window.__LIVE_EVENTS=j.events;
    renderEvents();
  });

/* ---------- console signature ---------- */
console.log('%cSTRATUS','font:800 22px Archivo,sans-serif;color:#fff');
console.log('%cArizona\'s premier event center','color:#C9A24B');

window.STRATUS = { CONFIG, EVENTS, EVENT_TYPES, fmtDate };

/* ============================================================
   EVENT QUIZ — adaptive intake popup
   Config lives in quiz-config.json (versioned separately so a
   future optimizer can rewrite questions without touching code).
   Each answer decides the next question via its `next` pointer.
   Submit = pre-filled email to the Stratus inbox, same delivery
   mechanism as the booking modal. Only a dismissed/submitted
   timestamp is stored locally — no answers persist in the browser.
   ============================================================ */
(function(){
  const LSK='stratusQuizV1';
  const store=()=>{try{return JSON.parse(localStorage.getItem(LSK)||'{}')}catch(e){return{}}};
  const save=p=>{try{localStorage.setItem(LSK,JSON.stringify(Object.assign(store(),p)))}catch(e){}};
  let CFG=null,cur=null,hist=[],answers=[],opened=false,autoFired=false;

  fetch('quiz-config.json?t='+Date.now())
    .then(r=>r.ok?r.json():null).catch(()=>null)
    .then(j=>{ if(!j||!j.steps) return; CFG=j; build(); arm(); });

  function build(){
    const chip=document.createElement('button');
    chip.className='qz-launch'; chip.id='qzLaunch'; chip.textContent='Plan Your Event';
    const ov=document.createElement('div');
    ov.className='qz-ov'; ov.id='qzOv'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true');
    ov.innerHTML=`<div class="qz">
      <button class="qz-close" id="qzClose" aria-label="Close">✕</button>
      <div class="qz-kick">${CFG.intro.kicker}</div>
      <div id="qzBody"></div>
      <div class="qz-foot"><button class="qz-back hide" id="qzBack">← Back</button><span class="qz-step" id="qzStep"></span></div>
    </div>`;
    document.body.append(chip,ov);
    chip.addEventListener('click',()=>open());
    document.getElementById('qzClose').addEventListener('click',close);
    ov.addEventListener('click',e=>{ if(e.target===ov) close(); });
    addEventListener('keydown',e=>{ if(e.key==='Escape'&&ov.classList.contains('open')) close(); });
    document.getElementById('qzBack').addEventListener('click',back);
    // theme cards + corporate links anywhere on the page
    document.querySelectorAll('[data-quiz-theme]').forEach(el=>el.addEventListener('click',e=>{
      e.preventDefault(); open({theme:el.getAttribute('data-quiz-theme')});
    }));
    document.querySelectorAll('[data-quiz]').forEach(el=>el.addEventListener('click',e=>{
      e.preventDefault(); open({branch:el.getAttribute('data-quiz')});
    }));
  }

  function arm(){
    const s=store();
    if(s.submittedAt) return; // they already sent one, stay quiet
    const cd=(CFG.trigger.cooldownDays||7)*864e5;
    if(s.dismissedAt && Date.now()-s.dismissedAt<cd) return;
    const fire=()=>{ if(!autoFired&&!opened){ autoFired=true; open(); } };
    setTimeout(fire,CFG.trigger.delayMs||8000);
    addEventListener('scroll',function onS(){
      const doc=document.documentElement;
      const pct=100*scrollY/Math.max(1,doc.scrollHeight-innerHeight);
      if(pct>=(CFG.trigger.scrollPct||35)){ removeEventListener('scroll',onS); fire(); }
    },{passive:true});
  }

  function open(preset){
    if(!CFG) return;
    opened=true; hist=[]; answers=[]; cur=null;
    const ov=document.getElementById('qzOv');
    ov.classList.add('open'); document.body.style.overflow='hidden';
    document.getElementById('qzLaunch').classList.add('hide');
    if(preset&&preset.theme){
      answers=[{q:'Who is this event for?',v:'Corporate'},{q:'Event style',v:preset.theme}];
      show('q_c_size');
    }else if(preset&&preset.branch==='corporate'){
      answers=[{q:'Who is this event for?',v:'Corporate'}];
      show('q_c_theme');
    }else{
      intro();
    }
  }
  function close(){
    const ov=document.getElementById('qzOv');
    ov.classList.remove('open'); document.body.style.overflow='';
    document.getElementById('qzLaunch').classList.remove('hide');
    if(!store().submittedAt) save({dismissedAt:Date.now()});
    opened=false;
  }

  function remaining(id){ // steps left from here, following first-option pointers
    let n=0,s=id,guard=0;
    while(s&&guard++<20){
      n++;
      const st=CFG.steps[s]; if(!st) break;
      s=st.next||(st.options&&st.options[0]&&st.options[0].next)||null;
    }
    return n;
  }
  function stepMeta(){
    const pos=answers.length+1,total=answers.length+remaining(cur);
    document.getElementById('qzStep').textContent=cur?`Question ${pos} of ${total}`:'';
    document.getElementById('qzBack').classList.toggle('hide',!cur||hist.length===0&&answers.length<=quizPresetDepth());
  }
  function quizPresetDepth(){ return 0; } // history only tracks in-quiz moves

  function intro(){
    cur=null;
    body(`<div class="qz-title">${CFG.intro.title}</div>
      <p class="qz-help">${CFG.intro.sub}</p>
      <div class="qz-row">
        <button class="pill pill-solid" id="qzStart">${CFG.intro.cta}</button>
        <button class="qz-skip" id="qzNo">${CFG.intro.dismiss}</button>
      </div>`);
    document.getElementById('qzStep').textContent='';
    document.getElementById('qzBack').classList.add('hide');
    document.getElementById('qzStart').addEventListener('click',()=>show(CFG.start));
    document.getElementById('qzNo').addEventListener('click',close);
  }

  function show(id){
    const st=CFG.steps[id]; if(!st){ finish(); return; }
    cur=id;
    let html=`<div class="qz-q">${st.q}</div>`;
    if(st.help) html+=`<p class="qz-help">${st.help}</p>`;
    if(st.type==='options'){
      html+=`<div class="qz-opts">${st.options.map((o,i)=>{
        const parts=o.t.split('. ');
        const head=parts.shift(), rest=parts.join('. ');
        return `<button class="qz-opt" data-i="${i}"><b>${head}${rest?'.':''}</b>${rest?`<small>${rest}</small>`:''}</button>`;
      }).join('')}</div>`;
    }else if(st.type==='date'){
      html+=`<div class="qz-row">
        <input type="date" id="qzDate" min="${new Date().toISOString().slice(0,10)}">
        <button class="pill pill-glass" id="qzFlex">${st.flexText}</button>
      </div>
      <div class="qz-row"><button class="pill pill-solid" id="qzNext">Continue</button></div>
      <div class="qz-err" id="qzErr">Pick a date or tap "${st.flexText}".</div>`;
    }else if(st.type==='text'){
      html+=`<textarea id="qzText" placeholder="${st.placeholder||''}"></textarea>
      <div class="qz-row">
        <button class="pill pill-solid" id="qzNext">Continue</button>
        ${st.optional?`<button class="qz-skip" id="qzSkip">Skip</button>`:''}
      </div>`;
    }else if(st.type==='contact'){
      html+=`
      <div class="field-row">
        <div class="field"><label>Your Name</label><input type="text" id="qzName" required placeholder="First &amp; last"></div>
        <div class="field"><label>Phone</label><input type="tel" id="qzPhone" placeholder="(602) 000-0000"></div>
      </div>
      <div class="field"><label>Email</label><input type="email" id="qzEmail" required placeholder="you@email.com"></div>
      <div class="qz-row"><button class="pill pill-solid" style="width:100%" id="qzSend">Send My Request</button></div>
      <div class="qz-err" id="qzErr">Add your name and a valid email so we can reply.</div>`;
    }
    body(html); stepMeta();
    if(st.type==='options'){
      document.querySelectorAll('.qz-opt').forEach(btn=>btn.addEventListener('click',()=>{
        const o=st.options[+btn.dataset.i];
        advance(st,o.v,o.next);
      }));
    }else if(st.type==='date'){
      document.getElementById('qzFlex').addEventListener('click',()=>advance(st,'Flexible',st.next));
      document.getElementById('qzNext').addEventListener('click',()=>{
        const v=document.getElementById('qzDate').value;
        if(!v){ document.getElementById('qzErr').classList.add('show'); return; }
        advance(st,v,st.next);
      });
    }else if(st.type==='text'){
      document.getElementById('qzNext').addEventListener('click',()=>{
        const v=document.getElementById('qzText').value.trim();
        advance(st,v||'None',st.next);
      });
      const sk=document.getElementById('qzSkip');
      if(sk) sk.addEventListener('click',()=>advance(st,'None',st.next));
    }else if(st.type==='contact'){
      document.getElementById('qzSend').addEventListener('click',submit);
    }
    const panel=document.querySelector('.qz'); if(panel) panel.scrollTop=0;
  }

  function advance(st,val,next){
    hist.push(cur);
    answers.push({q:st.q,v:val});
    if(next) show(next); else finish();
  }
  function back(){
    if(!hist.length) return;
    answers.pop();
    show(hist.pop());
  }

  function submit(){
    const name=document.getElementById('qzName').value.trim();
    const email=document.getElementById('qzEmail').value.trim();
    const phone=document.getElementById('qzPhone').value.trim();
    if(!name||!/.+@.+\..+/.test(email)){ document.getElementById('qzErr').classList.add('show'); return; }
    const who=(answers[0]&&answers[0].v)||'Event';
    const subject=`Stratus Event Center: ${who} Event Inquiry from ${name}`;
    const lines=answers.map(a=>`${a.q}\n  ${a.v}`).join('\n');
    const bodyTxt=`${lines}\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone||'Not given'}\n\nSent from the Stratus Event Center website (event quiz)`;
    location.href=`mailto:${CONFIG.emails.default}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyTxt)}`;
    save({submittedAt:Date.now()});
    finish(true);
  }

  function finish(sent){
    cur=null;
    body(`<div class="qz-title">${CFG.outro.title}</div>
      <p class="qz-help">${CFG.outro.sub}</p>
      <p class="qz-help">Nothing opened? Email <a href="mailto:${CONFIG.emails.default}" style="color:#fff">${CONFIG.emails.default}</a> or call or text <a href="tel:${CONFIG.phoneRaw}" style="color:#fff">${CONFIG.phone}</a>.</p>
      <div class="qz-row"><button class="pill pill-glass" id="qzDone">Done</button></div>`);
    document.getElementById('qzStep').textContent='';
    document.getElementById('qzBack').classList.add('hide');
    document.getElementById('qzDone').addEventListener('click',close);
  }

  function body(html){ document.getElementById('qzBody').innerHTML=html; }
})();
