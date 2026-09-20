
(function(){
  "use strict";
  if(window.__ORBIT_COMMAND_ROOM__) return;
  window.__ORBIT_COMMAND_ROOM__ = true;

  const $ = s => document.querySelector(s);
  const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));

  const token = () => localStorage.getItem("orbit_guest_token") || "";
  async function api(url, opts = {}){
    opts.headers = {
      ...(opts.headers || {}),
      ...(token() ? {Authorization:"Bearer "+token()} : {}),
      ...(opts.body && !(opts.body instanceof FormData) ? {"Content-Type":"application/json"} : {})
    };
    const r = await fetch(url, opts);
    const d = await r.json().catch(() => ({}));
    if(!r.ok) throw new Error(d.error || "Request failed");
    return d;
  }

  function initial(name){
    const n = String(name || "Guest").trim();
    return n ? n.slice(0,2).toUpperCase() : "G";
  }
  function avatar(u){
    const url = u?.avatar_url || u?.avatarUrl || u?.avatar || "";
    return url ? '<img src="'+esc(url)+'" alt="">' : esc(initial(u?.display_name || u?.displayName || u?.username));
  }
  function setActive(){
    document.body.classList.add("orbit-command-room-active");
  }

  function go(view){
    try { window.setView?.(view); } catch {}
  }

  async function joinRoom(call){
    try{
      const servers = (await api("/api/servers")).servers || [];
      const server = servers.find(s => String(s.id) === String(call.serverId));
      if(!server){
        window.orbitToast?.("Live room","You are not a member of that community.","error");
        return;
      }
      if(window.selectServer) await window.selectServer(server);
      const d = await api("/api/servers/"+encodeURIComponent(call.serverId)+"/channels");
      const channels = d.channels || [];
      const ch = channels.find(c => String(c.id) === String(call.channelId));
      if(window.selectChannel && ch) await window.selectChannel(ch);
      window.goChat?.();
      setTimeout(() => {
        if(call.mode === "voice" || call.mode === "video"){
          const btn = call.mode === "voice" ? $("#voice-call-btn") : $("#video-call-btn");
          btn?.click();
        }
      }, 250);
    }catch(e){
      console.error(e);
      window.orbitToast?.("Live room", e.message || "Could not join the room.", "error");
    }
  }

  function build(data){
    const pulse = data.pulse || {};
    const friends = data.friends?.friends || [];
    const dms = data.dms?.dms || [];
    const servers = data.servers?.servers || [];
    const users = (pulse.users || []).filter(u => !["offline","away"].includes(String(u.status || "").toLowerCase()));
    const calls = pulse.calls || [];
    const currentName = data.me?.display_name || data.me?.username || "Guest";
    const liveUsers = users.filter(u => String(u.status || "online").toLowerCase() === "online");
    const people = (friends.length ? friends : users).slice(0,7);

    const nodePositions = [
      [50,50], [16,28], [28,76], [73,22], [86,57], [62,82], [12,58]
    ];

    const nodes = [];
    people.slice(0,6).forEach((u,i)=>{
      const p = nodePositions[i+1];
      nodes.push('<button class="ocr-node" data-node-user="'+esc(u.id||"")+'" style="left:'+p[0]+'%;top:'+p[1]+'%" data-kind="user">'+
        '<span class="node-icon">●</span><strong>'+esc(u.display_name||u.username||"Guest")+'</strong>'+
        '<small>'+esc(u.activity||u.status||"Online")+'</small></button>');
    });
    calls.slice(0,4).forEach((c,i)=>{
      const p = [[80,28],[82,76],[20,48],[68,42]][i];
      nodes.push('<button class="ocr-node" data-room-index="'+i+'" style="left:'+p[0]+'%;top:'+p[1]+'%" data-kind="call">'+
        '<span class="node-icon">◉</span><strong>#'+esc(c.channelName||"Live room")+'</strong>'+
        '<small>'+esc((c.mode==="voice"?"VOICE":"VIDEO")+" · "+((c.participants||[]).length||0)+" people")+'</small></button>');
    });

    return ''+
    '<div id="orbit-command-room" class="orbit-command-room"><div class="ocr-wrap">'+
      '<header class="ocr-topbar">'+
        '<div><div class="ocr-kicker"><i></i> ORBIT / COMMAND ROOM</div>'+
        '<h1 class="ocr-title">Your social universe, one control surface.</h1>'+
        '<p class="ocr-subtitle">A calmer home for people, communities, private conversations, live rooms and the actions you use most.</p></div>'+
        '<div class="ocr-actions">'+
          '<button class="ocr-btn" data-ocr-action="search">Search</button>'+
          '<button class="ocr-btn primary" data-ocr-action="chat">Open chat</button>'+
          '<button class="ocr-btn command" data-ocr-action="owner">Owner command</button>'+
        '</div>'+
      '</header>'+

      '<section class="ocr-metrics">'+
        '<div class="ocr-metric"><span class="label">People online</span><strong>'+liveUsers.length+'</strong><small>Realtime presence</small><i class="signal"></i></div>'+
        '<div class="ocr-metric"><span class="label">Live rooms</span><strong>'+calls.length+'</strong><small>Voice & video activity</small><i class="signal"></i></div>'+
        '<div class="ocr-metric"><span class="label">Communities</span><strong>'+servers.length+'</strong><small>Your connected worlds</small><i class="signal"></i></div>'+
        '<div class="ocr-metric"><span class="label">Direct messages</span><strong>'+dms.length+'</strong><small>Private conversations</small><i class="signal"></i></div>'+
      '</section>'+

      '<div class="ocr-main-grid">'+
        '<div class="ocr-left">'+
          '<section class="ocr-panel">'+
            '<div class="ocr-panel-head"><div><h3>Command Deck</h3><p>Launch the most common social actions without hunting through menus.</p></div><span class="ocr-chip">Fast access</span></div>'+
            '<div class="ocr-command-deck">'+
              '<button class="ocr-deck-item" data-ocr-action="message"><span class="ocr-deck-icon">✉</span><strong>New conversation</strong><span>Open a private chat or use your recent DMs.</span></button>'+
              '<button class="ocr-deck-item" data-ocr-action="community"><span class="ocr-deck-icon">◈</span><strong>Explore communities</strong><span>Discover spaces and conversations beyond your current worlds.</span></button>'+
              '<button class="ocr-deck-item" data-ocr-action="voice"><span class="ocr-deck-icon">◉</span><strong>Start voice</strong><span>Jump into your current voice space in one motion.</span></button>'+
              '<button class="ocr-deck-item" data-ocr-action="video"><span class="ocr-deck-icon">▣</span><strong>Start video</strong><span>Open video from the active community workspace.</span></button>'+
              '<button class="ocr-deck-item" data-ocr-action="create"><span class="ocr-deck-icon">＋</span><strong>Create community</strong><span>Build a new world and invite your people.</span></button>'+
              '<button class="ocr-deck-item" data-ocr-action="events"><span class="ocr-deck-icon">◇</span><strong>Events & activity</strong><span>Keep track of shared moments and upcoming plans.</span></button>'+
            '</div>'+
          '</section>'+

          '<section class="ocr-panel">'+
            '<div class="ocr-panel-head"><div><h3>Live Universe</h3><p>The social graph as it is right now.</p></div><span class="ocr-chip">Realtime</span></div>'+
            '<div class="ocr-universe"><div class="ocr-universe-grid"></div><div class="ocr-core-orbit"></div><div class="ocr-core"><div><b>ORBIT</b><small>LIVE CORE</small></div></div>'+nodes.join("")+'</div>'+
            '<div class="ocr-foot"><span>Connected people and live rooms are represented here.</span><strong>SYNCED NOW</strong></div>'+
          '</section>'+
        '</div>'+

        '<div class="ocr-right">'+
          '<section class="ocr-panel"><div class="ocr-panel-head"><div><h3>Live Rooms</h3><p>Join a room already in motion.</p></div><span class="ocr-chip">'+calls.length+' active</span></div>'+
            '<div class="ocr-room-grid">'+
              (calls.length ? calls.slice(0,8).map((c,i)=>'<div class="ocr-room"><div class="room-top"><i class="room-live"></i><strong>#'+esc(c.channelName||"Live room")+'</strong></div><span>'+esc((c.mode==="voice"?"Voice":"Video")+" · "+((c.participants||[]).length||0)+" participants")+'</span><button class="ocr-mini primary" data-ocr-room="'+i+'">Join room</button></div>').join("") :
              '<div class="ocr-empty" style="grid-column:1/-1">No live rooms yet. Start a voice or video session from the Command Deck.</div>')+
            '</div>'+
          '</section>'+

          '<section class="ocr-panel"><div class="ocr-panel-head"><div><h3>People Now</h3><p>Your closest live layer.</p></div><span class="ocr-chip">'+people.length+' visible</span></div>'+
            '<div class="ocr-list">'+
            (people.length ? people.map(u=>'<div class="ocr-row"><div class="ocr-avatar">'+avatar(u)+'</div><div class="ocr-row-copy"><strong>'+esc(u.display_name||u.username||"Guest")+'</strong><span>'+esc(u.activity||u.status||"Online")+'</span></div><div class="ocr-row-actions"><button class="ocr-mini primary" data-ocr-dm="'+esc(u.username||"")+'">Message</button></div></div>').join("") :
              '<div class="ocr-empty">Your live people layer will appear here.</div>')+
            '</div>'+
          '</section>'+

          '<section class="ocr-panel"><div class="ocr-panel-head"><div><h3>Your Worlds</h3><p>Communities currently attached to your account.</p></div><span class="ocr-chip">'+servers.length+' connected</span></div>'+
            '<div class="ocr-communities">'+
            (servers.length ? servers.slice(0,6).map(s=>'<button class="ocr-community" data-ocr-server="'+esc(s.id)+'"><strong>'+esc(s.name)+'</strong><span>'+esc(String(s.role||"member").toUpperCase())+' · Open workspace</span></button>').join("") :
              '<div class="ocr-empty" style="grid-column:1/-1">Create or join a community to make this layer useful.</div>')+
            '</div>'+
          '</section>'+
        '</div>'+
      '</div>'+

      '<footer class="ocr-foot"><span>Signed in as <strong>'+esc(currentName)+'</strong></span><span>ORBIT command layer · interface edition</span></footer>'+
    '</div></div>';
  }

  async function load(){
    try{
      const [me, pulse, friends, dms, servers, summary] = await Promise.all([
        api("/api/me"), api("/api/pulse"), api("/api/friends"), api("/api/dms"), api("/api/servers"), api("/api/platform/summary")
      ]);
      const body = $("#page-body");
      if(!body) return;
      body.innerHTML = build({me:me.user||{},pulse,friends,dms,servers,...summary});
      wire({pulse,friends,dms,servers});
      setActive();
    }catch(e){
      console.error("ORBIT command room load failed",e);
      const body = $("#page-body");
      if(body){
        body.innerHTML = '<div class="orbit-command-room"><div class="ocr-wrap"><section class="ocr-panel"><h3>Command Room</h3><p>Unable to load the live social state right now.</p></section></div></div>';
      }
      setActive();
    }
  }

  function wire(data){
    document.querySelectorAll("[data-ocr-action]").forEach(btn=>{
      btn.onclick = async ()=>{
        const action = btn.dataset.ocrAction;
        try{
          if(action==="search"){ window.openSearchModal?.(""); return; }
          if(action==="chat"){ window.goChat?.(); return; }
          if(action==="message"){ if(data.dms?.dms?.[0]) return window.openDMFromAnywhere?.(data.dms.dms[0].id); go("dms"); return; }
          if(action==="community"){ go("discover"); return; }
          if(action==="events"){ go("events"); return; }
          if(action==="create"){ $("#new-server")?.click(); return; }
          if(action==="voice" || action==="video"){
            window.goChat?.();
            setTimeout(()=> (action==="voice" ? $("#voice-call-btn") : $("#video-call-btn"))?.click(), 260);
            return;
          }
          if(action==="owner"){ location.href="/owner.html"; return; }
        }catch(e){ console.error(e); }
      };
    });
    document.querySelectorAll("[data-ocr-room]").forEach(btn=>btn.onclick=()=>joinRoom((data.pulse.calls||[])[Number(btn.dataset.ocrRoom)]));
    document.querySelectorAll("[data-room-index]").forEach(btn=>btn.onclick=()=>joinRoom((data.pulse.calls||[])[Number(btn.dataset.roomIndex)]));
    document.querySelectorAll("[data-ocr-dm]").forEach(btn=>btn.onclick=async()=>{
      const u = btn.dataset.ocrDm;
      try{
        const d = await api("/api/dms",{method:"POST",body:JSON.stringify({username:u})});
        const id = d.dm?.id;
        if(id) window.openDMFromAnywhere?.(id);
      }catch(e){ window.orbitToast?.("Message",e.message||"Could not open conversation.","error"); }
    });
    document.querySelectorAll("[data-ocr-server]").forEach(btn=>btn.onclick=async()=>{
      try{
        const s=(data.servers?.servers||[]).find(x=>String(x.id)===String(btn.dataset.ocrServer));
        if(window.selectServer && s){ await window.selectServer(s); window.goChat?.(); }
      }catch(e){ console.error(e); }
    });
  }

  function patch(){
    const baseSetView = window.setView;
    if(typeof baseSetView==="function" && !window.__ORBIT_COMMAND_SET_VIEW_PATCHED__){
      window.__ORBIT_COMMAND_SET_VIEW_PATCHED__=true;
      window.setView=function(view){
        const result = baseSetView.apply(this, arguments);
        if(view==="home") setTimeout(load,0);
        return result;
      };
    }
    const baseRenderHome = window.renderHomePage;
    if(typeof baseRenderHome==="function" && !window.__ORBIT_COMMAND_HOME_PATCHED__){
      window.__ORBIT_COMMAND_HOME_PATCHED__=true;
      window.renderHomePage=function(){
        const result=baseRenderHome.apply(this,arguments);
        setTimeout(load,0);
        return result;
      };
    }
    if((document.body.classList.contains("orbit-discord-home") || $("#global-page")?.classList.contains("discord-home-active")) && !$("#orbit-command-room")){
      setTimeout(load,20);
    }
  }

  function boot(){
    patch();
    let tries=0;
    const timer=setInterval(()=>{
      patch();
      tries++;
      if(tries>20) clearInterval(timer);
    },350);
    const observer=new MutationObserver(()=>{
      if(document.body.classList.contains("orbit-discord-home") && !$("#orbit-command-room")){
        setTimeout(load,20);
      }
    });
    observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:["class"]});
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true}); else boot();
})();
