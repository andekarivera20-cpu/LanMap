(() => {
  const $ = selector => document.querySelector(selector);
  const companies = window.LANMAP_COMPANIES || [];
  const groups = window.LANMAP_OCCUPATION_SALARIES || [];
  const normalize = value => String(value||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const escape = value => String(value||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const url = value => { try {const u=new URL(value); return ["https:","http:"].includes(u.protocol)?u.href:""} catch{return ""} };
  const source = "https://apps.lanbide.euskadi.net/apps/OF_BUSQUEDA_OFERTAS?LG=C&ML=OFEMEN1&MS=Ea";
  const feed = "https://apps.lanbide.euskadi.net/apps/OF_OFERTAS_ODE_JSON?jsonCallback=lanmapOffersCallback";
  const money = value => Math.round(value).toLocaleString("es-ES")+" €";
  let offers = [];
  let loadedAt = null;
  let alerts = [];
  try { alerts = JSON.parse(localStorage.getItem("lanmap_alerts")||"[]"); if(!Array.isArray(alerts)) alerts=[] } catch { alerts=[] }

  function field(record, pattern) {
    for(const [key,value] of Object.entries(record||{})) {
      if(pattern.test(normalize(key).replace(/[^a-z0-9]/g,"")) && (typeof value==="string"||typeof value==="number")) return String(value).trim();
    }
    return "";
  }
  function records(payload) {
    if(Array.isArray(payload)) return payload;
    if(!payload || typeof payload!=="object") return [];
    const queue=[payload];
    while(queue.length) {
      const node=queue.shift();
      const values=Object.values(node);
      if(values.length>2&&values.every(v=>v&&typeof v==="object"&&!Array.isArray(v))) return values;
      for(const value of Object.values(node)) {
        if(Array.isArray(value)&&value.length&&typeof value[0]==="object") return value;
        if(value&&typeof value==="object"&&!Array.isArray(value)) queue.push(value);
      }
    }
    return [];
  }
  function toOffer(raw,index) {
    const title=field(raw,/^(titulo|title|puesto|nombre|denominacion|ocupacion|descripcioncorta|despuesto)$/);
    if(!title) return null;
    const municipality=field(raw,/^(municipio|localidad|poblacion|ciudad)$/);
    const province=field(raw,/^(provincia|territorio)$/);
    const date=field(raw,/^(fecha|fechapublicacion|publicacion|pubdate|date)$/);
    const rawLink=field(raw,/^(url|link|enlace|uri|urloferta|urlinscripcion)$/);
    const code=field(raw,/^(codigo|codoferta|referencia|ref|id)$/);
    const description=field(raw,/^(descripcion|description|texto|detalle)$/);
    return {id:code||rawLink||title+"|"+municipality+"|"+date+"|"+index,title,municipality,province,date,link:url(rawLink)||source,direct:!!url(rawLink),description};
  }
  function matches(offer,query,province) {
    const q=normalize(query).trim();
    const hay=normalize([offer.title,offer.description,offer.municipality].join(" "));
    return (!q || q.split(/\s+/).every(t=>hay.includes(t))) && (!province || normalize(offer.province).includes(normalize(province)) || (!offer.province && normalize(offer.municipality).includes(normalize(province))));
  }
  function renderOffers() {
    const filtered=offers.filter(o=>matches(o,$("#offerSearch").value,$("#offerProvince").value));
    $("#offerStatus").textContent=loadedAt
      ? `${filtered.length} de ${offers.length} ofertas del feed de Lanbide · consulta realizada ${loadedAt.toLocaleString("es-ES")}. Confirma su vigencia en Lanbide.`
      : "No se ha podido cargar el feed ahora mismo. Puedes buscar directamente en Lanbide o Empléate.";
    $("#liveOffers").innerHTML=filtered.slice(0,30).map(o=>`<article class="resource-card offer-card"><span class="badge verified">Lanbide · fuente oficial</span><h3>${escape(o.title)}</h3><span>${escape([o.municipality,o.province].filter(Boolean).join(" · "))}</span><small>${o.date?"Publicada: "+escape(o.date):"Fecha: consulta la fuente"}</small><a href="${escape(o.link)}" target="_blank" rel="noopener">${o.direct?"Ver oferta":"Buscar en Lanbide"} ↗</a></article>`).join("") || (loadedAt?'<p>No hay coincidencias con estos filtros.</p>':"");
  }
  function loadOffers() {
    const status=$("#offerStatus");
    status.textContent="Consultando el feed de Lanbide…";
    const old=document.querySelector("#lanmapFeedScript"); if(old) old.remove();
    let completed=false;
    const script=document.createElement("script");
    script.id="lanmapFeedScript";
    script.src=feed+"&_="+Date.now();
    const timer=setTimeout(()=>fail(),12000);
    function fail(){if(completed)return;completed=true;clearTimeout(timer);script.remove();offers=[];loadedAt=null;renderOffers();renderAlerts()}
    window.lanmapOffersCallback=payload=>{
      if(completed)return;
      completed=true;clearTimeout(timer);script.remove();
      offers=records(payload).map(toOffer).filter(Boolean);
      loadedAt=offers.length?new Date():null;
      renderOffers();renderAlerts();
    };
    script.onerror=fail;
    document.head.appendChild(script);
  }

  function saveAlerts(){localStorage.setItem("lanmap_alerts",JSON.stringify(alerts))}
  function renderAlerts() {
    $("#alertList").innerHTML=alerts.length?alerts.map((a,i)=>{
      const matching=loadedAt?offers.filter(o=>matches(o,a.query,a.province)):[];
      const newly=matching.filter(o=>!a.seen.includes(o.id));
      return `<div class="alert-item"><div><b>${escape(a.query)} · ${escape(a.province||"Todo Euskadi")}</b><small>${loadedAt?`${matching.length} coincidencias · ${newly.length} nuevas desde la última comprobación`:"Pendiente de consultar Lanbide"}</small></div><button type="button" data-alert-open="${i}">Ver</button><button type="button" data-alert-delete="${i}" aria-label="Eliminar alerta">×</button></div>`;
    }).join(""):'<p>Aún no has guardado búsquedas.</p>';
    document.querySelectorAll("[data-alert-open]").forEach(b=>b.onclick=()=>{
      const a=alerts[Number(b.dataset.alertOpen)];
      $("#offerSearch").value=a.query;$("#offerProvince").value=a.province;renderOffers();
      a.seen=offers.filter(o=>matches(o,a.query,a.province)).map(o=>o.id);saveAlerts();renderAlerts();
      $("#ofertas").scrollIntoView({behavior:"smooth"});
    });
    document.querySelectorAll("[data-alert-delete]").forEach(b=>b.onclick=()=>{alerts.splice(Number(b.dataset.alertDelete),1);saveAlerts();renderAlerts()});
  }
  $("#saveAlert").onclick=()=>{
    const query=$("#alertQuery").value.trim().slice(0,80), province=$("#alertProvince").value;
    if(!query){$("#alertQuery").focus();return}
    if(alerts.some(a=>normalize(a.query)===normalize(query)&&a.province===province))return;
    alerts.push({query,province,seen:offers.filter(o=>matches(o,query,province)).map(o=>o.id)});
    saveAlerts();renderAlerts();$("#alertQuery").value="";
  };

  const studies=[...new Set((window.LANMAP_CATALOG||[]).flatMap(g=>g.studies))];
  $("#profileSuggestions").innerHTML=studies.map(s=>`<option value="${escape(s)}">`).join("");
  function renderProfile() {
    const study=$("#profileStudy").value.trim();
    if(!study){$("#profileResults").innerHTML="<p>Escribe una titulación para ver lugares relacionados.</p>";return}
    const q=normalize(study).replace(/^(grado superior en |grado medio en |grado en |fp )/,"");
    if(!q){$("#profileResults").innerHTML="<p>Escribe el nombre completo de la titulación.</p>";return}
    const words=q.split(/\s+/).filter(w=>w.length>4);
    const matches=companies.filter(c=>c.studies.some(s=>{
      const name=normalize(s);
      return name.includes(q) || q.includes(name) || (words.length>0&&words.every(w=>name.includes(w)));
    }));
    $("#profileResults").innerHTML=`<p><strong>${matches.length}</strong> fichas relacionan «${escape(study)}» con posibles puestos. No es una comprobación de requisitos.</p>`+
      (matches.length?`<div class="resource-grid">${matches.slice(0,12).map(c=>`<article class="resource-card"><b>${escape(c.name)}</b><span>${escape(c.municipality)} · ${escape(c.sector)}</span><small>Puestos relacionados: ${escape(c.profiles.slice(0,3).join(", "))}</small><a href="${escape(url(c.careers||c.website||c.sourceUrl)||"#explorar")}" target="_blank" rel="noopener">Consultar organización ↗</a></article>`).join("")}</div>`:"<p>Prueba otro nombre de titulación o explora los ámbitos del catálogo.</p>");
  }
  $("#profileSearch").onclick=renderProfile;
  $("#profileStudy").addEventListener("keydown",e=>{if(e.key==="Enter")renderProfile()});
  $("#profileStudy").value=localStorage.getItem("lanmap_profile_study")||"";
  $("#profileStudy").addEventListener("change",()=>{localStorage.setItem("lanmap_profile_study",$("#profileStudy").value);renderProfile()});
  renderProfile();

  function renderSalary() {
    const value=normalize($("#salaryJob").value).trim();
    if(!value){$("#salaryResult").innerHTML="<p>Escribe una profesión para consultar el grupo.</p>";return}
    let group;
    if(/\b(plc|scada|automatizacion|robotica)\b/.test(value)) group=groups.find(g=>g.code==="D");
    else group=groups.find(g=>g.terms.split(" ").some(term=>term.length>3&&new RegExp(`\\b${normalize(term)}\\b`).test(value)));
    $("#salaryResult").innerHTML=group
      ?`<div class="salary-match"><span>Grupo ${group.code}: ${escape(group.name)}</span><strong>${money(group.amount)} brutos/año</strong><small>Media del grupo en España (INE, 2024). «${escape($("#salaryJob").value)}» puede pertenecer a otro grupo según las funciones concretas. No es un sueldo estimado para tu caso.</small></div>`
      :'<p>No podemos asignar esa profesión con fiabilidad. Consulta los grupos del INE y la oferta concreta.</p>';
  }
  $("#salarySearch").onclick=renderSalary;
  $("#salaryJob").addEventListener("keydown",e=>{if(e.key==="Enter")renderSalary()});
  $("#offerSearch").addEventListener("input",renderOffers);
  $("#offerProvince").addEventListener("change",renderOffers);
  $("#refreshOffers").onclick=loadOffers;
  renderAlerts();loadOffers();
})();
