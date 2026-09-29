(() => {
  const $ = selector => document.querySelector(selector);
  const catalog = window.LANMAP_CATALOG || [];
  const esc = value => String(value || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const norm = value => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const interests = [
    ["Máquinas y tecnología", [0,1,2,4,22]], ["Ayudar a personas", [8,9,10,17,23]],
    ["Ventas y atención al público", [5,6,11,19]], ["Trabajar al aire libre", [3,14,16,21]],
    ["Crear cosas", [1,7,19,20]], ["Salud y bienestar", [8,9,18,24,25]],
    ["Organizar y gestionar", [11,12,13,15,23]]
  ];
  const places = [
    ["En un taller o fábrica",[0,1,2,3]], ["En una tienda o local",[5,6,7,18]],
    ["En un centro público",[8,10,16,17,23]], ["En una oficina",[4,11,12,13,19]],
    ["En exteriores",[14,15,16,21]]
  ];
  const priorities = [
    ["Aprender una técnica",[0,1,2,3,4,22]], ["Trato con personas",[5,6,8,9,10,18]],
    ["Servicio público",[8,10,16,17,23]], ["Creatividad",[7,19,20]],
    ["Movimiento y actividad",[14,15,16,17,21]]
  ];
  function options(list, id, type) {
    $(id).innerHTML=list.map(([label], i)=>`<label><input type="${type}" name="${id.slice(1)}" value="${i}"> ${esc(label)}</label>`).join("");
  }
  options(interests,"#quizInterests","checkbox");
  options(places,"#quizPlaces","radio");
  options(priorities,"#quizPriorities","radio");
  $("#quizSubmit").onclick=()=>{
    const chosen = [...document.querySelectorAll('.quiz-grid input:checked')];
    if(!chosen.length){$("#quizResults").innerHTML='<p>Marca al menos una opción para ver ideas.</p>';return}
    const scores=catalog.map((group,index)=>({group,index,score:0}));
    for(const input of chosen){
      const list=input.name==="quizInterests"?interests:input.name==="quizPlaces"?places:priorities;
      for(const index of list[Number(input.value)][1]) if(scores[index])scores[index].score+=input.name==="quizInterests"?2:1;
    }
    const picks=scores.filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,4);
    $("#quizResults").innerHTML=picks.map(({group})=>`<article class="resource-card"><b>${esc(group.name)}</b><span>Ideas: ${group.occupations.slice(0,3).map(esc).join(", ")}.</span><span>Estudios relacionados: ${group.studies.slice(0,2).map(esc).join(", ")}.</span><button class="resource-action" type="button" data-quiz-index="${catalog.indexOf(group)}">Explorar este ámbito →</button></article>`).join("");
    document.querySelectorAll('[data-quiz-index]').forEach(button=>button.onclick=()=>{
      const group=catalog[Number(button.dataset.quizIndex)];
      document.querySelector('[data-mode="sectors"]').click();
      const input=document.querySelector(`[data-explore-sector-group="${button.dataset.quizIndex}"]`);
      if(input&&!input.checked){input.checked=true;input.dispatchEvent(new Event("change",{bubbles:true}))}
      document.querySelector("#explorar").scrollIntoView();
    });
  };

  // Entries are dated editorial selections. The original source remains authoritative.
  const courses = [
    {name:"Robótica con ABB",place:"Bilbao",start:"2026-10-05",end:"2026-11-09",hours:60,audience:"Personas ocupadas",code:"OC25483219",terms:"robotica robot industrial automatizacion",url:"https://web.lanbide.eus/apps/FR_BUSQUEDA_CURSOS"},
    {name:"Programación avanzada de robots industriales",place:"Derio",start:"2026-10-19",end:"2026-12-02",hours:80,audience:"Personas ocupadas",code:"OC25481849",terms:"robotica programacion automatizacion industria",url:"https://web.lanbide.eus/apps/FR_BUSQUEDA_CURSOS"},
    {name:"Autómatas programables básico Siemens",place:"Derio",start:"2026-10-19",end:"2026-11-16",hours:50,audience:"Personas ocupadas",code:"OC25481737",terms:"plc programador automatizacion siemens industria",url:"https://web.lanbide.eus/apps/FR_BUSQUEDA_CURSOS"},
    {name:"Visión artificial en robótica industrial",place:"Derio",start:"2026-10-19",end:"2026-10-28",hours:20,audience:"Personas ocupadas",code:"OC25481854",terms:"vision artificial robotica industria",url:"https://web.lanbide.eus/apps/FR_BUSQUEDA_CURSOS"},
    {name:"Programación básica de robots industriales",place:"Derio",start:"2026-10-19",end:"2026-11-19",hours:60,audience:"Personas ocupadas",code:"OC25481835",terms:"robot programador robotica automatizacion industria",url:"https://web.lanbide.eus/apps/FR_BUSQUEDA_CURSOS"},
    {name:"Arduino",place:"Barakaldo",start:"2026-10-28",end:"2026-11-19",hours:45,audience:"Personas ocupadas",code:"OC25481455",terms:"electronica programacion automatizacion",url:"https://web.lanbide.eus/apps/FR_BUSQUEDA_CURSOS"},
    {name:"Inglés B1",place:"Portugalete",start:"2026-10-28",end:"2027-01-23",hours:150,audience:"Personas ocupadas",code:"OC25480659",terms:"ingles idioma comercio atencion publico",url:"https://web.lanbide.eus/apps/FR_BUSQUEDA_CURSOS"},
    {name:"Programación de robot industrial ABB · iniciación",place:"Durango",start:"2026-11-02",end:"2026-11-19",hours:28,audience:"Personas ocupadas",code:"OC25480609",terms:"robotica programacion abb automatizacion industria",url:"https://web.lanbide.eus/apps/FR_BUSQUEDA_CURSOS"},
    {name:"Actividades de venta",place:"Bilbao",start:"2026-10-20",end:"2027-05-20",hours:590,audience:"Personas desempleadas",code:"25012871",terms:"ventas comercio tienda dependiente eroski atencion publico",url:"https://web.lanbide.eus/apps/FR_CURSO_DETALLADO?CTRG=1&IDRG=25012871&LG=C"},
    {name:"Atención a la clientela",place:"Vitoria-Gasteiz",start:"2026-10-16",end:"2026-11-26",hours:139,audience:"Personas desempleadas",code:"25017579",terms:"atencion publico cliente tienda comercio ventas",url:"https://web.lanbide.eus/apps/FR_CURSO_DETALLADO?CTRG=1&IDRG=25017579&LG=C"}
  ];
  const displayDate = iso => new Intl.DateTimeFormat("es-ES",{day:"2-digit",month:"2-digit",year:"numeric",timeZone:"Europe/Madrid"}).format(new Date(iso+"T12:00:00+02:00"));
  function renderCourses(){
    const q=norm($("#courseQuery").value.trim());
    const today=new Date();
    const available=courses.filter(c=>new Date(c.end+"T23:59:59+02:00")>=today).filter(c=>!q||q.split(/\s+/).every(term=>norm(c.name+" "+c.terms+" "+c.place).includes(term)));
    $("#courseResults").innerHTML=available.length?available.map(c=>`<article class="resource-card"><b>${esc(c.name)}</b><span>${esc(c.place)} · ${c.hours} horas · ${esc(c.audience)}</span><small>Del ${displayDate(c.start)} al ${displayDate(c.end)} · Referencia ${esc(c.code)}. ${new Date(c.start+"T00:00:00+02:00")<today?"Curso ya iniciado; consulta si admite incorporación.":"Comprueba si quedan plazas."}</small><a class="resource-action" href="${esc(c.url)}" target="_blank" rel="noopener">Ver ficha o buscar referencia en Lanbide ↗</a></article>`).join(""):'<p>No hay cursos de esta selección con esas palabras y fecha vigente. Consulta el buscador completo de Lanbide.</p>';
  }
  $("#courseSearch").onclick=renderCourses;
  $("#courseQuery").addEventListener("keydown",e=>{if(e.key==="Enter")renderCourses()});
  renderCourses();

  const calls=[
    {name:"Cocina y limpieza · Educación",positions:"55 plazas: 25 de cocina y 30 de limpieza",deadline:"2026-10-19T23:59:59+02:00",date:"19/10/2026",url:"https://www.euskadi.eus/ope-2026-cocina-y-limpieza/web01-a2hlang/es/"},
    {name:"Ayudantes de ejecución penal",positions:"Proceso selectivo de la Administración penitenciaria",deadline:"2026-10-01T14:00:00+02:00",date:"01/10/2026 a las 14:00",url:"https://www.euskadi.eus/noticia/2026/convocado-proceso-selectivo-para-el-acceso-a-la-escala-de-ayudantes-en-ejecucion-penal-de-la-administracion-penitenciaria/web01-sedeopec/es/"}
  ];
  const open=calls.filter(c=>new Date(c.deadline)>new Date());
  $("#currentOppositions").innerHTML=open.length?open.map(c=>`<a class="resource-card" href="${esc(c.url)}" target="_blank" rel="noopener"><b>${esc(c.name)}</b><span>${esc(c.positions)}</span><small>Solicitud hasta ${c.date}. Consulta las bases para titulación, pruebas y demás requisitos; verifica posibles cambios del plazo.</small><strong>Bases y solicitud oficial ↗</strong></a>`).join(""):'<p>Las convocatorias fechadas que habíamos revisado ya han vencido. Consulta los portales oficiales de abajo para encontrar procesos vigentes.</p>';
})();
