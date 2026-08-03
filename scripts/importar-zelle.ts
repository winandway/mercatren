/**
 * Importa el historico de pagos Zelle a la base de datos.
 *
 * Lee datos/mercatren-zelle-history-export.json y arma un archivo SQL con los
 * INSERT. No se conecta a ninguna base: solo escribe el archivo. Aplicarlo es
 * un paso aparte (`npm run db:local` para la base de tu computadora).
 *
 * Uso:  npm run zelle:importar
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { interpretarComprobante } from "../src/lib/zelle/clasificar.ts";
import { totalizarIngresos } from "../src/lib/zelle/contabilidad.ts";

const RAIZ = process.cwd();
const ENTRADA = path.join(RAIZ, "datos", "mercatren-zelle-history-export.json");
const SALIDA = path.join(RAIZ, ".local", "zelle-historico.sql");

type Movimiento = {
  id: string;
  type: string;
  status: string;
  amount: number | null;
  commission: number | null;
  net_amount: number | null;
  receipt_url: string | null;
  notes: string | null;
  rejection_reason: string | null;
  uploaded_at: string | null;
  approved_at: string | null;
  confirmation_code: string | null;
  sender_name: string | null;
  sender_email: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  transaction_date: string | null;
  platform: string | null;
  direction: string | null;
};

type Archivo = {
  meta: {
    account: string;
    reference_page: string;
    totals: {
      rows: number;
      inflows_approved: number;
      inflows_approved_amount_usd: number;
    };
  };
  deposits: Movimiento[];
};

/** Dolares a centavos enteros. Nunca se guarda dinero con decimales. */
function aCentavos(valor: number | null | undefined) {
  return Math.round(Number(valor ?? 0) * 100);
}

/** Fecha ISO a segundos, que es como guarda las fechas esta base. */
function aSegundos(iso: string | null | undefined) {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : Math.floor(t / 1000);
}

function texto(valor: string | null | undefined) {
  if (valor === null || valor === undefined) return "NULL";
  return `'${String(valor).replace(/'/g, "''")}'`;
}

function numero(valor: number | null | undefined) {
  return valor === null || valor === undefined ? "NULL" : String(valor);
}

const TIPOS: Record<string, "entrada" | "retiro"> = {
  deposit: "entrada",
  withdrawal: "retiro",
};

const ESTADOS: Record<string, "aprobado" | "pendiente" | "rechazado"> = {
  approved: "aprobado",
  pending: "pendiente",
  rejected: "rechazado",
};

const COLUMNAS = [
  "id",
  "origen",
  "tipo",
  "estado",
  "monto_centavos",
  "comision_centavos",
  "neto_centavos",
  "moneda",
  "recibo_url",
  "notas",
  "motivo_rechazo",
  "subido_en",
  "aprobado_en",
  "fecha_transaccion",
  "codigo_confirmacion",
  "pagador_nombre_crudo",
  "pagador_nombre",
  "pagador_correo",
  "pagador_tipo",
  "banco_origen",
  "cuenta_ultimos4",
  "receptor_nombre_crudo",
  "cuenta_receptora",
  "plataforma",
  "direccion_comprobante",
  "seller_cuenta",
  "seller_referencia",
  "tienda_id",
  "creado_en",
];

/**
 * El comercio piloto: el primer cliente de Mercatren, que viene del sistema
 * anterior. Sus datos salen del propio archivo, no se inventan.
 *
 * Mercatren es multi-comercio: este es el primero, y los que vengan despues se
 * registran solos. Por eso el historico se cuelga de una TIENDA y no de una
 * configuracion global.
 */
const PILOTO = {
  id: "tienda-bley-ferreteria",
  slug: "bley-ferreteria",
  nombre: "Bley Ferretería",
  paisOrigen: "VE",
  /** 3% — es la comision que aparece cobrada en todo el historico. */
  comisionPuntosBase: 300,
};

/**
 * OJO CON EL SALDO: la billetera del comercio arranca en CERO a proposito.
 * Todo lo del historico ya se le liquido en el sistema anterior; darle ese
 * saldo aqui seria pagarle dos veces. Solo suma lo que se apruebe de ahora en
 * adelante.
 */
function sqlDelComercio(ahora: number) {
  return [
    "-- Comercio piloto y su billetera (saldo en cero: el historico ya se liquido).",
    `INSERT INTO tiendas (id, slug, nombre, estado, comision_puntos_base, pais_origen, descripcion_es, descripcion_en, creado_en, actualizado_en)`,
    // La descripcion va VACIA a proposito: ese texto lo lee el publico en la
    // pagina de la tienda, y ahi no se cuelan datos internos ni enlaces del
    // sistema anterior. La escribe el propio comercio desde su panel.
    `VALUES (${texto(PILOTO.id)}, ${texto(PILOTO.slug)}, ${texto(PILOTO.nombre)}, 'activa', ${PILOTO.comisionPuntosBase}, ${texto(PILOTO.paisOrigen)}, NULL, NULL, ${ahora}, ${ahora})`,
    "ON CONFLICT(id) DO UPDATE SET nombre = excluded.nombre, estado = excluded.estado;",
    "",
    `INSERT INTO billeteras (id, tienda_id, saldo_centavos, moneda, proveedor, estado, creado_en)`,
    `VALUES (${texto(`billetera-${PILOTO.slug}`)}, ${texto(PILOTO.id)}, 0, 'USD', 'tokiia', 'activa', ${ahora})`,
    "ON CONFLICT(tienda_id) DO NOTHING;",
    "",
  ];
}

function main() {
  const archivo: Archivo = JSON.parse(readFileSync(ENTRADA, "utf8"));
  const { meta, deposits } = archivo;

  const ahora = Math.floor(Date.parse(meta_exportado(meta)) / 1000);

  const filas = deposits.map((m) => {
    const tipo = TIPOS[m.type];
    const estado = ESTADOS[m.status];
    if (!tipo) throw new Error(`Tipo desconocido en ${m.id}: ${m.type}`);
    if (!estado) throw new Error(`Estado desconocido en ${m.id}: ${m.status}`);

    const leido = interpretarComprobante(m);

    const valores = [
      texto(m.id),
      texto("import"),
      texto(tipo),
      texto(estado),
      numero(aCentavos(m.amount)),
      numero(aCentavos(m.commission)),
      numero(aCentavos(m.net_amount)),
      texto("USD"),
      texto(m.receipt_url),
      texto(m.notes),
      texto(m.rejection_reason),
      numero(aSegundos(m.uploaded_at)),
      numero(aSegundos(m.approved_at)),
      numero(aSegundos(m.transaction_date)),
      texto(m.confirmation_code),
      texto(m.sender_name),
      texto(leido.pagadorNombre),
      texto(m.sender_email),
      texto(leido.pagadorTipo),
      texto(leido.bancoOrigen),
      texto(leido.cuentaUltimos4),
      texto(m.recipient_name),
      texto(leido.cuentaReceptora),
      texto(m.platform),
      texto(m.direction),
      texto(meta.account),
      texto(meta.reference_page),
      texto(PILOTO.id),
      numero(ahora),
    ];

    return `(${valores.join(", ")})`;
  });

  // Se manda por lotes para no armar una sola sentencia gigante.
  const LOTE = 100;
  const partes: string[] = [
    "-- Historico de pagos Zelle de Mercatren.",
    "-- Generado por scripts/importar-zelle.ts. NO editar a mano.",
    `-- Origen: ${meta.account} — ${deposits.length} movimientos.`,
    "",
    ...sqlDelComercio(ahora),
    "DELETE FROM pagos_zelle WHERE origen = 'import';",
    "",
  ];

  for (let i = 0; i < filas.length; i += LOTE) {
    const lote = filas.slice(i, i + LOTE);
    partes.push(
      `INSERT INTO pagos_zelle (${COLUMNAS.join(", ")}) VALUES\n${lote.join(",\n")};`,
      "",
    );
  }

  mkdirSync(path.dirname(SALIDA), { recursive: true });
  writeFileSync(SALIDA, partes.join("\n"), "utf8");

  comprobarNumeros(deposits, meta);

  console.log(`\nSQL escrito en ${path.relative(RAIZ, SALIDA)}`);
  console.log(`Movimientos preparados: ${filas.length}`);
}

/** La fecha de exportacion, para dejar constancia de cuando se congelo. */
function meta_exportado(meta: Archivo["meta"] & { exported_at?: string }) {
  return meta.exported_at ?? new Date().toISOString();
}

/**
 * Comprueba contra los numeros de control del propio archivo. Si algo no
 * cuadra, el import se detiene: mas vale no importar que importar mal.
 */
function comprobarNumeros(deposits: Movimiento[], meta: Archivo["meta"]) {
  // Se usa la MISMA regla de contabilidad que el resto del sistema, para que
  // el import no pueda cuadrar con una cuenta distinta a la del panel.
  const total = totalizarIngresos(
    deposits.map((m) => ({
      tipo: TIPOS[m.type],
      estado: ESTADOS[m.status],
      montoCentavos: aCentavos(m.amount),
      comisionCentavos: aCentavos(m.commission),
      netoCentavos: aCentavos(m.net_amount),
    })),
  );

  const entradas = deposits.filter((m) => m.type !== "withdrawal").length;
  const esperadoMonto = Math.round(
    meta.totals.inflows_approved_amount_usd * 100,
  );

  const problemas: string[] = [];
  if (deposits.length !== meta.totals.rows) {
    problemas.push(`filas: ${deposits.length} != ${meta.totals.rows}`);
  }
  if (total.pagos !== meta.totals.inflows_approved) {
    problemas.push(
      `entradas aprobadas: ${total.pagos} != ${meta.totals.inflows_approved}`,
    );
  }
  if (total.montoCentavos !== esperadoMonto) {
    problemas.push(
      `monto aprobado: ${total.montoCentavos} != ${esperadoMonto} (centavos)`,
    );
  }

  if (problemas.length) {
    throw new Error(`Los numeros no cuadran:\n  - ${problemas.join("\n  - ")}`);
  }

  console.log("Numeros de control verificados:");
  console.log(`  filas totales:      ${deposits.length}`);
  console.log(`  entradas:           ${entradas}`);
  console.log(`  retiros (no suman): ${deposits.length - entradas}`);
  console.log(`  entradas aprobadas: ${total.pagos}`);
  console.log(
    `  total aprobado:     $${(total.montoCentavos / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
  );
  console.log(
    `  comision:           $${(total.comisionCentavos / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
  );
}

main();
