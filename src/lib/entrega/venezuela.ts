/**
 * LA DIVISIÓN POLÍTICO-TERRITORIAL DE VENEZUELA: 24 estados y sus ciudades.
 *
 * ARCHIVO GENERADO — no se edita ciudad por ciudad a mano. La fuente es el
 * dataset público zokeber/venezuela-json (github.com/zokeber/venezuela-json),
 * la división oficial con 481 ciudades. Ajustes sobre la fuente: Distrito
 * Capital viene sin ciudades y se le puso la suya (Caracas), a Tucaní se le
 * devolvió su acento, y se agregó San Carlos del Zulia (capital del municipio
 * Colón, vecina de El Vigía), que faltaba.
 *
 * POR QUÉ EXISTE. La primera versión del selector era una lista plana de
 * pueblos escrita a mano ("una chapuza", palabras del dueño, 5 ago 2026):
 * Caños Zancudo al lado de Caracas, sin jerarquía y sin futuro. Con la
 * división real, el cliente elige estado → ciudad, y cuando un comercio de
 * Valera o de Puerto Ordaz abra su tienda, su ciudad YA está aquí esperándolo
 * — no hay que tocar código para crecer.
 *
 * Los slugs son estables y viven en la base (`depositos.zona`) y en la
 * cookie del cliente: NO se renombran. Ciudades homónimas de estados
 * distintos se desambiguan con el slug del estado (lagunillas /
 * lagunillas-zulia); el nombre visible queda limpio.
 */

export type CiudadVE = { slug: string; nombre: string };
export type EstadoVE = { slug: string; nombre: string; ciudades: CiudadVE[] };

export const VENEZUELA: EstadoVE[] = [
  {
    slug: "amazonas",
    nombre: "Amazonas",
    ciudades: [
      {
        slug: "maroa",
        nombre: "Maroa",
      },
      {
        slug: "puerto-ayacucho",
        nombre: "Puerto Ayacucho",
      },
      {
        slug: "san-fernando-de-atabapo",
        nombre: "San Fernando de Atabapo",
      },
    ],
  },
  {
    slug: "anzoategui",
    nombre: "Anzoátegui",
    ciudades: [
      {
        slug: "anaco",
        nombre: "Anaco",
      },
      {
        slug: "aragua-de-barcelona",
        nombre: "Aragua de Barcelona",
      },
      {
        slug: "barcelona",
        nombre: "Barcelona",
      },
      {
        slug: "boca-de-uchire",
        nombre: "Boca de Uchire",
      },
      {
        slug: "cantaura",
        nombre: "Cantaura",
      },
      {
        slug: "clarines",
        nombre: "Clarines",
      },
      {
        slug: "el-chaparro",
        nombre: "El Chaparro",
      },
      {
        slug: "el-pao",
        nombre: "El Pao",
      },
      {
        slug: "el-tigre",
        nombre: "El Tigre",
      },
      {
        slug: "el-tigrito",
        nombre: "El Tigrito",
      },
      {
        slug: "guanape",
        nombre: "Guanape",
      },
      {
        slug: "guanta",
        nombre: "Guanta",
      },
      {
        slug: "lecheria",
        nombre: "Lechería",
      },
      {
        slug: "onoto",
        nombre: "Onoto",
      },
      {
        slug: "pariaguan",
        nombre: "Pariaguán",
      },
      {
        slug: "piritu",
        nombre: "Píritu",
      },
      {
        slug: "puerto-la-cruz",
        nombre: "Puerto La Cruz",
      },
      {
        slug: "puerto-piritu",
        nombre: "Puerto Píritu",
      },
      {
        slug: "sabana-de-uchire",
        nombre: "Sabana de Uchire",
      },
      {
        slug: "san-mateo",
        nombre: "San Mateo",
      },
      {
        slug: "san-pablo",
        nombre: "San Pablo",
      },
      {
        slug: "san-tome",
        nombre: "San Tomé",
      },
      {
        slug: "santa-ana-de-anzoategui",
        nombre: "Santa Ana de Anzoátegui",
      },
      {
        slug: "santa-fe",
        nombre: "Santa Fe",
      },
      {
        slug: "santa-rosa",
        nombre: "Santa Rosa",
      },
      {
        slug: "soledad",
        nombre: "Soledad",
      },
      {
        slug: "urica",
        nombre: "Urica",
      },
      {
        slug: "valle-de-guanape",
        nombre: "Valle de Guanape",
      },
    ],
  },
  {
    slug: "apure",
    nombre: "Apure",
    ciudades: [
      {
        slug: "achaguas",
        nombre: "Achaguas",
      },
      {
        slug: "biruaca",
        nombre: "Biruaca",
      },
      {
        slug: "bruzual",
        nombre: "Bruzual",
      },
      {
        slug: "el-amparo",
        nombre: "El Amparo",
      },
      {
        slug: "el-nula",
        nombre: "El Nula",
      },
      {
        slug: "elorza",
        nombre: "Elorza",
      },
      {
        slug: "guasdualito",
        nombre: "Guasdualito",
      },
      {
        slug: "mantecal",
        nombre: "Mantecal",
      },
      {
        slug: "puerto-paez",
        nombre: "Puerto Páez",
      },
      {
        slug: "san-fernando-de-apure",
        nombre: "San Fernando de Apure",
      },
      {
        slug: "san-juan-de-payara",
        nombre: "San Juan de Payara",
      },
    ],
  },
  {
    slug: "aragua",
    nombre: "Aragua",
    ciudades: [
      {
        slug: "barbacoas",
        nombre: "Barbacoas",
      },
      {
        slug: "cagua",
        nombre: "Cagua",
      },
      {
        slug: "camatagua",
        nombre: "Camatagua",
      },
      {
        slug: "choroni",
        nombre: "Choroní",
      },
      {
        slug: "colonia-tovar",
        nombre: "Colonia Tovar",
      },
      {
        slug: "el-consejo",
        nombre: "El Consejo",
      },
      {
        slug: "la-victoria",
        nombre: "La Victoria",
      },
      {
        slug: "las-tejerias",
        nombre: "Las Tejerías",
      },
      {
        slug: "magdaleno",
        nombre: "Magdaleno",
      },
      {
        slug: "maracay",
        nombre: "Maracay",
      },
      {
        slug: "ocumare-de-la-costa",
        nombre: "Ocumare de La Costa",
      },
      {
        slug: "palo-negro",
        nombre: "Palo Negro",
      },
      {
        slug: "san-casimiro",
        nombre: "San Casimiro",
      },
      {
        slug: "san-mateo-aragua",
        nombre: "San Mateo",
      },
      {
        slug: "san-sebastian",
        nombre: "San Sebastián",
      },
      {
        slug: "santa-cruz-de-aragua",
        nombre: "Santa Cruz de Aragua",
      },
      {
        slug: "tocoron",
        nombre: "Tocorón",
      },
      {
        slug: "turmero",
        nombre: "Turmero",
      },
      {
        slug: "villa-de-cura",
        nombre: "Villa de Cura",
      },
      {
        slug: "zuata",
        nombre: "Zuata",
      },
    ],
  },
  {
    slug: "barinas",
    nombre: "Barinas",
    ciudades: [
      {
        slug: "barinas",
        nombre: "Barinas",
      },
      {
        slug: "barinitas",
        nombre: "Barinitas",
      },
      {
        slug: "barrancas",
        nombre: "Barrancas",
      },
      {
        slug: "calderas",
        nombre: "Calderas",
      },
      {
        slug: "capitanejo",
        nombre: "Capitanejo",
      },
      {
        slug: "ciudad-bolivia",
        nombre: "Ciudad Bolivia",
      },
      {
        slug: "el-canton",
        nombre: "El Cantón",
      },
      {
        slug: "las-veguitas",
        nombre: "Las Veguitas",
      },
      {
        slug: "libertad-de-barinas",
        nombre: "Libertad de Barinas",
      },
      {
        slug: "sabaneta",
        nombre: "Sabaneta",
      },
      {
        slug: "santa-barbara-de-barinas",
        nombre: "Santa Bárbara de Barinas",
      },
      {
        slug: "socopo",
        nombre: "Socopó",
      },
    ],
  },
  {
    slug: "bolivar",
    nombre: "Bolívar",
    ciudades: [
      {
        slug: "caicara-del-orinoco",
        nombre: "Caicara del Orinoco",
      },
      {
        slug: "canaima",
        nombre: "Canaima",
      },
      {
        slug: "ciudad",
        nombre: "Ciudad",
      },
      {
        slug: "ciudad-piar",
        nombre: "Ciudad Piar",
      },
      {
        slug: "el-callao",
        nombre: "El Callao",
      },
      {
        slug: "el-dorado",
        nombre: "El Dorado",
      },
      {
        slug: "el-manteco",
        nombre: "El Manteco",
      },
      {
        slug: "el-palmar",
        nombre: "El Palmar",
      },
      {
        slug: "el-pao-bolivar",
        nombre: "El Pao",
      },
      {
        slug: "guasipati",
        nombre: "Guasipati",
      },
      {
        slug: "guri",
        nombre: "Guri",
      },
      {
        slug: "la-paragua",
        nombre: "La Paragua",
      },
      {
        slug: "matanzas",
        nombre: "Matanzas",
      },
      {
        slug: "puerto-ordaz",
        nombre: "Puerto Ordaz",
      },
      {
        slug: "san-felix",
        nombre: "San Félix",
      },
      {
        slug: "santa-elena-de-uairen",
        nombre: "Santa Elena de Uairén",
      },
      {
        slug: "tumeremo",
        nombre: "Tumeremo",
      },
      {
        slug: "unare",
        nombre: "Unare",
      },
      {
        slug: "upata",
        nombre: "Upata",
      },
    ],
  },
  {
    slug: "carabobo",
    nombre: "Carabobo",
    ciudades: [
      {
        slug: "bejuma",
        nombre: "Bejuma",
      },
      {
        slug: "belen",
        nombre: "Belén",
      },
      {
        slug: "campo-de-carabobo",
        nombre: "Campo de Carabobo",
      },
      {
        slug: "canoabo",
        nombre: "Canoabo",
      },
      {
        slug: "central-tacarigua",
        nombre: "Central Tacarigua",
      },
      {
        slug: "chirgua",
        nombre: "Chirgua",
      },
      {
        slug: "ciudad-alianza",
        nombre: "Ciudad Alianza",
      },
      {
        slug: "el-palito",
        nombre: "El Palito",
      },
      {
        slug: "guacara",
        nombre: "Guacara",
      },
      {
        slug: "guigue",
        nombre: "Guigue",
      },
      {
        slug: "las-trincheras",
        nombre: "Las Trincheras",
      },
      {
        slug: "los-guayos",
        nombre: "Los Guayos",
      },
      {
        slug: "mariara",
        nombre: "Mariara",
      },
      {
        slug: "miranda",
        nombre: "Miranda",
      },
      {
        slug: "montalban",
        nombre: "Montalbán",
      },
      {
        slug: "moron",
        nombre: "Morón",
      },
      {
        slug: "naguanagua",
        nombre: "Naguanagua",
      },
      {
        slug: "puerto-cabello",
        nombre: "Puerto Cabello",
      },
      {
        slug: "san-joaquin",
        nombre: "San Joaquín",
      },
      {
        slug: "tocuyito",
        nombre: "Tocuyito",
      },
      {
        slug: "urama",
        nombre: "Urama",
      },
      {
        slug: "valencia",
        nombre: "Valencia",
      },
      {
        slug: "vigirimita",
        nombre: "Vigirimita",
      },
    ],
  },
  {
    slug: "cojedes",
    nombre: "Cojedes",
    ciudades: [
      {
        slug: "aguirre",
        nombre: "Aguirre",
      },
      {
        slug: "apartaderos",
        nombre: "Apartaderos",
      },
      {
        slug: "arismendi",
        nombre: "Arismendi",
      },
      {
        slug: "camuriquito",
        nombre: "Camuriquito",
      },
      {
        slug: "el-baul",
        nombre: "El Baúl",
      },
      {
        slug: "el-limon",
        nombre: "El Limón",
      },
      {
        slug: "el-pao-cojedes",
        nombre: "El Pao",
      },
      {
        slug: "el-socorro",
        nombre: "El Socorro",
      },
      {
        slug: "la-aguadita",
        nombre: "La Aguadita",
      },
      {
        slug: "las-vegas",
        nombre: "Las Vegas",
      },
      {
        slug: "libertad-de-cojedes",
        nombre: "Libertad de Cojedes",
      },
      {
        slug: "mapuey",
        nombre: "Mapuey",
      },
      {
        slug: "pinedo",
        nombre: "Piñedo",
      },
      {
        slug: "samancito",
        nombre: "Samancito",
      },
      {
        slug: "san-carlos",
        nombre: "San Carlos",
      },
      {
        slug: "sucre",
        nombre: "Sucre",
      },
      {
        slug: "tinaco",
        nombre: "Tinaco",
      },
      {
        slug: "tinaquillo",
        nombre: "Tinaquillo",
      },
      {
        slug: "vallecito",
        nombre: "Vallecito",
      },
    ],
  },
  {
    slug: "delta-amacuro",
    nombre: "Delta Amacuro",
    ciudades: [
      {
        slug: "tucupita",
        nombre: "Tucupita",
      },
    ],
  },
  {
    slug: "distrito-capital",
    nombre: "Distrito Capital",
    ciudades: [
      {
        slug: "caracas",
        nombre: "Caracas",
      },
    ],
  },
  {
    slug: "falcon",
    nombre: "Falcón",
    ciudades: [
      {
        slug: "adicora",
        nombre: "Adícora",
      },
      {
        slug: "boca-de-aroa",
        nombre: "Boca de Aroa",
      },
      {
        slug: "cabure",
        nombre: "Cabure",
      },
      {
        slug: "capadare",
        nombre: "Capadare",
      },
      {
        slug: "capatarida",
        nombre: "Capatárida",
      },
      {
        slug: "chichiriviche",
        nombre: "Chichiriviche",
      },
      {
        slug: "churuguara",
        nombre: "Churuguara",
      },
      {
        slug: "coro",
        nombre: "Coro",
      },
      {
        slug: "cumarebo",
        nombre: "Cumarebo",
      },
      {
        slug: "dabajuro",
        nombre: "Dabajuro",
      },
      {
        slug: "judibana",
        nombre: "Judibana",
      },
      {
        slug: "la-cruz-de-taratara",
        nombre: "La Cruz de Taratara",
      },
      {
        slug: "la-vela-de-coro",
        nombre: "La Vela de Coro",
      },
      {
        slug: "los-taques",
        nombre: "Los Taques",
      },
      {
        slug: "maparari",
        nombre: "Maparari",
      },
      {
        slug: "mene-de-mauroa",
        nombre: "Mene de Mauroa",
      },
      {
        slug: "mirimire",
        nombre: "Mirimire",
      },
      {
        slug: "pedregal",
        nombre: "Pedregal",
      },
      {
        slug: "piritu-falcon",
        nombre: "Píritu",
      },
      {
        slug: "pueblo-nuevo",
        nombre: "Pueblo Nuevo",
      },
      {
        slug: "puerto-cumarebo",
        nombre: "Puerto Cumarebo",
      },
      {
        slug: "punta-cardon",
        nombre: "Punta Cardón",
      },
      {
        slug: "punto-fijo",
        nombre: "Punto Fijo",
      },
      {
        slug: "san-juan-de-los-cayos",
        nombre: "San Juan de Los Cayos",
      },
      {
        slug: "san-luis",
        nombre: "San Luis",
      },
      {
        slug: "santa-ana",
        nombre: "Santa Ana",
      },
      {
        slug: "santa-cruz-de-bucaral",
        nombre: "Santa Cruz De Bucaral",
      },
      {
        slug: "tocopero",
        nombre: "Tocopero",
      },
      {
        slug: "tocuyo-de-la-costa",
        nombre: "Tocuyo de La Costa",
      },
      {
        slug: "tucacas",
        nombre: "Tucacas",
      },
      {
        slug: "yaracal",
        nombre: "Yaracal",
      },
    ],
  },
  {
    slug: "guarico",
    nombre: "Guárico",
    ciudades: [
      {
        slug: "altagracia-de-orituco",
        nombre: "Altagracia de Orituco",
      },
      {
        slug: "cabruta",
        nombre: "Cabruta",
      },
      {
        slug: "calabozo",
        nombre: "Calabozo",
      },
      {
        slug: "camaguan",
        nombre: "Camaguán",
      },
      {
        slug: "chaguaramas",
        nombre: "Chaguaramas",
      },
      {
        slug: "el-socorro-guarico",
        nombre: "El Socorro",
      },
      {
        slug: "el-sombrero",
        nombre: "El Sombrero",
      },
      {
        slug: "las-mercedes-de-los-llanos",
        nombre: "Las Mercedes de Los Llanos",
      },
      {
        slug: "lezama",
        nombre: "Lezama",
      },
      {
        slug: "onoto-guarico",
        nombre: "Onoto",
      },
      {
        slug: "ortiz",
        nombre: "Ortíz",
      },
      {
        slug: "san-jose-de-guaribe",
        nombre: "San José de Guaribe",
      },
      {
        slug: "san-juan-de-los-morros",
        nombre: "San Juan de Los Morros",
      },
      {
        slug: "san-rafael-de-laya",
        nombre: "San Rafael de Laya",
      },
      {
        slug: "santa-maria-de-ipire",
        nombre: "Santa María de Ipire",
      },
      {
        slug: "tucupido",
        nombre: "Tucupido",
      },
      {
        slug: "valle-de-la-pascua",
        nombre: "Valle de La Pascua",
      },
      {
        slug: "zaraza",
        nombre: "Zaraza",
      },
    ],
  },
  {
    slug: "lara",
    nombre: "Lara",
    ciudades: [
      {
        slug: "aguada-grande",
        nombre: "Aguada Grande",
      },
      {
        slug: "atarigua",
        nombre: "Atarigua",
      },
      {
        slug: "barquisimeto",
        nombre: "Barquisimeto",
      },
      {
        slug: "bobare",
        nombre: "Bobare",
      },
      {
        slug: "cabudare",
        nombre: "Cabudare",
      },
      {
        slug: "carora",
        nombre: "Carora",
      },
      {
        slug: "cubiro",
        nombre: "Cubiro",
      },
      {
        slug: "cuji",
        nombre: "Cují",
      },
      {
        slug: "duaca",
        nombre: "Duaca",
      },
      {
        slug: "el-manzano",
        nombre: "El Manzano",
      },
      {
        slug: "el-tocuyo",
        nombre: "El Tocuyo",
      },
      {
        slug: "guarico",
        nombre: "Guaríco",
      },
      {
        slug: "humocaro-alto",
        nombre: "Humocaro Alto",
      },
      {
        slug: "humocaro-bajo",
        nombre: "Humocaro Bajo",
      },
      {
        slug: "la-miel",
        nombre: "La Miel",
      },
      {
        slug: "moroturo",
        nombre: "Moroturo",
      },
      {
        slug: "quibor",
        nombre: "Quíbor",
      },
      {
        slug: "rio-claro",
        nombre: "Río Claro",
      },
      {
        slug: "sanare",
        nombre: "Sanare",
      },
      {
        slug: "santa-ines",
        nombre: "Santa Inés",
      },
      {
        slug: "sarare",
        nombre: "Sarare",
      },
      {
        slug: "siquisique",
        nombre: "Siquisique",
      },
      {
        slug: "tintorero",
        nombre: "Tintorero",
      },
    ],
  },
  {
    slug: "merida",
    nombre: "Mérida",
    ciudades: [
      {
        slug: "apartaderos-merida",
        nombre: "Apartaderos",
      },
      {
        slug: "arapuey",
        nombre: "Arapuey",
      },
      {
        slug: "bailadores",
        nombre: "Bailadores",
      },
      {
        slug: "caja-seca",
        nombre: "Caja Seca",
      },
      {
        slug: "canagua",
        nombre: "Canaguá",
      },
      {
        slug: "chachopo",
        nombre: "Chachopo",
      },
      {
        slug: "chiguara",
        nombre: "Chiguara",
      },
      {
        slug: "ejido",
        nombre: "Ejido",
      },
      {
        slug: "el-vigia",
        nombre: "El Vigía",
      },
      {
        slug: "la-azulita",
        nombre: "La Azulita",
      },
      {
        slug: "la-playa",
        nombre: "La Playa",
      },
      {
        slug: "lagunillas",
        nombre: "Lagunillas",
      },
      {
        slug: "merida",
        nombre: "Mérida",
      },
      {
        slug: "mesa-de-bolivar",
        nombre: "Mesa de Bolívar",
      },
      {
        slug: "mucuchies",
        nombre: "Mucuchíes",
      },
      {
        slug: "mucujepe",
        nombre: "Mucujepe",
      },
      {
        slug: "mucuruba",
        nombre: "Mucuruba",
      },
      {
        slug: "nueva-bolivia",
        nombre: "Nueva Bolivia",
      },
      {
        slug: "palmarito",
        nombre: "Palmarito",
      },
      {
        slug: "pueblo-llano",
        nombre: "Pueblo Llano",
      },
      {
        slug: "santa-cruz-de-mora",
        nombre: "Santa Cruz de Mora",
      },
      {
        slug: "santa-elena-de-arenales",
        nombre: "Santa Elena de Arenales",
      },
      {
        slug: "santo-domingo",
        nombre: "Santo Domingo",
      },
      {
        slug: "tabay",
        nombre: "Tabáy",
      },
      {
        slug: "timotes",
        nombre: "Timotes",
      },
      {
        slug: "torondoy",
        nombre: "Torondoy",
      },
      {
        slug: "tovar",
        nombre: "Tovar",
      },
      {
        slug: "tucani",
        nombre: "Tucaní",
      },
      {
        slug: "zea",
        nombre: "Zea",
      },
    ],
  },
  {
    slug: "miranda",
    nombre: "Miranda",
    ciudades: [
      {
        slug: "araguita",
        nombre: "Araguita",
      },
      {
        slug: "carrizal",
        nombre: "Carrizal",
      },
      {
        slug: "caucagua",
        nombre: "Caucagua",
      },
      {
        slug: "chaguaramas-miranda",
        nombre: "Chaguaramas",
      },
      {
        slug: "charallave",
        nombre: "Charallave",
      },
      {
        slug: "chirimena",
        nombre: "Chirimena",
      },
      {
        slug: "chuspa",
        nombre: "Chuspa",
      },
      {
        slug: "cua",
        nombre: "Cúa",
      },
      {
        slug: "cupira",
        nombre: "Cupira",
      },
      {
        slug: "curiepe",
        nombre: "Curiepe",
      },
      {
        slug: "el-guapo",
        nombre: "El Guapo",
      },
      {
        slug: "el-jarillo",
        nombre: "El Jarillo",
      },
      {
        slug: "filas-de-mariche",
        nombre: "Filas de Mariche",
      },
      {
        slug: "guarenas",
        nombre: "Guarenas",
      },
      {
        slug: "guatire",
        nombre: "Guatire",
      },
      {
        slug: "higuerote",
        nombre: "Higuerote",
      },
      {
        slug: "los-anaucos",
        nombre: "Los Anaucos",
      },
      {
        slug: "los-teques",
        nombre: "Los Teques",
      },
      {
        slug: "ocumare-del-tuy",
        nombre: "Ocumare del Tuy",
      },
      {
        slug: "panaquire",
        nombre: "Panaquire",
      },
      {
        slug: "paracotos",
        nombre: "Paracotos",
      },
      {
        slug: "rio-chico",
        nombre: "Río Chico",
      },
      {
        slug: "san-antonio-de-los-altos",
        nombre: "San Antonio de Los Altos",
      },
      {
        slug: "san-diego-de-los-altos",
        nombre: "San Diego de Los Altos",
      },
      {
        slug: "san-fernando-del-guapo",
        nombre: "San Fernando del Guapo",
      },
      {
        slug: "san-francisco-de-yare",
        nombre: "San Francisco de Yare",
      },
      {
        slug: "san-jose-de-los-altos",
        nombre: "San José de Los Altos",
      },
      {
        slug: "san-jose-de-rio-chico",
        nombre: "San José de Río Chico",
      },
      {
        slug: "san-pedro-de-los-altos",
        nombre: "San Pedro de Los Altos",
      },
      {
        slug: "santa-lucia",
        nombre: "Santa Lucía",
      },
      {
        slug: "santa-teresa",
        nombre: "Santa Teresa",
      },
      {
        slug: "tacarigua-de-la-laguna",
        nombre: "Tacarigua de La Laguna",
      },
      {
        slug: "tacarigua-de-mamporal",
        nombre: "Tacarigua de Mamporal",
      },
      {
        slug: "tacata",
        nombre: "Tácata",
      },
      {
        slug: "turumo",
        nombre: "Turumo",
      },
    ],
  },
  {
    slug: "monagas",
    nombre: "Monagas",
    ciudades: [
      {
        slug: "aguasay",
        nombre: "Aguasay",
      },
      {
        slug: "aragua-de-maturin",
        nombre: "Aragua de Maturín",
      },
      {
        slug: "barrancas-del-orinoco",
        nombre: "Barrancas del Orinoco",
      },
      {
        slug: "caicara-de-maturin",
        nombre: "Caicara de Maturín",
      },
      {
        slug: "caripe",
        nombre: "Caripe",
      },
      {
        slug: "caripito",
        nombre: "Caripito",
      },
      {
        slug: "chaguaramal",
        nombre: "Chaguaramal",
      },
      {
        slug: "chaguaramas-monagas",
        nombre: "Chaguaramas",
      },
      {
        slug: "el-furrial",
        nombre: "El Furrial",
      },
      {
        slug: "el-tejero",
        nombre: "El Tejero",
      },
      {
        slug: "jusepin",
        nombre: "Jusepín",
      },
      {
        slug: "la-toscana",
        nombre: "La Toscana",
      },
      {
        slug: "maturin",
        nombre: "Maturín",
      },
      {
        slug: "miraflores",
        nombre: "Miraflores",
      },
      {
        slug: "punta-de-mata",
        nombre: "Punta de Mata",
      },
      {
        slug: "quiriquire",
        nombre: "Quiriquire",
      },
      {
        slug: "san-antonio-de-maturin",
        nombre: "San Antonio de Maturín",
      },
      {
        slug: "san-vicente",
        nombre: "San Vicente",
      },
      {
        slug: "santa-barbara",
        nombre: "Santa Bárbara",
      },
      {
        slug: "temblador",
        nombre: "Temblador",
      },
      {
        slug: "teresen",
        nombre: "Teresen",
      },
      {
        slug: "uracoa",
        nombre: "Uracoa",
      },
    ],
  },
  {
    slug: "nueva-esparta",
    nombre: "Nueva Esparta",
    ciudades: [
      {
        slug: "altagracia",
        nombre: "Altagracia",
      },
      {
        slug: "boca-de-pozo",
        nombre: "Boca de Pozo",
      },
      {
        slug: "boca-de-rio",
        nombre: "Boca de Río",
      },
      {
        slug: "el-espinal",
        nombre: "El Espinal",
      },
      {
        slug: "el-valle-del-espiritu-santo",
        nombre: "El Valle del Espíritu Santo",
      },
      {
        slug: "el-yaque",
        nombre: "El Yaque",
      },
      {
        slug: "juangriego",
        nombre: "Juangriego",
      },
      {
        slug: "la-asuncion",
        nombre: "La Asunción",
      },
      {
        slug: "la-guardia",
        nombre: "La Guardia",
      },
      {
        slug: "pampatar",
        nombre: "Pampatar",
      },
      {
        slug: "porlamar",
        nombre: "Porlamar",
      },
      {
        slug: "puerto-fermin",
        nombre: "Puerto Fermín",
      },
      {
        slug: "punta-de-piedras",
        nombre: "Punta de Piedras",
      },
      {
        slug: "san-francisco-de-macanao",
        nombre: "San Francisco de Macanao",
      },
      {
        slug: "san-juan-bautista",
        nombre: "San Juan Bautista",
      },
      {
        slug: "san-pedro-de-coche",
        nombre: "San Pedro de Coche",
      },
      {
        slug: "santa-ana-de-nueva-esparta",
        nombre: "Santa Ana de Nueva Esparta",
      },
      {
        slug: "villa-rosa",
        nombre: "Villa Rosa",
      },
    ],
  },
  {
    slug: "portuguesa",
    nombre: "Portuguesa",
    ciudades: [
      {
        slug: "acarigua",
        nombre: "Acarigua",
      },
      {
        slug: "agua-blanca",
        nombre: "Agua Blanca",
      },
      {
        slug: "araure",
        nombre: "Araure",
      },
      {
        slug: "biscucuy",
        nombre: "Biscucuy",
      },
      {
        slug: "boconoito",
        nombre: "Boconoito",
      },
      {
        slug: "campo-elias",
        nombre: "Campo Elías",
      },
      {
        slug: "chabasquen",
        nombre: "Chabasquén",
      },
      {
        slug: "guanare",
        nombre: "Guanare",
      },
      {
        slug: "guanarito",
        nombre: "Guanarito",
      },
      {
        slug: "la-aparicion",
        nombre: "La Aparición",
      },
      {
        slug: "la-mision",
        nombre: "La Misión",
      },
      {
        slug: "mesa-de-cavacas",
        nombre: "Mesa de Cavacas",
      },
      {
        slug: "ospino",
        nombre: "Ospino",
      },
      {
        slug: "papelon",
        nombre: "Papelón",
      },
      {
        slug: "payara",
        nombre: "Payara",
      },
      {
        slug: "pimpinela",
        nombre: "Pimpinela",
      },
      {
        slug: "piritu-de-portuguesa",
        nombre: "Píritu de Portuguesa",
      },
      {
        slug: "san-rafael-de-onoto",
        nombre: "San Rafael de Onoto",
      },
      {
        slug: "santa-rosalia",
        nombre: "Santa Rosalía",
      },
      {
        slug: "turen",
        nombre: "Turén",
      },
    ],
  },
  {
    slug: "sucre",
    nombre: "Sucre",
    ciudades: [
      {
        slug: "altos-de-sucre",
        nombre: "Altos de Sucre",
      },
      {
        slug: "araya",
        nombre: "Araya",
      },
      {
        slug: "cariaco",
        nombre: "Cariaco",
      },
      {
        slug: "carupano",
        nombre: "Carúpano",
      },
      {
        slug: "casanay",
        nombre: "Casanay",
      },
      {
        slug: "cumana",
        nombre: "Cumaná",
      },
      {
        slug: "cumanacoa",
        nombre: "Cumanacoa",
      },
      {
        slug: "el-morro-puerto-santo",
        nombre: "El Morro Puerto Santo",
      },
      {
        slug: "el-pilar",
        nombre: "El Pilar",
      },
      {
        slug: "el-poblado",
        nombre: "El Poblado",
      },
      {
        slug: "guaca",
        nombre: "Guaca",
      },
      {
        slug: "guiria",
        nombre: "Guiria",
      },
      {
        slug: "irapa",
        nombre: "Irapa",
      },
      {
        slug: "manicuare",
        nombre: "Manicuare",
      },
      {
        slug: "mariguitar",
        nombre: "Mariguitar",
      },
      {
        slug: "rio-caribe",
        nombre: "Río Caribe",
      },
      {
        slug: "san-antonio-del-golfo",
        nombre: "San Antonio del Golfo",
      },
      {
        slug: "san-jose-de-aerocuar",
        nombre: "San José de Aerocuar",
      },
      {
        slug: "san-vicente-de-sucre",
        nombre: "San Vicente de Sucre",
      },
      {
        slug: "santa-fe-de-sucre",
        nombre: "Santa Fe de Sucre",
      },
      {
        slug: "tunapuy",
        nombre: "Tunapuy",
      },
      {
        slug: "yaguaraparo",
        nombre: "Yaguaraparo",
      },
      {
        slug: "yoco",
        nombre: "Yoco",
      },
    ],
  },
  {
    slug: "tachira",
    nombre: "Táchira",
    ciudades: [
      {
        slug: "abejales",
        nombre: "Abejales",
      },
      {
        slug: "borota",
        nombre: "Borota",
      },
      {
        slug: "bramon",
        nombre: "Bramon",
      },
      {
        slug: "capacho",
        nombre: "Capacho",
      },
      {
        slug: "colon",
        nombre: "Colón",
      },
      {
        slug: "coloncito",
        nombre: "Coloncito",
      },
      {
        slug: "cordero",
        nombre: "Cordero",
      },
      {
        slug: "el-cobre",
        nombre: "El Cobre",
      },
      {
        slug: "el-pinal",
        nombre: "El Pinal",
      },
      {
        slug: "independencia",
        nombre: "Independencia",
      },
      {
        slug: "la-fria",
        nombre: "La Fría",
      },
      {
        slug: "la-grita",
        nombre: "La Grita",
      },
      {
        slug: "la-pedrera",
        nombre: "La Pedrera",
      },
      {
        slug: "la-tendida",
        nombre: "La Tendida",
      },
      {
        slug: "las-delicias",
        nombre: "Las Delicias",
      },
      {
        slug: "las-hernandez",
        nombre: "Las Hernández",
      },
      {
        slug: "lobatera",
        nombre: "Lobatera",
      },
      {
        slug: "michelena",
        nombre: "Michelena",
      },
      {
        slug: "palmira",
        nombre: "Palmira",
      },
      {
        slug: "pregonero",
        nombre: "Pregonero",
      },
      {
        slug: "queniquea",
        nombre: "Queniquea",
      },
      {
        slug: "rubio",
        nombre: "Rubio",
      },
      {
        slug: "san-antonio-del-tachira",
        nombre: "San Antonio del Tachira",
      },
      {
        slug: "san-cristobal",
        nombre: "San Cristobal",
      },
      {
        slug: "san-jose-de-bolivar",
        nombre: "San José de Bolívar",
      },
      {
        slug: "san-josecito",
        nombre: "San Josecito",
      },
      {
        slug: "san-pedro-del-rio",
        nombre: "San Pedro del Río",
      },
      {
        slug: "santa-ana-tachira",
        nombre: "Santa Ana",
      },
      {
        slug: "seboruco",
        nombre: "Seboruco",
      },
      {
        slug: "tariba",
        nombre: "Táriba",
      },
      {
        slug: "umuquena",
        nombre: "Umuquena",
      },
    ],
  },
  {
    slug: "trujillo",
    nombre: "Trujillo",
    ciudades: [
      {
        slug: "batatal",
        nombre: "Batatal",
      },
      {
        slug: "betijoque",
        nombre: "Betijoque",
      },
      {
        slug: "bocono",
        nombre: "Boconó",
      },
      {
        slug: "carache",
        nombre: "Carache",
      },
      {
        slug: "chejende",
        nombre: "Chejende",
      },
      {
        slug: "cuicas",
        nombre: "Cuicas",
      },
      {
        slug: "el-dividive",
        nombre: "El Dividive",
      },
      {
        slug: "el-jaguito",
        nombre: "El Jaguito",
      },
      {
        slug: "escuque",
        nombre: "Escuque",
      },
      {
        slug: "isnotu",
        nombre: "Isnotú",
      },
      {
        slug: "jajo",
        nombre: "Jajó",
      },
      {
        slug: "la-ceiba",
        nombre: "La Ceiba",
      },
      {
        slug: "la-concepcion-de-trujllo",
        nombre: "La Concepción de Trujllo",
      },
      {
        slug: "la-mesa-de-esnujaque",
        nombre: "La Mesa de Esnujaque",
      },
      {
        slug: "la-puerta",
        nombre: "La Puerta",
      },
      {
        slug: "la-quebrada",
        nombre: "La Quebrada",
      },
      {
        slug: "mendoza-fria",
        nombre: "Mendoza Fría",
      },
      {
        slug: "meseta-de-chimpire",
        nombre: "Meseta de Chimpire",
      },
      {
        slug: "monay",
        nombre: "Monay",
      },
      {
        slug: "motatan",
        nombre: "Motatán",
      },
      {
        slug: "pampan",
        nombre: "Pampán",
      },
      {
        slug: "pampanito",
        nombre: "Pampanito",
      },
      {
        slug: "sabana-de-mendoza",
        nombre: "Sabana de Mendoza",
      },
      {
        slug: "san-lazaro",
        nombre: "San Lázaro",
      },
      {
        slug: "santa-ana-de-trujillo",
        nombre: "Santa Ana de Trujillo",
      },
      {
        slug: "tostos",
        nombre: "Tostós",
      },
      {
        slug: "trujillo",
        nombre: "Trujillo",
      },
      {
        slug: "valera",
        nombre: "Valera",
      },
    ],
  },
  {
    slug: "vargas",
    nombre: "Vargas",
    ciudades: [
      {
        slug: "carayaca",
        nombre: "Carayaca",
      },
      {
        slug: "litoral",
        nombre: "Litoral",
      },
    ],
  },
  {
    slug: "yaracuy",
    nombre: "Yaracuy",
    ciudades: [
      {
        slug: "aroa",
        nombre: "Aroa",
      },
      {
        slug: "boraure",
        nombre: "Boraure",
      },
      {
        slug: "campo-elias-de-yaracuy",
        nombre: "Campo Elías de Yaracuy",
      },
      {
        slug: "chivacoa",
        nombre: "Chivacoa",
      },
      {
        slug: "cocorote",
        nombre: "Cocorote",
      },
      {
        slug: "farriar",
        nombre: "Farriar",
      },
      {
        slug: "guama",
        nombre: "Guama",
      },
      {
        slug: "marin",
        nombre: "Marín",
      },
      {
        slug: "nirgua",
        nombre: "Nirgua",
      },
      {
        slug: "sabana-de-parra",
        nombre: "Sabana de Parra",
      },
      {
        slug: "salom",
        nombre: "Salom",
      },
      {
        slug: "san-felipe",
        nombre: "San Felipe",
      },
      {
        slug: "san-pablo-de-yaracuy",
        nombre: "San Pablo de Yaracuy",
      },
      {
        slug: "urachiche",
        nombre: "Urachiche",
      },
      {
        slug: "yaritagua",
        nombre: "Yaritagua",
      },
      {
        slug: "yumare",
        nombre: "Yumare",
      },
    ],
  },
  {
    slug: "zulia",
    nombre: "Zulia",
    ciudades: [
      {
        slug: "bachaquero",
        nombre: "Bachaquero",
      },
      {
        slug: "bobures",
        nombre: "Bobures",
      },
      {
        slug: "cabimas",
        nombre: "Cabimas",
      },
      {
        slug: "campo-concepcion",
        nombre: "Campo Concepción",
      },
      {
        slug: "campo-mara",
        nombre: "Campo Mara",
      },
      {
        slug: "campo-rojo",
        nombre: "Campo Rojo",
      },
      {
        slug: "carrasquero",
        nombre: "Carrasquero",
      },
      {
        slug: "casigua",
        nombre: "Casigua",
      },
      {
        slug: "chiquinquira",
        nombre: "Chiquinquirá",
      },
      {
        slug: "ciudad-ojeda",
        nombre: "Ciudad Ojeda",
      },
      {
        slug: "el-batey",
        nombre: "El Batey",
      },
      {
        slug: "el-carmelo",
        nombre: "El Carmelo",
      },
      {
        slug: "el-chivo",
        nombre: "El Chivo",
      },
      {
        slug: "el-guayabo",
        nombre: "El Guayabo",
      },
      {
        slug: "el-mene",
        nombre: "El Mene",
      },
      {
        slug: "el-venado",
        nombre: "El Venado",
      },
      {
        slug: "encontrados",
        nombre: "Encontrados",
      },
      {
        slug: "gibraltar",
        nombre: "Gibraltar",
      },
      {
        slug: "isla-de-toas",
        nombre: "Isla de Toas",
      },
      {
        slug: "la-concepcion",
        nombre: "La Concepción",
      },
      {
        slug: "la-paz",
        nombre: "La Paz",
      },
      {
        slug: "la-sierrita",
        nombre: "La Sierrita",
      },
      {
        slug: "lagunillas-zulia",
        nombre: "Lagunillas",
      },
      {
        slug: "las-piedras",
        nombre: "Las Piedras",
      },
      {
        slug: "los-cortijos",
        nombre: "Los Cortijos",
      },
      {
        slug: "machiques",
        nombre: "Machiques",
      },
      {
        slug: "maracaibo",
        nombre: "Maracaibo",
      },
      {
        slug: "mene-grande",
        nombre: "Mene Grande",
      },
      {
        slug: "palmarejo",
        nombre: "Palmarejo",
      },
      {
        slug: "paraguaipoa",
        nombre: "Paraguaipoa",
      },
      {
        slug: "potrerito",
        nombre: "Potrerito",
      },
      {
        slug: "pueblo-nuevo-zulia",
        nombre: "Pueblo Nuevo",
      },
      {
        slug: "puertos-de-altagracia",
        nombre: "Puertos de Altagracia",
      },
      {
        slug: "punta-gorda",
        nombre: "Punta Gorda",
      },
      {
        slug: "sabaneta-de-palma",
        nombre: "Sabaneta de Palma",
      },
      {
        slug: "san-carlos-del-zulia",
        nombre: "San Carlos del Zulia",
      },
      {
        slug: "san-francisco",
        nombre: "San Francisco",
      },
      {
        slug: "san-jose-de-perija",
        nombre: "San José de Perijá",
      },
      {
        slug: "san-rafael-del-mojan",
        nombre: "San Rafael del Moján",
      },
      {
        slug: "san-timoteo",
        nombre: "San Timoteo",
      },
      {
        slug: "santa-barbara-del-zulia",
        nombre: "Santa Bárbara del Zulia",
      },
      {
        slug: "santa-cruz-de-mara",
        nombre: "Santa Cruz de Mara",
      },
      {
        slug: "santa-cruz-del-zulia",
        nombre: "Santa Cruz del Zulia",
      },
      {
        slug: "santa-rita",
        nombre: "Santa Rita",
      },
      {
        slug: "sinamaica",
        nombre: "Sinamaica",
      },
      {
        slug: "tamare",
        nombre: "Tamare",
      },
      {
        slug: "tia-juana",
        nombre: "Tía Juana",
      },
      {
        slug: "villa-rosario",
        nombre: "Villa Rosario",
      },
    ],
  },
];
