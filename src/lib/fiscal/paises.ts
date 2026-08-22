/**
 * LOS PAÍSES QUE PUEDEN FIRMAR UN W-8BEN-E — o sea, TODOS MENOS ESTADOS UNIDOS.
 *
 * ══ POR QUÉ ESTA LISTA EXISTE ══
 *
 * El W-8BEN-E es, literalmente, el papel con el que una empresa declara **NO
 * ser estadounidense**. El campo del país era texto libre y el servidor solo
 * comprobaba que no estuviera vacío, así que se guardó un formulario que decía
 * «COUNTRY OF INCORPORATION: ESTADOS UNIDOS» — un documento que se contradice a
 * sí mismo en su segunda línea.
 *
 * Lo pidió el dueño con el arreglo correcto: una lista con todos los países del
 * mundo **menos Estados Unidos**.
 *
 * ══ Y TAMPOCO SUS TERRITORIOS, QUE ES LO QUE SE ESCAPA ══
 *
 * Quitar solo «Estados Unidos» deja pasar Puerto Rico, Guam, Islas Vírgenes,
 * Samoa Americana y las Marianas del Norte. **Una entidad de Puerto Rico es
 * estadounidense para el IRS**: le toca el W-9, no este formulario. Es el mismo
 * error con otro nombre, y es el que nadie ve.
 *
 * ══ A UNA EMPRESA DE ESTADOS UNIDOS NO SE LE DICE «NO» A SECAS ══
 *
 * Se le dice **cuál le toca**: el W-9. Un formulario que rechaza sin explicar
 * deja a alguien sin poder cobrar y sin saber qué hacer.
 *
 * ══ NO ES UNA LISTA DE SANCIONES ══
 *
 * Aquí están los países que existen, no los que se pueden pagar. Quién puede
 * recibir dinero lo decide el banco (Mercury) y el cumplimiento de OFAC, no un
 * desplegable. Mezclar las dos cosas haría creer que un país de esta lista está
 * aprobado para pagarle, y eso no lo decide este archivo.
 */

/** Estados Unidos y sus territorios: para el IRS, todos son «U.S. person». */
export const ES_ESTADOS_UNIDOS = [
  "US", // Estados Unidos
  "PR", // Puerto Rico
  "VI", // Islas Vírgenes de EE. UU.
  "GU", // Guam
  "AS", // Samoa Americana
  "MP", // Islas Marianas del Norte
  "UM", // Islas menores alejadas de EE. UU.
] as const;

export type Pais = { codigo: string; nombre: string };

/**
 * Todos los países del mundo, en español y ordenados alfabéticamente.
 *
 * Los códigos son ISO 3166-1 alfa-2, que es lo que espera el IRS en el
 * formulario y lo que entienden los bancos.
 */
export const PAISES: Pais[] = [
  { codigo: "AF", nombre: "Afganistán" },
  { codigo: "AL", nombre: "Albania" },
  { codigo: "DE", nombre: "Alemania" },
  { codigo: "AD", nombre: "Andorra" },
  { codigo: "AO", nombre: "Angola" },
  { codigo: "AI", nombre: "Anguila" },
  { codigo: "AG", nombre: "Antigua y Barbuda" },
  { codigo: "SA", nombre: "Arabia Saudita" },
  { codigo: "DZ", nombre: "Argelia" },
  { codigo: "AR", nombre: "Argentina" },
  { codigo: "AM", nombre: "Armenia" },
  { codigo: "AW", nombre: "Aruba" },
  { codigo: "AU", nombre: "Australia" },
  { codigo: "AT", nombre: "Austria" },
  { codigo: "AZ", nombre: "Azerbaiyán" },
  { codigo: "BS", nombre: "Bahamas" },
  { codigo: "BD", nombre: "Bangladés" },
  { codigo: "BB", nombre: "Barbados" },
  { codigo: "BH", nombre: "Baréin" },
  { codigo: "BE", nombre: "Bélgica" },
  { codigo: "BZ", nombre: "Belice" },
  { codigo: "BJ", nombre: "Benín" },
  { codigo: "BM", nombre: "Bermudas" },
  { codigo: "BY", nombre: "Bielorrusia" },
  { codigo: "BO", nombre: "Bolivia" },
  { codigo: "BA", nombre: "Bosnia y Herzegovina" },
  { codigo: "BW", nombre: "Botsuana" },
  { codigo: "BR", nombre: "Brasil" },
  { codigo: "BN", nombre: "Brunéi" },
  { codigo: "BG", nombre: "Bulgaria" },
  { codigo: "BF", nombre: "Burkina Faso" },
  { codigo: "BI", nombre: "Burundi" },
  { codigo: "BT", nombre: "Bután" },
  { codigo: "CV", nombre: "Cabo Verde" },
  { codigo: "KH", nombre: "Camboya" },
  { codigo: "CM", nombre: "Camerún" },
  { codigo: "CA", nombre: "Canadá" },
  { codigo: "QA", nombre: "Catar" },
  { codigo: "TD", nombre: "Chad" },
  { codigo: "CZ", nombre: "Chequia" },
  { codigo: "CL", nombre: "Chile" },
  { codigo: "CN", nombre: "China" },
  { codigo: "CY", nombre: "Chipre" },
  { codigo: "VA", nombre: "Ciudad del Vaticano" },
  { codigo: "CO", nombre: "Colombia" },
  { codigo: "KM", nombre: "Comoras" },
  { codigo: "CG", nombre: "Congo" },
  { codigo: "CD", nombre: "Congo (República Democrática)" },
  { codigo: "KP", nombre: "Corea del Norte" },
  { codigo: "KR", nombre: "Corea del Sur" },
  { codigo: "CI", nombre: "Costa de Marfil" },
  { codigo: "CR", nombre: "Costa Rica" },
  { codigo: "HR", nombre: "Croacia" },
  { codigo: "CU", nombre: "Cuba" },
  { codigo: "CW", nombre: "Curazao" },
  { codigo: "DK", nombre: "Dinamarca" },
  { codigo: "DM", nombre: "Dominica" },
  { codigo: "EC", nombre: "Ecuador" },
  { codigo: "EG", nombre: "Egipto" },
  { codigo: "SV", nombre: "El Salvador" },
  { codigo: "AE", nombre: "Emiratos Árabes Unidos" },
  { codigo: "ER", nombre: "Eritrea" },
  { codigo: "SK", nombre: "Eslovaquia" },
  { codigo: "SI", nombre: "Eslovenia" },
  { codigo: "ES", nombre: "España" },
  { codigo: "EE", nombre: "Estonia" },
  { codigo: "SZ", nombre: "Esuatini" },
  { codigo: "ET", nombre: "Etiopía" },
  { codigo: "PH", nombre: "Filipinas" },
  { codigo: "FI", nombre: "Finlandia" },
  { codigo: "FJ", nombre: "Fiyi" },
  { codigo: "FR", nombre: "Francia" },
  { codigo: "GA", nombre: "Gabón" },
  { codigo: "GM", nombre: "Gambia" },
  { codigo: "GE", nombre: "Georgia" },
  { codigo: "GH", nombre: "Ghana" },
  { codigo: "GI", nombre: "Gibraltar" },
  { codigo: "GD", nombre: "Granada" },
  { codigo: "GR", nombre: "Grecia" },
  { codigo: "GL", nombre: "Groenlandia" },
  { codigo: "GP", nombre: "Guadalupe" },
  { codigo: "GT", nombre: "Guatemala" },
  { codigo: "GF", nombre: "Guayana Francesa" },
  { codigo: "GG", nombre: "Guernsey" },
  { codigo: "GN", nombre: "Guinea" },
  { codigo: "GQ", nombre: "Guinea Ecuatorial" },
  { codigo: "GW", nombre: "Guinea-Bisáu" },
  { codigo: "GY", nombre: "Guyana" },
  { codigo: "HT", nombre: "Haití" },
  { codigo: "HN", nombre: "Honduras" },
  { codigo: "HK", nombre: "Hong Kong" },
  { codigo: "HU", nombre: "Hungría" },
  { codigo: "IN", nombre: "India" },
  { codigo: "ID", nombre: "Indonesia" },
  { codigo: "IQ", nombre: "Irak" },
  { codigo: "IR", nombre: "Irán" },
  { codigo: "IE", nombre: "Irlanda" },
  { codigo: "IM", nombre: "Isla de Man" },
  { codigo: "IS", nombre: "Islandia" },
  { codigo: "KY", nombre: "Islas Caimán" },
  { codigo: "CK", nombre: "Islas Cook" },
  { codigo: "FO", nombre: "Islas Feroe" },
  { codigo: "MV", nombre: "Islas Maldivas" },
  { codigo: "FK", nombre: "Islas Malvinas" },
  { codigo: "MH", nombre: "Islas Marshall" },
  { codigo: "SB", nombre: "Islas Salomón" },
  { codigo: "TC", nombre: "Islas Turcas y Caicos" },
  { codigo: "VG", nombre: "Islas Vírgenes Británicas" },
  { codigo: "IL", nombre: "Israel" },
  { codigo: "IT", nombre: "Italia" },
  { codigo: "JM", nombre: "Jamaica" },
  { codigo: "JP", nombre: "Japón" },
  { codigo: "JE", nombre: "Jersey" },
  { codigo: "JO", nombre: "Jordania" },
  { codigo: "KZ", nombre: "Kazajistán" },
  { codigo: "KE", nombre: "Kenia" },
  { codigo: "KG", nombre: "Kirguistán" },
  { codigo: "KI", nombre: "Kiribati" },
  { codigo: "KW", nombre: "Kuwait" },
  { codigo: "LA", nombre: "Laos" },
  { codigo: "LS", nombre: "Lesoto" },
  { codigo: "LV", nombre: "Letonia" },
  { codigo: "LB", nombre: "Líbano" },
  { codigo: "LR", nombre: "Liberia" },
  { codigo: "LY", nombre: "Libia" },
  { codigo: "LI", nombre: "Liechtenstein" },
  { codigo: "LT", nombre: "Lituania" },
  { codigo: "LU", nombre: "Luxemburgo" },
  { codigo: "MO", nombre: "Macao" },
  { codigo: "MK", nombre: "Macedonia del Norte" },
  { codigo: "MG", nombre: "Madagascar" },
  { codigo: "MY", nombre: "Malasia" },
  { codigo: "MW", nombre: "Malaui" },
  { codigo: "ML", nombre: "Malí" },
  { codigo: "MT", nombre: "Malta" },
  { codigo: "MA", nombre: "Marruecos" },
  { codigo: "MQ", nombre: "Martinica" },
  { codigo: "MU", nombre: "Mauricio" },
  { codigo: "MR", nombre: "Mauritania" },
  { codigo: "MX", nombre: "México" },
  { codigo: "FM", nombre: "Micronesia" },
  { codigo: "MD", nombre: "Moldavia" },
  { codigo: "MC", nombre: "Mónaco" },
  { codigo: "MN", nombre: "Mongolia" },
  { codigo: "ME", nombre: "Montenegro" },
  { codigo: "MS", nombre: "Montserrat" },
  { codigo: "MZ", nombre: "Mozambique" },
  { codigo: "MM", nombre: "Myanmar" },
  { codigo: "NA", nombre: "Namibia" },
  { codigo: "NR", nombre: "Nauru" },
  { codigo: "NP", nombre: "Nepal" },
  { codigo: "NI", nombre: "Nicaragua" },
  { codigo: "NE", nombre: "Níger" },
  { codigo: "NG", nombre: "Nigeria" },
  { codigo: "NU", nombre: "Niue" },
  { codigo: "NO", nombre: "Noruega" },
  { codigo: "NC", nombre: "Nueva Caledonia" },
  { codigo: "NZ", nombre: "Nueva Zelanda" },
  { codigo: "OM", nombre: "Omán" },
  { codigo: "NL", nombre: "Países Bajos" },
  { codigo: "PK", nombre: "Pakistán" },
  { codigo: "PW", nombre: "Palaos" },
  { codigo: "PS", nombre: "Palestina" },
  { codigo: "PA", nombre: "Panamá" },
  { codigo: "PG", nombre: "Papúa Nueva Guinea" },
  { codigo: "PY", nombre: "Paraguay" },
  { codigo: "PE", nombre: "Perú" },
  { codigo: "PF", nombre: "Polinesia Francesa" },
  { codigo: "PL", nombre: "Polonia" },
  { codigo: "PT", nombre: "Portugal" },
  { codigo: "GB", nombre: "Reino Unido" },
  { codigo: "CF", nombre: "República Centroafricana" },
  { codigo: "DO", nombre: "República Dominicana" },
  { codigo: "RE", nombre: "Reunión" },
  { codigo: "RW", nombre: "Ruanda" },
  { codigo: "RO", nombre: "Rumanía" },
  { codigo: "RU", nombre: "Rusia" },
  { codigo: "WS", nombre: "Samoa" },
  { codigo: "BL", nombre: "San Bartolomé" },
  { codigo: "KN", nombre: "San Cristóbal y Nieves" },
  { codigo: "SM", nombre: "San Marino" },
  { codigo: "MF", nombre: "San Martín" },
  { codigo: "PM", nombre: "San Pedro y Miquelón" },
  { codigo: "VC", nombre: "San Vicente y las Granadinas" },
  { codigo: "SH", nombre: "Santa Elena" },
  { codigo: "LC", nombre: "Santa Lucía" },
  { codigo: "ST", nombre: "Santo Tomé y Príncipe" },
  { codigo: "SN", nombre: "Senegal" },
  { codigo: "RS", nombre: "Serbia" },
  { codigo: "SC", nombre: "Seychelles" },
  { codigo: "SL", nombre: "Sierra Leona" },
  { codigo: "SG", nombre: "Singapur" },
  { codigo: "SX", nombre: "Sint Maarten" },
  { codigo: "SY", nombre: "Siria" },
  { codigo: "SO", nombre: "Somalia" },
  { codigo: "LK", nombre: "Sri Lanka" },
  { codigo: "ZA", nombre: "Sudáfrica" },
  { codigo: "SD", nombre: "Sudán" },
  { codigo: "SS", nombre: "Sudán del Sur" },
  { codigo: "SE", nombre: "Suecia" },
  { codigo: "CH", nombre: "Suiza" },
  { codigo: "SR", nombre: "Surinam" },
  { codigo: "TH", nombre: "Tailandia" },
  { codigo: "TW", nombre: "Taiwán" },
  { codigo: "TZ", nombre: "Tanzania" },
  { codigo: "TJ", nombre: "Tayikistán" },
  { codigo: "TL", nombre: "Timor Oriental" },
  { codigo: "TG", nombre: "Togo" },
  { codigo: "TO", nombre: "Tonga" },
  { codigo: "TT", nombre: "Trinidad y Tobago" },
  { codigo: "TN", nombre: "Túnez" },
  { codigo: "TM", nombre: "Turkmenistán" },
  { codigo: "TR", nombre: "Turquía" },
  { codigo: "TV", nombre: "Tuvalu" },
  { codigo: "UA", nombre: "Ucrania" },
  { codigo: "UG", nombre: "Uganda" },
  { codigo: "UY", nombre: "Uruguay" },
  { codigo: "UZ", nombre: "Uzbekistán" },
  { codigo: "VU", nombre: "Vanuatu" },
  { codigo: "VE", nombre: "Venezuela" },
  { codigo: "VN", nombre: "Vietnam" },
  { codigo: "YE", nombre: "Yemen" },
  { codigo: "DJ", nombre: "Yibuti" },
  { codigo: "ZM", nombre: "Zambia" },
  { codigo: "ZW", nombre: "Zimbabue" },
];

/** ¿Este código es de Estados Unidos o de uno de sus territorios? */
export function esDeEstadosUnidos(codigo: string | null | undefined): boolean {
  const c = (codigo ?? "").trim().toUpperCase();
  return (ES_ESTADOS_UNIDOS as readonly string[]).includes(c);
}

/**
 * ¿Este código puede firmar un W-8BEN-E?
 *
 * Tiene que estar en la lista **y** no ser de Estados Unidos. Las dos
 * condiciones, no una: sin la primera pasa cualquier texto («ESTADOS UNIDOS»,
 * «XX», lo que el navegador autocomplete), y sin la segunda pasa justo lo que
 * este formulario existe para negar.
 */
export function puedeFirmarW8(codigo: string | null | undefined): boolean {
  const c = (codigo ?? "").trim().toUpperCase();
  if (esDeEstadosUnidos(c)) return false;
  return PAISES.some((p) => p.codigo === c);
}

/** El nombre del país, para enseñarlo en el documento. */
export function nombreDePais(codigo: string | null | undefined): string | null {
  const c = (codigo ?? "").trim().toUpperCase();
  return PAISES.find((p) => p.codigo === c)?.nombre ?? null;
}
