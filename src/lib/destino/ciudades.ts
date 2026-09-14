/**
 * ══ LAS CIUDADES DE CHILE Y COLOMBIA, POR REGIÓN Y DEPARTAMENTO ══
 *
 * Sugerencias para la casilla de ciudad del checkout (pendiente desde la
 * apertura de las dos plazas, 27 ago 2026): quien escribe a mano pone
 * «Stgo», «Bogota D.C.» o el nombre del barrio, y el transportista
 * compara contra SU tabla. Con la lista, el comprador elige la forma que
 * CJ reconoce y la casilla sigue siendo libre para lo que no esté.
 *
 * Se escriben SIN acentos, igual que las regiones (`direccion.ts`): los
 * acentos son la primera causa de un «no coincide» en el sistema de un
 * transportista. Las llaves son los `codigo` de `REGIONES_CL` y
 * `DEPARTAMENTOS_CO`, y hay una prueba que lo comprueba.
 */
export const CIUDADES_CL: Readonly<Record<string, readonly string[]>> = {
  "Arica y Parinacota": ["Arica", "Putre"],
  Tarapaca: ["Iquique", "Alto Hospicio", "Pozo Almonte"],
  Antofagasta: ["Antofagasta", "Calama", "Tocopilla", "Mejillones"],
  Atacama: ["Copiapo", "Vallenar", "Caldera", "Chanaral"],
  Coquimbo: ["La Serena", "Coquimbo", "Ovalle", "Illapel", "Vicuna"],
  Valparaiso: [
    "Valparaiso",
    "Vina del Mar",
    "Quilpue",
    "Villa Alemana",
    "San Antonio",
    "Quillota",
    "Los Andes",
    "San Felipe",
    "Limache",
    "Concon",
  ],
  "Region Metropolitana": [
    "Santiago",
    "Puente Alto",
    "Maipu",
    "La Florida",
    "Las Condes",
    "San Bernardo",
    "Providencia",
    "Nunoa",
    "Penalolen",
    "La Pintana",
    "Quilicura",
    "Pudahuel",
    "Colina",
    "Melipilla",
    "Talagante",
    "Buin",
    "Lampa",
    "Vitacura",
    "Lo Barnechea",
    "Huechuraba",
  ],
  "O'Higgins": [
    "Rancagua",
    "San Fernando",
    "Rengo",
    "Machali",
    "Santa Cruz",
    "Pichilemu",
  ],
  Maule: ["Talca", "Curico", "Linares", "Constitucion", "Cauquenes", "Molina"],
  Nuble: ["Chillan", "Chillan Viejo", "San Carlos", "Bulnes"],
  Biobio: [
    "Concepcion",
    "Talcahuano",
    "Los Angeles",
    "Coronel",
    "San Pedro de la Paz",
    "Chiguayante",
    "Hualpen",
    "Lota",
    "Penco",
    "Tome",
  ],
  "La Araucania": [
    "Temuco",
    "Padre Las Casas",
    "Villarrica",
    "Angol",
    "Pucon",
    "Victoria",
    "Lautaro",
  ],
  "Los Rios": ["Valdivia", "La Union", "Panguipulli", "Rio Bueno"],
  "Los Lagos": [
    "Puerto Montt",
    "Osorno",
    "Castro",
    "Puerto Varas",
    "Ancud",
    "Quellon",
    "Frutillar",
  ],
  Aysen: ["Coyhaique", "Puerto Aysen", "Chile Chico"],
  Magallanes: ["Punta Arenas", "Puerto Natales", "Porvenir"],
};

export const CIUDADES_CO: Readonly<Record<string, readonly string[]>> = {
  Amazonas: ["Leticia", "Puerto Narino"],
  Antioquia: [
    "Medellin",
    "Bello",
    "Itagui",
    "Envigado",
    "Apartado",
    "Rionegro",
    "Sabaneta",
    "Turbo",
    "Caucasia",
    "La Estrella",
    "Copacabana",
    "Girardota",
    "Marinilla",
    "La Ceja",
  ],
  Arauca: ["Arauca", "Saravena", "Tame"],
  Atlantico: [
    "Barranquilla",
    "Soledad",
    "Malambo",
    "Sabanalarga",
    "Puerto Colombia",
    "Galapa",
  ],
  "Bogota DC": ["Bogota"],
  Bolivar: [
    "Cartagena",
    "Magangue",
    "Turbaco",
    "Arjona",
    "El Carmen de Bolivar",
  ],
  Boyaca: ["Tunja", "Duitama", "Sogamoso", "Chiquinquira", "Paipa"],
  Caldas: ["Manizales", "Villamaria", "La Dorada", "Chinchina", "Riosucio"],
  Caqueta: ["Florencia", "San Vicente del Caguan"],
  Casanare: ["Yopal", "Aguazul", "Villanueva"],
  Cauca: ["Popayan", "Santander de Quilichao", "Puerto Tejada"],
  Cesar: ["Valledupar", "Aguachica", "Bosconia"],
  Choco: ["Quibdo", "Istmina"],
  Cordoba: ["Monteria", "Lorica", "Cerete", "Sahagun"],
  Cundinamarca: [
    "Soacha",
    "Chia",
    "Zipaquira",
    "Facatativa",
    "Fusagasuga",
    "Girardot",
    "Mosquera",
    "Madrid",
    "Funza",
    "Cajica",
    "Cota",
    "La Calera",
  ],
  Guainia: ["Inirida"],
  Guaviare: ["San Jose del Guaviare"],
  Huila: ["Neiva", "Pitalito", "Garzon", "La Plata"],
  "La Guajira": ["Riohacha", "Maicao", "Uribia", "Fonseca"],
  Magdalena: ["Santa Marta", "Cienaga", "Fundacion", "El Banco"],
  Meta: ["Villavicencio", "Acacias", "Granada", "Puerto Lopez"],
  Narino: ["Pasto", "Tumaco", "Ipiales"],
  "Norte de Santander": [
    "Cucuta",
    "Ocana",
    "Pamplona",
    "Villa del Rosario",
    "Los Patios",
  ],
  Putumayo: ["Mocoa", "Puerto Asis"],
  Quindio: ["Armenia", "Calarca", "Montenegro", "La Tebaida", "Quimbaya"],
  Risaralda: ["Pereira", "Dosquebradas", "Santa Rosa de Cabal", "La Virginia"],
  "San Andres y Providencia": ["San Andres", "Providencia"],
  Santander: [
    "Bucaramanga",
    "Floridablanca",
    "Giron",
    "Piedecuesta",
    "Barrancabermeja",
    "San Gil",
    "Socorro",
  ],
  Sucre: ["Sincelejo", "Corozal", "Tolu"],
  Tolima: ["Ibague", "Espinal", "Melgar", "Honda", "Chaparral"],
  "Valle del Cauca": [
    "Cali",
    "Palmira",
    "Buenaventura",
    "Tulua",
    "Cartago",
    "Buga",
    "Jamundi",
    "Yumbo",
    "Candelaria",
  ],
  Vaupes: ["Mitu"],
  Vichada: ["Puerto Carreno"],
};

/** Las ciudades sugeridas para ese destino y ese estado; vacío si no hay. */
export function ciudadesDe(
  destino: string | null | undefined,
  estado: string | null | undefined,
): readonly string[] {
  const clave = (estado ?? "").trim();
  if (!clave) return [];
  if (destino === "CL") return CIUDADES_CL[clave] ?? [];
  if (destino === "CO") return CIUDADES_CO[clave] ?? [];
  return [];
}
