(() => {
  const companies = window.LANMAP_COMPANIES || [];
  const taxonomy = window.LANMAP_TAXONOMY || { sectors: [] };
  const catalog = window.LANMAP_CATALOG || [];
  const geography = window.LANMAP_MUNICIPALITIES || {};
  const salaries = window.LANMAP_SALARIES || {};
  const $ = (s) => document.querySelector(s);
  const grid = $("#companyGrid");
  const mainSearch = $("#mainSearch");
  const provinceFilter = $("#provinceFilter");
  const municipalityFilter = $("#municipalityFilter");
  const sectorFilter = $("#sectorFilter");
  const typeFilter = $("#typeFilter");
  const careerOnly = $("#careerOnly");
  const cvOnly = $("#cvOnly");
  const verifiedOnly = $("#verifiedOnly");
  const sortFilter = $("#sortFilter");
  const resultMeta = $("#resultMeta");
  const resultTitle = $("#resultTitle");
  const activeFilters = $("#activeFilters");
  const emptyState = $("#emptyState");
  let searchMode = "profession";
  let selectedConcept = null;
  const selectedGroups = new Set();
  let visibleCount = 36;
  const multi = {provinces:new Set(),municipalities:new Set(),sectors:new Set(),types:new Set()};
  const labelOf = c => c.locality ? `${c.locality} · ${c.municipality}` : c.municipality;
  const routeUrl = c => `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(($("#routeOrigin").value.trim()||"Trapagaran")+", Euskadi")}&destination=${encodeURIComponent(c.address?c.address+", "+c.municipality+", "+c.province:(c.locality||c.municipality)+", "+c.province+", España")}`;
  const mapUrl = c => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((c.address?c.name+", "+c.address:c.name+", "+(c.locality||c.municipality))+", "+c.province)}`;
  const canonicalMunicipality = name => ({"Donostia / San Sebastián":"Donostia-San Sebastián","Arrasate-Mondragon":"Arrasate/Mondragón","Abanto y Ciérvana-Abanto Zierbena":"Abanto-Zierbena","Valle de Trapaga-Trapagaran":"Trapagaran","Sopelana":"Sopela","Leintz":"Leintz-Gatzaga","Gernika":"Gernika-Lumo"}[name]||name);
  const studiesList = [...new Set(catalog.flatMap(g=>g.studies))];
  const aliases = {
    "basurero":["residuos","recogida de residuos"],"barrendero":["limpieza viaria"],
    "basura":["residuos"],"policia":["policia local","ertzaina"],
    "tienda de ropa":["dependiente","ropa","comercio"],"atencion al publico":["dependiente","comercio","recepcion"],
    "cajero":["tienda","supermercado"],"reponedor":["tienda","supermercado"]
  };

  let saved = JSON.parse(localStorage.getItem("lanmap_saved") || "{}");

  const normalize = (v="") => v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const initials = name => name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase();

  function relevance(company, q) {
    if(selectedGroups.size) return [...selectedGroups].some(name=>catalog.find(g=>g.name===name)?.sectors.includes(company.sector))?15:0;
    if (!q) return 1;
    const nq = normalize(q).replace(/^(grado (superior|medio) en |grado en |fp (gm|gs|en) )/, "").replace(/peluquerias/g,"peluqueria").replace(/talleres/g,"taller").trim();
    if(!nq)return 0;
    if(selectedConcept){
      const {group,kind,label}=selectedConcept;
      const family=catalog.find(x=>x.name===group);
      if(selectedConcept.general)return family?.sectors.includes(company.sector)?15:0;
      const hay=normalize([company.name,company.sector,...company.profiles,...company.studies].join(" "));
      const exact=normalize(label).replace(/^(fp (gm|gs) |grado en |master en |certificado profesional de )/,"");
      const terms=[exact,...(aliases[normalize(label)]||[])];
      const match=terms.some(t=>t.length>3&&hay.includes(t));
      return (match?15:0) + (family?.sectors.includes(company.sector)?3:0);
    }
    if(searchMode==="studies") {
      const words=nq.split(/\s+/).filter(x=>x.length>4);
      return company.studies.reduce((score,study)=>{
        const text=normalize(study);
        return score + (text.includes(nq)||nq.includes(text)||(words.length>0&&words.every(x=>text.includes(x)))?12:0);
      },0);
    }
    let score = 0;
    if (normalize(company.name).includes(nq)) score += 12;
    if (normalize(company.sector).includes(nq)) score += 9;
    company.profiles.forEach(p => {
      const np = normalize(p);
      if (np.includes(nq) || nq.includes(np)) score += 8;
      nq.split(/\s+/).forEach(word => { if(word.length > 2 && np.includes(word)) score += 2; });
    });
    company.studies.forEach(s => {
      const ns = normalize(s);
      if (ns.includes(nq) || nq.includes(ns)) score += 7;
      nq.split(/\s+/).forEach(word => { if(word.length > 2 && ns.includes(word)) score += 1; });
    });
    if (normalize(company.description).includes(nq)) score += 3;
    if (normalize(labelOf(company)).includes(nq)) score += 6;
    const hay=normalize([company.name,company.sector,...company.profiles,...company.studies].join(" "));
    for(const [term,alternatives] of Object.entries(aliases)) if(nq.includes(term)) alternatives.forEach(a=>{if(hay.includes(a))score+=8});
    return score;
  }

  function populateStaticFilters() {
    const sectors = [...new Set([...companies.map(c=>c.sector),...catalog.flatMap(g=>g.sectors)])].sort((a,b)=>a.localeCompare(b,"es"));
    sectorFilter.innerHTML += sectors.map(s=>`<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
    $("#orgStat").textContent = companies.length + "+";
    $("#sectorStat").textContent = catalog.length;
    renderMultiFilters();
    updateMunicipalities();
  }

  function choice(value,kind,label=value){return `<label class="multi-choice"><input type="checkbox" data-multi="${kind}" value="${escapeHtml(value)}" ${multi[kind].has(value)?"checked":""}><span>${escapeHtml(label)}</span></label>`}
  function renderMultiFilters(){
    $("#provinceChoices").innerHTML=["Bizkaia","Gipuzkoa","Álava"].map(x=>choice(x,"provinces")).join("");
    $("#typeChoices").innerHTML=["Empresa privada","Organismo público","Centro tecnológico","Cooperativa","Negocio local"].map(x=>choice(x,"types")).join("");
    const listed=new Set(catalog.flatMap(g=>g.sectors));
    const extra=[...new Set(companies.map(c=>c.sector))].filter(x=>!listed.has(x)).sort((a,b)=>a.localeCompare(b,"es"));
    $("#sectorChoices").innerHTML=catalog.map((g,i)=>`<details class="sector-group"><summary>${escapeHtml(g.name)}</summary><label class="multi-choice group-all"><input type="checkbox" data-group-index="${i}"><span>Todo ${escapeHtml(g.name)}</span></label>${g.sectors.map(s=>choice(s,"sectors")).join("")}</details>`).join("")+(extra.length?`<details class="sector-group"><summary>Otros sectores</summary>${extra.map(s=>choice(s,"sectors")).join("")}</details>`:"");
    bindMulti(); updateMultiLabels();
  }
  function bindMulti(){
    document.querySelectorAll("[data-multi]").forEach(input=>input.onchange=()=>{
      const set=multi[input.dataset.multi];input.checked?set.add(input.value):set.delete(input.value);
      document.querySelectorAll(`[data-multi="${input.dataset.multi}"]`).forEach(other=>other.checked=set.has(other.value));
      if(input.dataset.multi==="provinces")updateMunicipalities();
      updateMultiLabels();visibleCount=36;render();
    });
    document.querySelectorAll("[data-group-index]").forEach(input=>input.onchange=()=>{
      catalog[Number(input.dataset.groupIndex)].sectors.forEach(s=>input.checked?multi.sectors.add(s):multi.sectors.delete(s));
      document.querySelectorAll('[data-multi="sectors"]').forEach(child=>child.checked=multi.sectors.has(child.value));
      updateMultiLabels();visibleCount=36;render();
    });
  }
  function updateMultiLabels(){
    const labels={provinces:["provinceSummary","Todo Euskadi"],municipalities:["municipalitySummary","Todos los municipios"],sectors:["sectorSummary","Todos los sectores"],types:["typeSummary","Todos los tipos"]};
    for(const [kind,[id,empty]] of Object.entries(labels)) $("#"+id).textContent=multi[kind].size?`${multi[kind].size} seleccionados · ${[...multi[kind]].slice(0,2).join(", ")}${multi[kind].size>2?"…":""}`:empty;
    document.querySelectorAll("[data-group-index]").forEach(input=>{
      const sectors=catalog[Number(input.dataset.groupIndex)].sectors;
      const count=sectors.filter(s=>multi.sectors.has(s)).length;
      input.checked=count===sectors.length;input.indeterminate=count>0&&count<sectors.length;
    });
    document.querySelectorAll("[data-explore-sector-group]").forEach(input=>{
      const sectors=catalog[Number(input.dataset.exploreSectorGroup)].sectors;
      const count=sectors.filter(s=>multi.sectors.has(s)).length;
      input.checked=count===sectors.length;input.indeterminate=count>0&&count<sectors.length;
    });
  }

  function updateMunicipalities() {
    const provinces=multi.provinces;
    const municipalities = [...new Set([...Object.entries(geography).filter(([p])=>!provinces.size||provinces.has(p)).flatMap(([,v])=>v).map(canonicalMunicipality),...companies.filter(c=>!provinces.size||provinces.has(c.province)).flatMap(c=>c.locality ? [c.municipality, c.locality] : [c.municipality])])]
      .sort((a,b)=>a.localeCompare(b,"es"));
    municipalityFilter.innerHTML = `<option value="">Todos los municipios</option>` +
      municipalities.map(m=>`<option value="${escapeHtml(m)}">${escapeHtml(m === "Gallarta" ? "Gallarta (Abanto-Zierbena)" : m)}</option>`).join("");
    for(const m of multi.municipalities)if(!municipalities.includes(m))multi.municipalities.delete(m);
    $("#municipalityChoices").innerHTML=municipalities.map(m=>choice(m,"municipalities",m==="Gallarta"?"Gallarta (Abanto-Zierbena)":m)).join("");
    bindMulti();updateMultiLabels();filterMunicipalityChoices();
  }
  function filterMunicipalityChoices(){
    const q=normalize($("#municipalitySearch").value.trim());
    document.querySelectorAll('#municipalityChoices .multi-choice').forEach(label=>label.hidden=!!q&&!normalize(label.textContent).includes(q));
  }

  function getFiltered() {
    const q = mainSearch.value.trim();
    let arr = companies.map(c=>({...c,_score:relevance(c,q)}));

    if (q || selectedConcept || selectedGroups.size) arr = arr.filter(c=>c._score>0);
    if (provinceFilter.value) arr = arr.filter(c=>c.province===provinceFilter.value);
    if (municipalityFilter.value) arr = arr.filter(c=>c.municipality===municipalityFilter.value || c.locality===municipalityFilter.value);
    if (sectorFilter.value) arr = arr.filter(c=>c.sector===sectorFilter.value);
    if (typeFilter.value) arr = arr.filter(c=>c.type===typeFilter.value);
    if(multi.provinces.size)arr=arr.filter(c=>multi.provinces.has(c.province));
    if(multi.municipalities.size)arr=arr.filter(c=>multi.municipalities.has(c.municipality)||multi.municipalities.has(c.locality));
    if(multi.sectors.size)arr=arr.filter(c=>multi.sectors.has(c.sector));
    if(multi.types.size)arr=arr.filter(c=>multi.types.has(c.type));
    if (careerOnly.checked) arr = arr.filter(c=>!!c.careers);
    if (cvOnly.checked) arr = arr.filter(c=>c.acceptsCv);
    if (verifiedOnly.checked) arr = arr.filter(c=>c.verified);

    const sort = sortFilter.value;
    if (sort==="name") arr.sort((a,b)=>a.name.localeCompare(b.name,"es"));
    else if (sort==="career") arr.sort((a,b)=>(+!!b.careers)-(+!!a.careers) || b._score-a._score || a.name.localeCompare(b.name,"es"));
    else if (sort==="location") arr.sort((a,b)=>labelOf(a).localeCompare(labelOf(b),"es") || a.name.localeCompare(b.name,"es"));
    else if (sort==="rating") arr.sort((a,b)=>(b.rating??-1)-(a.rating??-1) || b._score-a._score);
    else if (sort==="reviews") arr.sort((a,b)=>(b.reviewCount??-1)-(a.reviewCount??-1) || b._score-a._score);
    else arr.sort((a,b)=>b._score-a._score || (+b.verified)-(+a.verified) || a.name.localeCompare(b.name,"es"));

    return arr;
  }

  function render() {
    const arr = getFiltered();
    const q = mainSearch.value.trim();
    resultTitle.textContent = q ? `Resultados para “${q}”` : selectedConcept ? `Resultados para “${selectedConcept.label}”` : selectedGroups.size?`Resultados para ${[...selectedGroups].join(" + ")}`:"Lugares donde podrías trabajar";
    resultMeta.textContent = `${arr.length} resultado${arr.length===1?"":"s"} · ${arr.filter(c=>c.type!=="Organismo público").length} empresas o negocios · Directorio parcial.`;
    grid.innerHTML = arr.slice(0,visibleCount).map(cardHtml).join("");
    $("#showMore").hidden=arr.length<=visibleCount;
    emptyState.hidden = arr.length > 0;
    $("#emptyMessage").textContent=municipalityFilter.value||multi.municipalities.size?"Aún no hay fichas de este perfil en las localidades elegidas. Prueba otra zona o consulta los portales oficiales.":"Prueba otra profesión, elimina filtros o explora otro sector. El catálogo de ideas es más amplio que las empresas cargadas.";
    renderActiveFilters();
    bindCardEvents();
    updateSavedCount();
    renderComparison();
  }

  function cardHtml(c) {
    const isSaved = !!saved[c.id];
    const cls = c.type==="Organismo público" ? "public" : "";
    const tags = c.profiles.slice(0,4).map(p=>`<span>${escapeHtml(cap(p))}</span>`).join("");
    const rating = c.rating == null
      ? `<span class="rating-pill unavailable">Google: sin conectar</span>`
      : `<span class="rating-pill">★ ${c.rating} · ${c.reviewCount||0} reseñas</span>`;
    return `<article class="company-card" data-id="${c.id}">
      <div class="card-top">
        <div class="org-logo">${initials(c.name)}</div>
      <div class="org-info"><h3>${escapeHtml(c.name)}</h3><div class="org-meta">${escapeHtml(labelOf(c))} · ${escapeHtml(c.province)}</div></div>
        <button class="save-heart ${isSaved?"saved":""}" data-save="${c.id}" title="Guardar">${isSaved?"♥":"♡"}</button>
      </div>
      <div class="badges">
        <span class="badge ${cls}">${escapeHtml(c.type)}</span>
        <span class="badge">${escapeHtml(c.sector)}</span>
        ${c.verified?`<span class="badge verified">✓ verificado</span>`:""}
      </div>
      <p>${escapeHtml(c.description)}</p>
      <div class="profile-tags">${tags}</div>
      <div class="rating-row">${rating}</div>
      <div class="card-actions">
        ${c.careers?`<a class="primary-link" href="${safeUrl(c.careers)}" target="_blank" rel="noopener">Empleo ↗</a>`:c.website?`<a class="primary-link" href="${safeUrl(c.website)}" target="_blank" rel="noopener">Web ↗</a>`:c.sourceUrl?`<a class="primary-link" href="${safeUrl(c.sourceUrl)}" target="_blank" rel="noopener">Ficha externa ↗</a>`:""}
        <a class="route-link" href="${escapeHtml(routeUrl(c))}" target="_blank" rel="noopener" title="Consulta el trayecto en Google Maps">Trayecto ↗</a>
        <button class="details-btn" data-details="${c.id}">Ver ficha</button>
      </div>
    </article>`;
  }

  function renderActiveFilters() {
    const chips = [];
    const q = mainSearch.value.trim();
    if(q) chips.push(q);
    if(selectedConcept && !q) chips.push(selectedConcept.label);
    selectedGroups.forEach(g=>chips.push(g));
    [provinceFilter.value, municipalityFilter.value, sectorFilter.value, typeFilter.value,...Object.values(multi).flatMap(set=>[...set])].filter(Boolean).forEach(x=>chips.push(x));
    if(careerOnly.checked) chips.push("Con empleo");
    if(cvOnly.checked) chips.push("Acepta CV");
    if(verifiedOnly.checked) chips.push("Verificados");
    activeFilters.innerHTML = chips.slice(0,8).map(c=>`<span class="filter-chip">${escapeHtml(c)}</span>`).join("")+(chips.length>8?`<span class="filter-chip">+${chips.length-8} más</span>`:"");
  }

  function bindCardEvents() {
    document.querySelectorAll("[data-save]").forEach(btn=>btn.onclick=()=>toggleSave(btn.dataset.save));
    document.querySelectorAll("[data-details]").forEach(btn=>btn.onclick=()=>openModal(btn.dataset.details));
  }

  function toggleSave(id) {
    if(saved[id]) delete saved[id];
    else saved[id] = {status:"Pendiente"};
    localStorage.setItem("lanmap_saved", JSON.stringify(saved));
    render();
    renderSaved();
  }

  function updateSavedCount() {
    $("#savedCount").textContent = Object.keys(saved).length;
  }

  function renderSaved() {
    const list = $("#savedList");
    const ids = Object.keys(saved);
    if(!ids.length) {
      list.innerHTML = `<div class="empty-state" style="padding:35px 14px"><h3>Aún no has guardado ninguna</h3><p>Usa el corazón de una ficha para crear tu lista.</p></div>`;
      return;
    }
    list.innerHTML = ids.map(id=>{
      const c=companies.find(x=>x.id===id); if(!c) return "";
      const state=saved[id].status || "Pendiente";
      return `<div class="saved-item"><b>${escapeHtml(c.name)}</b><small>${escapeHtml(c.municipality)} · ${escapeHtml(c.sector)}</small>
        <select class="status-select" data-status="${id}">
          ${["Pendiente","CV enviado","Me han llamado","Entrevista","Descartado"].map(s=>`<option ${s===state?"selected":""}>${s}</option>`).join("")}
        </select></div>`;
    }).join("");
    document.querySelectorAll("[data-status]").forEach(sel=>sel.onchange=()=>{
      saved[sel.dataset.status].status=sel.value;
      localStorage.setItem("lanmap_saved", JSON.stringify(saved));
    });
  }

  function renderComparison(){
    const ids=Object.keys(saved).filter(id=>companies.some(c=>c.id===id));
    const target=$("#comparisonGrid");
    if(!ids.length){target.innerHTML="<p>Guarda dos o más organizaciones para compararlas aquí.</p>";return}
    target.innerHTML=`<table class="comparison-table"><thead><tr><th>Organización</th><th>Zona</th><th>Sueldo anunciado (€ brutos/año)</th><th>Horario / turnos</th><th>Contrato</th><th>Trayecto</th></tr></thead><tbody>${ids.map(id=>{
      const c=companies.find(x=>x.id===id), note=saved[id];
      return `<tr><th scope="row">${escapeHtml(c.name)}</th><td>${escapeHtml(c.municipality)}</td><td><input type="number" min="0" step="100" data-compare="pay" data-company="${escapeHtml(id)}" value="${escapeHtml(note.pay||"")}" placeholder="Sin dato" aria-label="Sueldo de ${escapeHtml(c.name)}"></td><td><input data-compare="schedule" data-company="${escapeHtml(id)}" value="${escapeHtml(note.schedule||"")}" placeholder="Sin dato" aria-label="Horario de ${escapeHtml(c.name)}"></td><td><input data-compare="contract" data-company="${escapeHtml(id)}" value="${escapeHtml(note.contract||"")}" placeholder="Sin dato" aria-label="Contrato de ${escapeHtml(c.name)}"></td><td><a href="${escapeHtml(routeUrl(c))}" target="_blank" rel="noopener">Ver ruta ↗</a></td></tr>`;
    }).join("")}</tbody></table>`;
    document.querySelectorAll("[data-compare]").forEach(input=>input.onchange=()=>{
      const id=input.dataset.company,field=input.dataset.compare;
      if(saved[id]){saved[id][field]=input.value.slice(0,100);localStorage.setItem("lanmap_saved",JSON.stringify(saved))}
    });
  }

  function openModal(id) {
    const c=companies.find(x=>x.id===id); if(!c) return;
    $("#modalContent").innerHTML = `
      <span class="eyebrow small">${escapeHtml(c.type)} · ${escapeHtml(c.sector)}</span>
      <h2>${escapeHtml(c.name)}</h2>
      <div class="modal-location">${escapeHtml(labelOf(c))} · ${escapeHtml(c.province)}</div>
      <div class="modal-section"><h4>Ubicación y contacto</h4><p>${c.address?escapeHtml(c.address+", "+c.municipality):"Dirección exacta pendiente: la ficha solo indica municipio."} ${c.careers?"Tiene enlace a empleo.":c.website?"Consulta el contacto en la web de la organización.":"Consulta la fuente de la ficha para localizar sus canales de contacto."}</p><small>${c.sourceCheckedAt?"Fuente consultada: "+escapeHtml(c.sourceCheckedAt.split("-").reverse().join("/")):"Fecha de revisión pendiente"} · ${c.verified?"Enlace verificado":"Enlace sin verificación individual"}</small></div>
      <div class="modal-section"><h4>Por qué puede interesarte</h4><p>${escapeHtml(c.description)}</p></div>
      <div class="modal-section"><h4>Perfiles relacionados</h4><div class="profile-tags">${c.profiles.map(p=>`<span>${escapeHtml(cap(p))}</span>`).join("")}</div></div>
      <div class="modal-section"><h4>Estudios relacionados</h4><div class="profile-tags">${c.studies.map(s=>`<span>${escapeHtml(s)}</span>`).join("")}</div></div>
      <div class="modal-section"><h4>¿Encajas con estos estudios?</h4><p>Estos estudios y puestos son relaciones orientativas del directorio. Revisa los requisitos, experiencia e idiomas de cada oferta antes de solicitarla.</p></div>
      <div class="modal-section"><h4>Reseñas de Google</h4><div class="google-note">Esta beta no inventa ni copia reseñas. El filtro queda preparado para conectarse a Google Places API a través de un backend autorizado.</div></div>
      <div class="modal-links">
        ${c.website?`<a href="${safeUrl(c.website)}" target="_blank" rel="noopener">Web propia ↗</a>`:""}
        ${c.careers?`<a class="secondary" href="${safeUrl(c.careers)}" target="_blank" rel="noopener">Portal de empleo ↗</a>`:""}
        ${c.sourceUrl?`<a class="secondary" href="${safeUrl(c.sourceUrl)}" target="_blank" rel="noopener">Fuente de la ficha ↗</a>`:""}
        <a class="secondary" href="${escapeHtml(mapUrl(c))}" target="_blank" rel="noopener">Ver en el mapa ↗</a>
        <a class="secondary" href="${escapeHtml(routeUrl(c))}" target="_blank" rel="noopener">Calcular trayecto ↗</a>
      </div><div class="modal-section"><button type="button" class="feature-button" id="correctCompany">Proponer una corrección</button><div id="correctionPanel" hidden><p>Escribe el dato correcto y descarga la propuesta. LanMap aún no dispone de un buzón para recibirla directamente.</p><label for="correctionKind">Qué quieres corregir</label><select id="correctionKind"><option>Dirección</option><option>Web o contacto</option><option>Sector o puestos</option><option>La organización ha cerrado</option><option>Otro dato</option></select><label for="correctionText">Detalle y fuente</label><textarea id="correctionText" rows="4" maxlength="1000" placeholder="Indica el dato correcto y dónde se puede comprobar"></textarea><button type="button" class="feature-button" id="downloadCorrection">Descargar propuesta</button><p id="correctionStatus" role="status"></p></div></div>`;
    $("#correctCompany").onclick=()=>{$("#correctionPanel").hidden=false;$("#correctionText").focus()};
    $("#downloadCorrection").onclick=()=>{
      const detail=$("#correctionText").value.trim();
      if(detail.length<10){$("#correctionStatus").textContent="Explica la corrección con al menos 10 caracteres.";return}
      const report={companyId:c.id,company:c.name,kind:$("#correctionKind").value,detail,createdAt:new Date().toISOString(),sourceUrl:c.sourceUrl||null};
      const blob=new Blob([JSON.stringify(report,null,2)],{type:"application/json"});const objectUrl=URL.createObjectURL(blob);
      const link=document.createElement("a");link.href=objectUrl;link.download=`correccion-lanmap-${c.id}.json`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);
      $("#correctionStatus").textContent="Propuesta descargada. Compártela con quien gestione LanMap para que pueda revisar la ficha.";
    };
    $("#modalBackdrop").hidden=false;
    $("#companyModal").classList.add("open");
    $("#companyModal").setAttribute("aria-hidden","false");
  }

  function closeModal(){
    $("#modalBackdrop").hidden=true;
    $("#companyModal").classList.remove("open");
    $("#companyModal").setAttribute("aria-hidden","true");
  }

  function clearAll(){
    selectedConcept=null;selectedGroups.clear();visibleCount=36;
    document.querySelectorAll('[data-explore-general]').forEach(input=>input.checked=false);
    mainSearch.value="";
    provinceFilter.value="";
    updateMunicipalities();
    municipalityFilter.value="";
    sectorFilter.value="";
    typeFilter.value="";
    careerOnly.checked=false; cvOnly.checked=false; verifiedOnly.checked=false;
    sortFilter.value="relevance";
    Object.values(multi).forEach(set=>set.clear());
    $("#municipalitySearch").value="";
    renderMultiFilters();updateMunicipalities();
    render();
  }

  function openDrawer(){
    renderSaved();
    $("#drawerBackdrop").hidden=false;
    $("#savedDrawer").classList.add("open");
    $("#savedDrawer").setAttribute("aria-hidden","false");
  }
  function closeDrawer(){
    $("#drawerBackdrop").hidden=true;
    $("#savedDrawer").classList.remove("open");
    $("#savedDrawer").setAttribute("aria-hidden","true");
  }

  function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
  function renderResources(){
    const portals=[
      ["Gobierno Vasco", "Administración, educación y otros cuerpos", "https://www.euskadi.eus/empleo-publico/"],
      ["Osakidetza", "Sanidad: OPE y contratación temporal", "https://www.osakidetza.euskadi.eus/oferta-de-empleo-publico/webosk00-oskcon/es/"],
      ["Policía del País Vasco", "Ertzaintza y policía local", "https://www.arkauteakademia.euskadi.eus/lfr/es/web/avpe/noticias-de-la-academia"],
      ["Bomberos de Bizkaia", "Convocatorias de la Diputación", "https://www.bizkaia.eus/Herri_Administrazioa/ope/convocatoria.asp?Idioma=CA&id=2048&tipo=ini"],
      ["Bomberos de Gipuzkoa", "Convocatorias forales", "https://egoitza.gipuzkoa.eus/WAS/CORP/LLEHautaketaProzesuakWEB/concursos?locale=es"],
      ["Bomberos de Álava", "Portal de empleo foral", "https://suhiltzaileak.araba.eus/es/portal-de-empleo"],
      ["Donostia", "Empleo del ayuntamiento", "https://www.donostia.eus/app/info/OfertadeEmpleo.nsf/frmOferta?ReadForm=&id=&idioma=cas&ord=1&sf=1"],
      ["Gipuzkoa", "Procesos de la Diputación", "https://egoitza.gipuzkoa.eus/WAS/CORP/LLEHautaketaProzesuakWEB/concursos?locale=es"],
      ["Administración General del Estado", "Convocatorias e inscripción", "https://administracion.gob.es/pag_Home/empleoPublico/ips.html"]
    ];
    $("#oppositionGrid").innerHTML=portals.map(([name,detail,url])=>`<a href="${safeUrl(url)}" target="_blank" rel="noopener" class="resource-card"><b>${escapeHtml(name)}</b><span>${escapeHtml(detail)}</span><strong>Ver portal oficial ↗</strong></a>`).join("");
    const labels={energia:"Energía",finanzas:"Banca y seguros",informacion:"Información y comunicaciones",manufactura:"Industria manufacturera",agua:"Agua y residuos",administracion:"Administración pública",profesional:"Servicios profesionales",educacion:"Educación",sanidad:"Sanidad y servicios sociales",construccion:"Construcción",transporte:"Transporte y almacenamiento",comercio:"Comercio y reparación",administrativos:"Servicios administrativos",inmobiliaria:"Actividades inmobiliarias",otros:"Otros servicios",artes:"Arte y ocio",hosteleria:"Hostelería"};
    $("#salaryGrid").innerHTML=Object.entries(labels).sort((a,b)=>salaries[b[0]]-salaries[a[0]]).map(([key,label])=>`<div class="salary-item"><span>${escapeHtml(label)}</span><strong>${Math.round(salaries[key]).toLocaleString("es-ES")} €</strong></div>`).join("");
  }
  function setMode(mode){
    searchMode=mode; selectedConcept=null;selectedGroups.clear();mainSearch.value="";updateMultiLabels();
    document.querySelectorAll("[data-mode]").forEach(b=>{b.classList.toggle("active",b.dataset.mode===mode);b.setAttribute("aria-selected",String(b.dataset.mode===mode))});
    const studies=mode==="studies";
    $("#searchLabel").textContent=studies?"¿Qué has estudiado?":mode==="sectors"?"Elige un sector y luego afina por zona":"¿De qué quieres trabajar?";
    $(".search-row").hidden=mode==="sectors";
    mainSearch.placeholder=studies?"Ej. Grado Superior en Automatización y Robótica Industrial":"Ej. programador PLC, peluquero, mecánico...";
    $("#searchSuggestions").innerHTML=studies?studiesList.map(s=>`<option value="${escapeHtml(s)}">`).join(""):"";
    $("#quickTags").hidden=mode!=="profession";
    $("#sectorExplorer").hidden=mode!=="sectors";
    $("#conceptExplorer").hidden=mode==="sectors";
    $("#sectorExplorer").innerHTML=catalog.map((g,i)=>`<details><summary>${escapeHtml(g.name)} <small>${g.sectors.length} subsectores</small></summary><label class="explorer-all"><input type="checkbox" data-explore-sector-group="${i}"> Marcar todo ${escapeHtml(g.name)}</label><div class="sector-buttons">${g.sectors.map(s=>`<button type="button" data-sector="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join("")}</div></details>`).join("");
    const key=studies?"studies":"occupations";
    $("#conceptExplorer").innerHTML=catalog.map((g,i)=>`<details><summary>${escapeHtml(g.name)} <small>${g[key].length} ideas</small></summary><label class="explorer-all"><input type="checkbox" data-explore-general="${i}"> Marcar ${escapeHtml(g.name)} en general</label><div class="sector-buttons">${g[key].map(s=>`<button type="button" data-concept="${escapeHtml(s)}" data-group="${escapeHtml(g.name)}">${escapeHtml(s)}</button>`).join("")}</div></details>`).join("");
    $("#catalogLinks").innerHTML=studies?`Catálogos oficiales completos: <a href="https://www.todofp.es/que-estudiar/app-soyfp.html" target="_blank" rel="noopener">Formación Profesional ↗</a> · <a href="https://siiu.universidades.gob.es/QEDU/" target="_blank" rel="noopener">Grados universitarios ↗</a>`:mode==="profession"?`Más ocupaciones: <a href="https://www.sepe.es/HomeSepe/es/que-es-observatorio/informacion-mt-por-ocupacion.html" target="_blank" rel="noopener">Buscador oficial del SEPE ↗</a>`:"";
    document.querySelectorAll("[data-concept]").forEach(b=>b.onclick=()=>{selectedGroups.clear();document.querySelectorAll('[data-explore-general]').forEach(input=>input.checked=false);selectedConcept={label:b.dataset.concept,group:b.dataset.group,kind:key};mainSearch.value=b.dataset.concept;visibleCount=36;render();$("#explorar").scrollIntoView()});
    document.querySelectorAll("[data-sector]").forEach(b=>b.onclick=()=>{multi.sectors.add(b.dataset.sector);document.querySelectorAll('[data-multi="sectors"]').forEach(input=>input.checked=multi.sectors.has(input.value));updateMultiLabels();render();$("#explorar").scrollIntoView()});
    document.querySelectorAll("[data-explore-sector-group]").forEach(input=>input.onchange=()=>{catalog[Number(input.dataset.exploreSectorGroup)].sectors.forEach(s=>input.checked?multi.sectors.add(s):multi.sectors.delete(s));document.querySelectorAll('[data-multi="sectors"]').forEach(child=>child.checked=multi.sectors.has(child.value));updateMultiLabels();visibleCount=36;render();$("#explorar").scrollIntoView()});
    document.querySelectorAll("[data-explore-general]").forEach(input=>input.onchange=()=>{const name=catalog[Number(input.dataset.exploreGeneral)].name;input.checked?selectedGroups.add(name):selectedGroups.delete(name);selectedConcept=null;mainSearch.value="";visibleCount=36;render();$("#explorar").scrollIntoView()});
    updateMultiLabels();
    render();
  }
  function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
  function safeUrl(u=""){try{const x=new URL(u);return ["http:","https:"].includes(x.protocol)?x.href:"#"}catch{return "#"}}

  [municipalityFilter, sectorFilter, typeFilter, careerOnly, cvOnly, verifiedOnly, sortFilter].forEach(el=>el.addEventListener("input",render));
  $("#routeOrigin").value=localStorage.getItem("lanmap_route_origin")||"";
  $("#routeOrigin").addEventListener("input",()=>{localStorage.setItem("lanmap_route_origin",$("#routeOrigin").value.trim());render()});
  $("#originSuggestions").innerHTML=Object.values(geography).flat().map(s=>`<option value="${escapeHtml(s)}">`).join("");
  mainSearch.addEventListener("input",()=>{selectedConcept=null;selectedGroups.clear();document.querySelectorAll('[data-explore-general]').forEach(input=>input.checked=false);visibleCount=36;render()});
  provinceFilter.addEventListener("input",()=>{updateMunicipalities(); render()});
  $("#municipalitySearch").addEventListener("input",filterMunicipalityChoices);
  $("#searchBtn").onclick=render;
  $("#showMore").onclick=()=>{visibleCount+=36;render()};
  document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
  document.querySelectorAll("[data-query]").forEach(btn=>btn.onclick=()=>{selectedConcept=null;selectedGroups.clear();document.querySelectorAll('[data-explore-general]').forEach(input=>input.checked=false);mainSearch.value=btn.dataset.query;render();$("#explorar").scrollIntoView()});
  $("#clearFilters").onclick=clearAll;
  $("#emptyClear").onclick=clearAll;
  $("#openSaved").onclick=openDrawer;
  $("#openCompare").onclick=closeDrawer;
  $("#closeSaved").onclick=closeDrawer;
  $("#drawerBackdrop").onclick=closeDrawer;
  $("#modalBackdrop").onclick=closeModal;
  $("#modalClose").onclick=closeModal;
  $("#mobileFilterBtn").onclick=()=>$(".filters").classList.toggle("mobile-open");
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal();closeDrawer();$(".filters").classList.remove("mobile-open")}});

  populateStaticFilters();
  setMode("profession");
  renderResources();
  render();
})();
