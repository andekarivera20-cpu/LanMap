# LanMap Euskadi — versión ampliada

Una web estática para descubrir posibles empleadores en Euskadi por profesión, estudios, sector y territorio. Abre `index.html` o publica el contenido de esta carpeta en GitHub Pages. No requiere compilación.

## Qué incluye

- Tres entradas en portada: profesión, estudios y exploración por sectores. El catálogo propio ofrece **26 ámbitos, 203 ideas de trabajo y 160 estudios sugeridos**; los enlaces al SEPE, TodoFP y QEDU llevan a catálogos oficiales más amplios. No se presenta la selección propia como exhaustiva.
- Los desplegables de profesión y estudios permiten marcar uno o varios ámbitos generales. En sectores, cada ámbito permite seleccionar todos sus subsectores, por ejemplo **Industria y automatización**. Los filtros laterales aceptan varios territorios, municipios, sectores y tipos de organización: dentro de cada grupo se suman opciones y entre grupos se combinan condiciones. El botón «Limpiar» restablece la búsqueda.
- Orientación «No tengo claro de qué trabajar»: un cuestionario corto enlaza intereses, lugar y prioridades con cuatro ámbitos y puestos sugeridos. Es una guía editorial orientativa, no un test de aptitud.
- Filtros por los **251 municipios** de Euskadi: 112 de Bizkaia, 88 de Gipuzkoa y 51 de Álava según el directorio de Eustat consultado en septiembre de 2026. Gallarta figura adicionalmente como localidad de Abanto-Zierbena. Mostrar un municipio en el selector **no significa** que ya haya negocios privados cargados allí.
- **620 fichas**: 305 negocios locales, 37 entidades privadas/cooperativas/centros y 278 organismos públicos. Las 251 fichas municipales son ayuntamientos, no empresas privadas ni vacantes abiertas.
- Ofertas actuales: la sección consulta el conjunto de datos oficial JSONP de Lanbide al abrir la página. Si la conexión falla o cambia el formato, muestra los enlaces a Lanbide y Empléate sin mantener ofertas caducadas. Las ofertas pueden no indicar el nombre de la empresa, por lo que no se atribuyen automáticamente a fichas concretas.
- Orientación por estudios: relaciona titulaciones con fichas y puestos sugeridos; no verifica que la persona cumpla los requisitos de una oferta. Enlaces a perfiles y necesidades formativas del SEPE.
- Formación: diez cursos concretos seleccionados del buscador de Lanbide, con lugar, colectivo, duración, fechas previstas y referencia. La selección se filtra por palabras de ocupación y deja de mostrar cursos al finalizar su fecha. La inscripción, plazas y requisitos se consultan en Lanbide; la lista no es un feed completo ni en tiempo real.
- Trayectos: escribe un municipio de origen y abre Google Maps desde cada ficha para ver ruta y tiempo real. No hay filtro de 30 minutos dentro de LanMap, porque las fichas solo tienen municipio y no dirección geocodificada.
- Alertas locales: guarda profesión y territorio en este navegador. Al abrir la web con conexión se comprueba el feed y se señalan nuevas coincidencias dentro de la página. No hay notificaciones push ni avisos con la web cerrada.
- Consulta salarial por profesión: propone el grupo principal de ocupación más próximo del INE. Es una **media nacional del grupo en 2024**, no una cifra específica de PLC, bombero o dependiente. Cuando no hay equivalencia clara, no muestra una cifra.
- Paginación de resultados, orden por relevancia, nombre, municipio o presencia de portal de empleo; favoritos y estado de candidatura en el navegador.
- Comparación de fichas guardadas: zona, enlace de trayecto y notas propias de salario anunciado, horario y tipo de contrato. Las notas se guardan localmente en el navegador y no describen condiciones verificadas por LanMap.
- Cada ficha indica dirección exacta y fecha de revisión cuando existen esos datos, o muestra que están pendientes. «Proponer una corrección» descarga un archivo JSON para compartir con el responsable de la web; esta beta todavía no recibe propuestas directamente.
- Búsquedas adaptadas para barrendero, basurero, bombero, policía, tienda de ropa, atención al público y Eroski, entre otras.
- Sección separada de oposiciones: dos procesos publicados por el Gobierno Vasco y contrastados el 29/09/2026, con plazo, acceso a bases y solicitud oficial. Sus tarjetas desaparecen cuando vence el plazo guardado. También se enlazan portales públicos permanentes. No existe un feed automático de todas las convocatorias y debe revisarse la fuente antes de inscribirse.
- Sección separada de salarios: **ganancia media bruta anual por actividad económica, España, 2024**, según el INE. No son salarios iniciales por profesión ni salarios de Euskadi.
- Google Reviews permanece desactivado: no hay valoraciones copiadas ni inventadas.

## Fuentes principales

- [Municipios y enlaces de ayuntamientos — Eustat](https://eu.eustat.eus/about/links_c.html). Algunos nombres se normalizaron para coincidir con los filtros previos de LanMap. Cada ficha municipal remite al directorio, no a un portal de empleo individual.
- [Baturik Trapagaran](https://baturiktrapagaran.com/asociados/), [ABK Barakaldo](https://abkbarakaldo.com/), [Bipe](https://bipe.es/asociados/), [Ortuella Gurea](https://www.comerciosdeortuella.eus/), [Zentroan Donostia](https://zentroan.com/comercios) y [Gasteiz On](https://www.gasteizon.eus/images/2026-STORIES-ESCAPARATES-LA-BLANCA.pdf), además de las fuentes particulares enlazadas en cada ficha. Se recogieron nombres y sectores generales con descripciones redactadas para LanMap. No se copiaron reseñas.
- [Conjunto de datos de ofertas de Lanbide](https://opendata.euskadi.eus/catalogo/-/ofertas-de-empleo-de-lanbide/), actualizado a diario por su publicador. Incluye las ofertas gestionadas por Lanbide; no todas las ofertas del mercado.
- [Centros de ABB en España](https://new.abb.com/es/abb-in-spain/principales-centros), [instalaciones de Mondragon Assembly](https://www.mondragon-assembly.com/es/our-locations-2/) y [dirección oficial de Sener](https://www.sener.es/politica-privacidad/) para las cuatro nuevas fichas industriales.
- [INE, Encuesta Anual de Estructura Salarial 2024](https://www.ine.es/dyngs/Prensa/EAES2024.htm). Las cifras son medias nacionales por sección de actividad, con jornadas, puestos y antigüedades mezclados.
- [SEPE, buscador de ocupaciones](https://www.sepe.es/HomeSepe/es/que-es-observatorio/informacion-mt-por-ocupacion.html), [TodoFP](https://www.todofp.es/que-estudiar/app-soyfp.html) y [QEDU](https://siiu.universidades.gob.es/QEDU/) para ampliar el catálogo de ocupaciones y estudios.
- [Buscador de formación de Lanbide](https://web.lanbide.eus/apps/FR_BUSQUEDA_CURSOS), [curso de ventas en Bilbao](https://web.lanbide.eus/apps/FR_CURSO_DETALLADO?CTRG=1&IDRG=25012871&LG=C) y [módulo de atención al cliente en Vitoria-Gasteiz](https://web.lanbide.eus/apps/FR_CURSO_DETALLADO?CTRG=1&IDRG=25017579&LG=C). La oferta formativa cambia y las fechas indicadas son previstas.
- [OPE 2026 de Cocina y Limpieza en Educación](https://www.euskadi.eus/ope-2026-cocina-y-limpieza/web01-a2hlang/es/) y [proceso de ayudantes de ejecución penal](https://www.euskadi.eus/noticia/2026/convocado-proceso-selectivo-para-el-acceso-a-la-escala-de-ayudantes-en-ejecucion-penal-de-la-administracion-penitenciaria/web01-sedeopec/es/).
- Enlaces de empleo público desde [Euskadi.eus](https://www.euskadi.eus/empleo-publico/), [Osakidetza](https://www.osakidetza.euskadi.eus/oferta-de-empleo-publico/webosk00-oskcon/es/), [Academia de Arkaute](https://www.arkauteakademia.euskadi.eus/lfr/es/web/avpe/noticias-de-la-academia) y administraciones forales/municipales citadas en las fichas.

`website` significa web de la organización. `sourceUrl` significa ficha o fuente externa. `careers` significa enlace donde consultar empleo, sin implicar vacantes activas. `acceptsCv=false` significa que no se verificó la autocandidatura. El directorio aún es parcial y los datos locales deben revisarse periódicamente antes de uso comercial.

## Archivos

- `data/companies.js`: semilla inicial.
- `data/local-businesses.js`: negocios locales añadidos en la fase anterior.
- `data/expanded-employers.js`: municipios, entidades públicas específicas y negocios de Donostia.
- `data/municipalities.js`: nombres de los municipios.
- `data/catalog.js`: ideas agrupadas por ámbito.
- `data/salaries.js`: medias del INE por actividad.
- `data/occupation-salaries.js`: medias del INE por grupo principal de ocupación.
- `data/more-businesses.js` y `data/gasteiz-businesses.js`: fichas adicionales de Donostia y Vitoria-Gasteiz.
- `data/industrial-employers.js`: cuatro centros industriales contrastados con sus webs oficiales.
- `enhancements.js`: ofertas de Lanbide, alertas locales, perfil y consulta salarial.
- `next.js`: orientación, selección de cursos y convocatorias fechadas.
- `data/import-template.csv`: plantilla para incorporar nuevas fichas.

## Publicar en GitHub Pages

Sube el **contenido de esta carpeta** a un repositorio y habilita Pages para la rama `main` y la carpeta `/root`. La web es estática. Favoritos y estados de candidatura se guardan solo en el navegador/dispositivo de cada visitante. Las secciones de alta de empresa y valoraciones de Google requieren desarrollo adicional.
