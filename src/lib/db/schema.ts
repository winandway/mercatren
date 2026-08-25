/**
 * Esquema de la base de datos de Mercatren (SQLite de YaDominios Cloud).
 *
 * Convencion del proyecto:
 *  - Las cuatro tablas del sistema de login (user, session, account, verification)
 *    conservan el nombre en ingles porque asi las espera Better Auth.
 *  - Todo lo demas (el negocio) va en espanol.
 *  - El dinero SIEMPRE se guarda en centavos, en numeros enteros. Nunca decimales.
 *  - Los textos que ve el publico llevan dos columnas: _es y _en (sitio bilingue).
 */

import { sql } from "drizzle-orm";
import {
  primaryKey,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { COMISION_ZELLE_PB } from "@/lib/dinero";

/* -------------------------------------------------------------------------- */
/* Login y cuentas (Better Auth)                                              */
/* -------------------------------------------------------------------------- */

/** Roles posibles de una cuenta. "soporte" es la cuenta interna de Windoce, LLC. */
export const ROLES = ["cliente", "vendedor", "validador", "soporte"] as const;
export type Rol = (typeof ROLES)[number];

export const user = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    image: text("image"),

    // Campos propios de Mercatren.
    rol: text("rol").$type<Rol>().notNull().default("cliente"),
    idioma: text("idioma").$type<"es" | "en">().notNull().default("es"),
    paisEntrega: text("pais_entrega"),
    telefono: text("telefono"),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("idx_user_rol").on(t.rol)],
);

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("idx_session_user").on(t.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("idx_account_user").on(t.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("idx_verification_identifier").on(t.identifier)],
);

/* -------------------------------------------------------------------------- */
/* Tiendas y catalogo                                                         */
/* -------------------------------------------------------------------------- */

/**
 * En qué punto está una tienda.
 *
 * `pendiente` es el estado en que nace cuando un comercio se da de alta solo:
 * ya escribió sus datos, pero todavía no vende. Alguien de Mercatren tiene
 * que aprobarla. Sin ese paso cualquiera podría ponerse a cobrar en nombre
 * del servicio, que es justo lo que no puede pasar.
 */
export const ESTADOS_TIENDA = [
  "borrador",
  "pendiente",
  "activa",
  "suspendida",
] as const;

export const tiendas = sqliteTable(
  "tiendas",
  {
    id: text("id").primaryKey(),
    /**
     * Dueno del comercio. Puede quedar vacio un rato: cuando se trae un
     * comercio de otro sistema, primero entran sus datos y despues se le
     * asigna la cuenta con la que va a entrar.
     */
    propietarioId: text("propietario_id").references(() => user.id, {
      onDelete: "set null",
    }),
    slug: text("slug").notNull().unique(),
    nombre: text("nombre").notNull(),
    descripcionEs: text("descripcion_es"),
    descripcionEn: text("descripcion_en"),
    logoClave: text("logo_clave"),
    portadaClave: text("portada_clave"),
    estado: text("estado")
      .$type<(typeof ESTADOS_TIENDA)[number]>()
      .notNull()
      .default("borrador"),
    /**
     * Comision de Mercatren sobre cada venta, en puntos base (300 = 3%).
     *
     * SALE DE `dinero.ts` A PROPOSITO, no es un 300 escrito aqui. Este numero
     * es lo que se le DESCUENTA al comercio al acreditarle; el precio que se
     * le COBRA al comprador lo calcula `precioZelleCentavos` con la misma
     * constante. Escritos por separado se desincronizan, y eso ya pasó: del 5
     * al 7 de agosto de 2026 el precio cubria el 2% y aqui se descontaba el
     * 3%, asi que el punto que faltaba salia del comercio en cada venta.
     */
    comisionPuntosBase: integer("comision_puntos_base")
      .notNull()
      .default(COMISION_ZELLE_PB),
    /** Cuenta conectada de Stripe del vendedor, para el pago dividido. */
    stripeCuentaId: text("stripe_cuenta_id"),
    paisOrigen: text("pais_origen").notNull().default("US"),
    /**
     * El MERCADO (dominio-país) donde vende: US = mercatren.com,
     * CL = mercatren.cl. No confundir con `paisOrigen`, que dice desde dónde
     * sale la mercancía: la ferretería tiene paisOrigen VE y mercado US,
     * porque su vitrina es mercatren.com. La lista vive en
     * src/lib/mercado/mercados.ts.
     *
     * OJO: esta columna llegó a producción con ALTER TABLE a mano (17 ago
     * 2026) — schema.sql solo trae CREATE TABLE IF NOT EXISTS y una base que
     * ya existe no recibe columnas nuevas sola.
     */
    mercado: text("mercado").notNull().default("US"),

    /**
     * Los datos de la empresa, tal como los quiere mostrar el comercio en su
     * tienda. Los llena el propio comercio desde su panel.
     *
     * Todos opcionales a proposito: un comercio puede empezar a vender con el
     * nombre y completar su ficha despues. Lo que este vacio simplemente no
     * se muestra, en vez de salir un hueco.
     */
    razonSocial: text("razon_social"),
    identificacionFiscal: text("identificacion_fiscal"),
    correoContacto: text("correo_contacto"),
    telefono: text("telefono"),
    direccion: text("direccion"),
    ciudad: text("ciudad"),
    sitioWeb: text("sitio_web"),
    /** Horario de atencion, en texto libre: cada comercio tiene el suyo. */
    horario: text("horario"),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    actualizadoEn: integer("actualizado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("idx_tiendas_propietario").on(t.propietarioId),
    index("idx_tiendas_estado").on(t.estado),
    // Toda consulta pública del catálogo filtra por mercado desde el 17 ago 2026.
    index("idx_tiendas_mercado").on(t.mercado),
  ],
);

export const categorias = sqliteTable(
  "categorias",
  {
    id: text("id").primaryKey(),
    /** A que comercio pertenece. Cada tienda arma sus propias categorias. */
    tiendaId: text("tienda_id").references(() => tiendas.id, {
      onDelete: "cascade",
    }),
    slug: text("slug").notNull(),
    nombreEs: text("nombre_es").notNull(),
    nombreEn: text("nombre_en"),
    padreId: text("padre_id"),
    orden: integer("orden").notNull().default(0),
    /** Id que tenia en el sistema de donde se sincroniza. */
    externoId: text("externo_id"),
  },
  (t) => [
    uniqueIndex("idx_categorias_tienda_slug").on(t.tiendaId, t.slug),
    index("idx_categorias_padre").on(t.padreId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Sincronizacion con la tienda de origen del comercio                        */
/* -------------------------------------------------------------------------- */
/*
 * Hay comercios que ya tienen su propia tienda montada por fuera (el piloto es
 * uno). En vez de obligarlos a cargar todo otra vez a mano, Mercatren lee su
 * catalogo de una direccion que ellos publican y se mantiene al dia solo.
 *
 * El formato de ese archivo es EL MISMO que el de la exportacion manual, asi
 * que traer el catalogo por archivo o por conexion automatica no cambia nada
 * del otro lado.
 */

export const ESTADOS_FUENTE = ["activa", "pausada", "con_error"] as const;

export const fuentesCatalogo = sqliteTable(
  "fuentes_catalogo",
  {
    id: text("id").primaryKey(),
    tiendaId: text("tienda_id")
      .notNull()
      .references(() => tiendas.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    /** Direccion publica del archivo de catalogo del comercio. */
    url: text("url"),
    /**
     * Llave para leer ese archivo, si esta protegido, y para que ellos puedan
     * avisarnos de un cambio. NUNCA se muestra completa en pantalla.
     */
    token: text("token"),
    estado: text("estado")
      .$type<(typeof ESTADOS_FUENTE)[number]>()
      .notNull()
      .default("activa"),
    /** Cada cuantos minutos se vuelve a mirar. */
    cadaMinutos: integer("cada_minutos").notNull().default(15),
    ultimaSincronizacion: integer("ultima_sincronizacion", {
      mode: "timestamp",
    }),
    ultimoResultado: text("ultimo_resultado"),
    productosSincronizados: integer("productos_sincronizados")
      .notNull()
      .default(0),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("idx_fuentes_tienda").on(t.tiendaId)],
);

export const ESTADOS_PRODUCTO = ["borrador", "publicado", "agotado"] as const;

export const productos = sqliteTable(
  "productos",
  {
    id: text("id").primaryKey(),
    tiendaId: text("tienda_id")
      .notNull()
      .references(() => tiendas.id, { onDelete: "cascade" }),
    categoriaId: text("categoria_id").references(() => categorias.id),
    slug: text("slug").notNull(),
    sku: text("sku"),
    marca: text("marca"),

    tituloEs: text("titulo_es").notNull(),
    /**
     * Puede venir vacio: si el comercio no tiene traduccion, NO se inventa.
     * En pantalla se muestra el espanol como respaldo.
     */
    tituloEn: text("titulo_en"),
    descripcionEs: text("descripcion_es"),
    descripcionEn: text("descripcion_en"),

    precioCentavos: integer("precio_centavos").notNull(),
    /**
     * EL PRECIO DEL COMERCIO, antes del ajuste por procesamiento.
     *
     * `precio_centavos` es lo que se PUBLICA (base + ajuste, calculado por
     * `precioConAjusteCentavos`). Esta columna guarda lo que el comercio
     * escribió, que es lo único que él controla — y hace el cambio
     * reversible al centavo: si mañana el modelo cambia, la base está aquí.
     *
     * NULL = producto de antes del ajuste, todavía sin migrar.
     */
    precioBaseCentavos: integer("precio_base_centavos"),
    /**
     * En que deposito esta. NULL = todavia sin ubicar; se muestra igual, pero
     * sin poder decirle al cliente donde ir a buscarlo.
     */
    depositoId: text("deposito_id"),
    /** Precio tachado, cuando el producto esta en oferta. */
    precioAntesCentavos: integer("precio_antes_centavos"),
    moneda: text("moneda").notNull().default("USD"),

    /**
     * Existencias disponibles. Va con decimales A PROPOSITO: una ferreteria
     * vende cable por metro y cemento por kilo, y truncar 13.5 kg a 13
     * corromperia el inventario del comercio.
     *
     * Ojo: esto es MERCANCIA, no dinero. El dinero sigue siendo entero en
     * centavos, sin excepcion.
     */
    existencias: real("existencias").notNull().default(0),
    /** Si el comercio no lleva inventario, no se muestra el contador. */
    controlaExistencias: integer("controla_existencias", { mode: "boolean" })
      .notNull()
      .default(true),
    /** Como se vende: unidad, metro, kg, saco… */
    unidad: text("unidad"),
    pesoGramos: integer("peso_gramos"),

    estado: text("estado")
      .$type<(typeof ESTADOS_PRODUCTO)[number]>()
      .notNull()
      .default("borrador"),
    destacado: integer("destacado", { mode: "boolean" })
      .notNull()
      .default(false),

    // De donde salio este producto. Sin esto, cada sincronizacion crearia
    // duplicados en vez de actualizar lo que ya existe.
    fuenteId: text("fuente_id").references(() => fuentesCatalogo.id, {
      onDelete: "set null",
    }),
    /** Id que tiene el producto en la tienda de origen. */
    externoId: text("externo_id"),
    sincronizadoEn: integer("sincronizado_en", { mode: "timestamp" }),

    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    actualizadoEn: integer("actualizado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    uniqueIndex("idx_productos_tienda_slug").on(t.tiendaId, t.slug),
    // La pareja tienda + id de origen es lo que hace que reimportar actualice
    // en vez de duplicar.
    uniqueIndex("idx_productos_externo").on(t.tiendaId, t.externoId),
    index("idx_productos_estado").on(t.estado),
    index("idx_productos_categoria").on(t.categoriaId),
    index("idx_productos_destacado").on(t.destacado),
  ],
);

export const imagenesProducto = sqliteTable(
  "imagenes_producto",
  {
    id: text("id").primaryKey(),
    productoId: text("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),
    /**
     * Una foto vive en uno de dos sitios, nunca en los dos:
     *  - `clave`: subida por el comercio a nuestro bucket (env.BUCKET).
     *  - `url`: ya estaba publicada en la tienda de origen y se muestra de ahi.
     * Las fotos que llegan por sincronizacion NO se copian.
     */
    clave: text("clave"),
    url: text("url"),
    textoAltEs: text("texto_alt_es"),
    textoAltEn: text("texto_alt_en"),
    orden: integer("orden").notNull().default(0),
  },
  (t) => [index("idx_imagenes_producto").on(t.productoId)],
);

/* -------------------------------------------------------------------------- */
/* Pedidos                                                                    */
/* -------------------------------------------------------------------------- */

export const ESTADOS_PEDIDO = [
  "pendiente_pago",
  "pagado",
  "preparando",
  "enviado",
  "entregado",
  "cancelado",
  "reembolsado",
] as const;

export const pedidos = sqliteTable(
  "pedidos",
  {
    id: text("id").primaryKey(),
    /** Numero corto que ve el cliente, por ejemplo MT-000124. */
    numero: text("numero").notNull().unique(),
    clienteId: text("cliente_id")
      .notNull()
      .references(() => user.id),
    estado: text("estado")
      .$type<(typeof ESTADOS_PEDIDO)[number]>()
      .notNull()
      .default("pendiente_pago"),
    subtotalCentavos: integer("subtotal_centavos").notNull().default(0),
    envioCentavos: integer("envio_centavos").notNull().default(0),
    impuestosCentavos: integer("impuestos_centavos").notNull().default(0),
    totalCentavos: integer("total_centavos").notNull().default(0),
    moneda: text("moneda").notNull().default("USD"),
    /**
     * EL MERCADO DONDE SE HIZO ESTA VENTA (fase 2 del plan multi-país).
     *
     * Se guarda EN EL PEDIDO y no se deduce de la tienda: un pedido es un
     * hecho ya ocurrido, y si mañana un comercio cambia de vitrina, sus
     * ventas viejas tienen que seguir contando donde ocurrieron. Es la misma
     * razón por la que la factura copia los datos del emisor en vez de
     * apuntarlos.
     *
     * Los pedidos anteriores al 17 ago 2026 quedan en `US` por el default,
     * que es la verdad: hasta ese día solo existía mercatren.com.
     */
    mercado: text("mercado").notNull().default("US"),
    /** Como eligio pagar. La forma decide que pasa despues del pedido. */
    metodoPago: text("metodo_pago").$type<(typeof METODOS_PAGO)[number]>(),
    /**
     * Direccion completa guardada como JSON para no perder el historico:
     * si el cliente cambia su direccion manana, el pedido viejo conserva
     * a donde se mando de verdad.
     */
    direccionEntrega: text("direccion_entrega", { mode: "json" }),
    paisDestino: text("pais_destino"),
    /** Con quien hablar por este pedido. */
    telefonoContacto: text("telefono_contacto"),
    notasCliente: text("notas_cliente"),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    actualizadoEn: integer("actualizado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("idx_pedidos_cliente").on(t.clienteId),
    index("idx_pedidos_estado").on(t.estado),
    /* El índice EMPIEZA por el país, como manda la fase 2: así sirve tanto
       para «los pedidos de Chile» como para «los de Chile en tal estado». Al
       revés solo serviría para lo segundo. */
    index("idx_pedidos_mercado_estado").on(t.mercado, t.estado),
  ],
);

export const itemsPedido = sqliteTable(
  "items_pedido",
  {
    id: text("id").primaryKey(),
    pedidoId: text("pedido_id")
      .notNull()
      .references(() => pedidos.id, { onDelete: "cascade" }),
    productoId: text("producto_id").references(() => productos.id),
    tiendaId: text("tienda_id")
      .notNull()
      .references(() => tiendas.id),
    /** Copia del titulo al momento de comprar: el producto puede cambiar despues. */
    titulo: text("titulo").notNull(),
    precioUnitarioCentavos: integer("precio_unitario_centavos").notNull(),
    cantidad: integer("cantidad").notNull().default(1),
    subtotalCentavos: integer("subtotal_centavos").notNull(),
    comisionCentavos: integer("comision_centavos").notNull().default(0),
  },
  (t) => [
    index("idx_items_pedido").on(t.pedidoId),
    index("idx_items_tienda").on(t.tiendaId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Pagos                                                                      */
/* -------------------------------------------------------------------------- */

export const METODOS_PAGO = ["stripe", "zelle", "billetera"] as const;
export const ESTADOS_PAGO = [
  "pendiente",
  "confirmado",
  "rechazado",
  "reembolsado",
] as const;

export const pagos = sqliteTable(
  "pagos",
  {
    id: text("id").primaryKey(),
    pedidoId: text("pedido_id")
      .notNull()
      .references(() => pedidos.id, { onDelete: "cascade" }),
    metodo: text("metodo").$type<(typeof METODOS_PAGO)[number]>().notNull(),
    estado: text("estado")
      .$type<(typeof ESTADOS_PAGO)[number]>()
      .notNull()
      .default("pendiente"),
    montoCentavos: integer("monto_centavos").notNull(),
    moneda: text("moneda").notNull().default("USD"),
    /** Identificador en el proveedor (Stripe, tokiia, etc.). */
    referenciaExterna: text("referencia_externa"),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    actualizadoEn: integer("actualizado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("idx_pagos_pedido").on(t.pedidoId),
    index("idx_pagos_estado").on(t.estado),
  ],
);

/* -------------------------------------------------------------------------- */
/* Pagos por Zelle y billetera (WaaS de tokiia.com)                           */
/* -------------------------------------------------------------------------- */
/*
 * Flujo del negocio:
 *   1. El pagador (normalmente un familiar que vive en Estados Unidos) hace la
 *      transferencia por Zelle y sube la captura del envio.
 *   2. Un VALIDADOR revisa que el pago este de verdad en el banco.
 *   3. Al aprobarlo, el monto se acredita a la billetera del comercio.
 *   4. El comercio entrega el producto en su pais.
 *
 * La billetera se apoya en el servicio WaaS de tokiia.com: el saldo que se
 * guarda aqui es un espejo, la fuente de verdad es el proveedor.
 */

export const billeteras = sqliteTable(
  "billeteras",
  {
    id: text("id").primaryKey(),
    /**
     * La billetera es DEL COMERCIO, no de una persona. Si manana cambia el
     * dueno de la tienda, el saldo sigue siendo de la tienda.
     */
    tiendaId: text("tienda_id")
      .notNull()
      .references(() => tiendas.id, { onDelete: "cascade" })
      .unique(),
    /** Espejo del saldo del proveedor. La fuente de verdad es tokiia.com. */
    saldoCentavos: integer("saldo_centavos").notNull().default(0),
    moneda: text("moneda").notNull().default("USD"),
    proveedor: text("proveedor").notNull().default("tokiia"),
    /** Identificador de la billetera dentro del proveedor WaaS. */
    proveedorBilleteraId: text("proveedor_billetera_id"),
    estado: text("estado")
      .$type<"activa" | "bloqueada">()
      .notNull()
      .default("activa"),
    sincronizadoEn: integer("sincronizado_en", { mode: "timestamp" }),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("idx_billeteras_tienda").on(t.tiendaId)],
);

export const TIPOS_MOVIMIENTO = [
  "recarga",
  "compra",
  "reembolso",
  "ajuste",
] as const;

export const movimientosBilletera = sqliteTable(
  "movimientos_billetera",
  {
    id: text("id").primaryKey(),
    billeteraId: text("billetera_id")
      .notNull()
      .references(() => billeteras.id, { onDelete: "cascade" }),
    tipo: text("tipo").$type<(typeof TIPOS_MOVIMIENTO)[number]>().notNull(),
    /** Positivo suma, negativo resta. Siempre en centavos. */
    montoCentavos: integer("monto_centavos").notNull(),
    saldoResultanteCentavos: integer("saldo_resultante_centavos").notNull(),
    /** De donde viene: id del pago Zelle, del pedido, del ajuste manual. */
    referencia: text("referencia"),
    nota: text("nota"),
    /** Quien lo hizo, cuando fue un movimiento a mano. */
    hechoPorId: text("hecho_por_id").references(() => user.id),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("idx_movimientos_billetera").on(t.billeteraId),
    index("idx_movimientos_referencia").on(t.referencia),
  ],
);

/**
 * Los retiros de la COMISIÓN, que son de Mercatren, no del comercio.
 *
 * Son dos billeteras distintas y no se mezclan nunca:
 *
 * - La del comercio: entra el 97% de cada pago aprobado, sale cuando él pide
 *   su dinero. Vive en `billeteras` y sus retiros son `pagos_zelle` con
 *   `tipo = 'retiro'`.
 * - La del operador (esta): entra el 3% de cada pago aprobado, sale cuando
 *   Mercatren retira lo suyo. Los ingresos se calculan de las comisiones ya
 *   cobradas; lo único que hay que guardar son las salidas.
 *
 * Confundirlas sería restarle al comercio dinero que nunca fue suyo, o
 * apuntarnos un saldo que en realidad le debemos a él.
 *
 * LA NOTA NO SE MUESTRA. Es interna del operador: se guarda para la
 * contabilidad, pero no sale en ninguna pantalla.
 */

/**
 * LA CAPTURA DE LA TRANSFERENCIA QUE SE LE HIZO AL COMERCIO.
 *
 * ══ POR QUÉ HACE FALTA ══
 *
 * Una ACH tarda uno o dos días y un wire internacional puede tardar más. En ese
 * hueco el comercio ve «pagado» en el panel y **nada en su cuenta**, y lo único
 * que puede hacer es escribir preguntando si de verdad se mandó. La captura del
 * banco contesta esa pregunta antes de que la haga: ya salió, aquí está, es
 * cuestión de esperar.
 *
 * ══ TABLA NUEVA, NO UNA COLUMNA ══
 *
 * `schema.sql` solo trae `CREATE TABLE IF NOT EXISTS`, así que una columna
 * nueva **no llegaría sola a producción** — la tabla `retiros` ya existe allá.
 * Es la misma razón por la que `disputas`, `hitos_pedido` y `huellas_comprobante`
 * son tablas.
 *
 * Y admite varias por retiro a propósito: un wire con dos comprobantes —el de
 * salida y el de acreditación— es normal.
 */
export const comprobantesRetiro = sqliteTable(
  "comprobantes_retiro",
  {
    id: text("id").primaryKey(),
    retiroId: text("retiro_id")
      .notNull()
      .references(() => retiros.id, { onDelete: "cascade" }),
    /** La clave en el bucket. Se sirve por `/media`, que exige sesión. */
    clave: text("clave").notNull(),
    /** Quién del equipo la subió. Un documento sin autor no defiende a nadie. */
    subidoPorId: text("subido_por_id").references(() => user.id),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("idx_comprobantes_retiro").on(t.retiroId)],
);

export const retirosFee = sqliteTable(
  "retiros_fee",
  {
    id: text("id").primaryKey(),
    /** Siempre en centavos enteros, como todo el dinero del proyecto. */
    montoCentavos: integer("monto_centavos").notNull(),
    moneda: text("moneda").notNull().default("USD"),
    /** Cuándo se hizo el retiro de verdad. */
    hechoEn: integer("hecho_en", { mode: "timestamp" }).notNull(),
    /** Interna: no se muestra en la interfaz. */
    nota: text("nota"),
    /** De dónde salió el registro: 'import' del sistema anterior, o 'live'. */
    origen: text("origen").$type<"import" | "live">().notNull().default("live"),
    hechoPorId: text("hecho_por_id").references(() => user.id),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("idx_retiros_fee_fecha").on(t.hechoEn)],
);

/* -------------------------------------------------------------------------- */
/* Retiros del comercio                                                       */
/* -------------------------------------------------------------------------- */

export const FORMAS_RETIRO = ["comercio", "zelle", "ach", "wire"] as const;

export const ESTADOS_RETIRO = [
  "solicitado",
  "pagado",
  "rechazado",
  "cancelado",
] as const;

/**
 * Cuando el comercio pide que le manden su dinero.
 *
 * POR QUÉ NO VA EN `pagos_zelle`. Los 70 retiros del histórico sí viven ahí,
 * porque llegaron así del sistema anterior y ese histórico está congelado.
 * Pero un retiro de verdad no es un pago de Zelle: no tiene pagador, no tiene
 * comprobante que validar, y sobre todo tiene un estado ANTES de existir como
 * movimiento — está pedido pero todavía no se ha hecho. Meterlo ahí obligaría
 * a que media tabla tuviera columnas vacías y a que cada consulta de pagos
 * recordara excluirlo.
 *
 * Así que el dinero que ya salió se cuenta de dos sitios: el histórico
 * congelado y esta tabla. Son conjuntos que no se pisan.
 *
 * EL SALDO SE APARTA AL PEDIRLO, no al pagarlo. Entre que el comercio lo pide
 * y nosotros vamos al banco pasan horas; si en ese rato el saldo siguiera
 * entero, con $2,000 podría pedir $1,000 tres veces y le deberíamos $1,000 que
 * nunca tuvo. Por eso la billetera muestra tres números: lo que tiene, lo que
 * está en trámite y lo que puede pedir hoy.
 *
 * NOSOTROS TRANSFERIMOS A MANO. Esto no mueve dinero solo: alguien del equipo
 * hace la transferencia en el banco y luego marca aquí que ya la hizo. El
 * botón no paga; deja constancia de que se pagó.
 */
export const retiros = sqliteTable(
  "retiros",
  {
    id: text("id").primaryKey(),
    tiendaId: text("tienda_id")
      .notNull()
      .references(() => tiendas.id, { onDelete: "cascade" }),
    /** Quién lo pidió. Se guarda por si después hay que preguntarle. */
    solicitadoPorId: text("solicitado_por_id").references(() => user.id),
    /** Siempre en centavos enteros, como todo el dinero del proyecto. */
    montoCentavos: integer("monto_centavos").notNull(),
    moneda: text("moneda").notNull().default("USD"),
    estado: text("estado")
      .$type<(typeof ESTADOS_RETIRO)[number]>()
      .notNull()
      .default("solicitado"),
    /**
     * Cómo quiere recibirlo:
     *
     * - `comercio`: a la billetera de otro comercio de Mercatren. No sale del
     *   sistema, así que es inmediato y no cuesta nada.
     * - `zelle`: a su correo o teléfono de Zelle. Es la vía rápida, pero SOLO
     *   hasta `ZELLE_RETIRO_MAXIMO_CENTAVOS` — los bancos vigilan Zelle con
     *   un umbral más bajo que ACH y una cuenta que paga proveedores por ahí
     *   todos los días termina restringida (ver `src/lib/dinero.ts`).
     * - `ach`: transferencia normal a su cuenta de Estados Unidos.
     * - `wire`: transferencia bancaria, para montos grandes o con prisa.
     */
    forma: text("forma").$type<(typeof FORMAS_RETIRO)[number]>().notNull(),
    /**
     * A dónde va, según la forma. Se guarda como JSON porque cada forma pide
     * datos distintos y no tiene sentido una columna por cada campo posible.
     *
     * Y se guarda TAL COMO ESTABA el día del retiro: si el comercio cambia de
     * banco el año que viene, el retiro viejo tiene que seguir diciendo a
     * dónde se mandó de verdad.
     */
    destino: text("destino", { mode: "json" }),
    /** Cuando la forma es `comercio`: a qué tienda va. */
    destinoTiendaId: text("destino_tienda_id").references(() => tiendas.id),
    /** Lo que el comercio quiera aclarar al pedirlo. */
    notaComercio: text("nota_comercio"),
    /** Por qué no se hizo. Obligatorio al rechazar: nadie se queda sin saber. */
    motivoRechazo: text("motivo_rechazo"),
    /** Referencia que dé el banco. Es lo que el comercio reclama si no llega. */
    referencia: text("referencia"),
    /** Quién del equipo lo resolvió. */
    resueltoPorId: text("resuelto_por_id").references(() => user.id),
    resueltoEn: integer("resuelto_en", { mode: "timestamp" }),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("idx_retiros_tienda").on(t.tiendaId),
    index("idx_retiros_estado").on(t.estado),
    index("idx_retiros_fecha").on(t.creadoEn),
  ],
);

/* -------------------------------------------------------------------------- */
/* Depositos: donde esta fisicamente la mercancia                             */
/* -------------------------------------------------------------------------- */

/**
 * Un deposito del comercio.
 *
 * Bley tiene cuatro en El Vigia (DEPOSITO FERRETERIA, FERRETERIA, DEPOSITO
 * CENTRO, DEPOSITO ZONA) y la bodega de Caracas sin subdividir. Cada producto
 * vive en uno, y de ahi sale la respuesta a la unica pregunta que le importa
 * al cliente que ya decidio comprar: donde lo busco.
 *
 * LA ZONA MANDA, NO LA DIRECCION. La zona (`el-vigia`, `caracas`) es la que
 * decide si algo le llega a alguien; la direccion es para que sepa a que
 * puerta tocar. Por eso la zona es obligatoria y la direccion no: el sistema
 * de Bley solo guarda "Merida el vigia", asi que las direcciones de verdad
 * hay que escribirlas a mano y llegan despues.
 */
export const depositos = sqliteTable(
  "depositos",
  {
    id: text("id").primaryKey(),
    tiendaId: text("tienda_id")
      .notNull()
      .references(() => tiendas.id, { onDelete: "cascade" }),
    /** Como lo llama el comercio: "DEPOSITO CENTRO". */
    nombre: text("nombre").notNull(),
    /** Que guarda: "HIERRO, CABILLA, LAMINAS". Ayuda mas que la direccion. */
    queGuarda: text("que_guarda"),
    /** Slug de `src/lib/entrega/zonas.ts`. Lo que decide a quien le llega. */
    zona: text("zona").notNull(),
    /** La direccion para ir a buscarlo. Se escribe a mano; puede faltar. */
    direccion: text("direccion"),
    /** Referencia visual: "al lado de la plaza". Opcional. */
    comoLlegar: text("como_llegar"),
    /** El nombre que tiene en el sistema del comercio, para sincronizar. */
    externoNombre: text("externo_nombre"),
    activo: integer("activo", { mode: "boolean" }).notNull().default(true),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("idx_depositos_tienda").on(t.tiendaId),
    index("idx_depositos_zona").on(t.zona),
    uniqueIndex("idx_depositos_tienda_nombre").on(t.tiendaId, t.nombre),
  ],
);

export const ORIGENES_PAGO_ZELLE = ["import", "live"] as const;
export const TIPOS_PAGO_ZELLE = ["entrada", "retiro"] as const;
export const ESTADOS_PAGO_ZELLE = [
  "aprobado",
  "pendiente",
  "rechazado",
] as const;
export const TIPOS_PAGADOR = [
  "persona",
  "empresa",
  "cuenta_bancaria",
  "desconocido",
] as const;

/**
 * Pagos por Zelle. Una sola tabla para dos cosas:
 *
 *  - `origen = "import"`: el historico ya procesado que se trajo del sistema
 *    anterior. Esos registros estan congelados y no se vuelven a tocar.
 *  - `origen = "live"`: lo que entra por este sistema de ahora en adelante.
 *
 * REGLA DE CONTABILIDAD: solo `tipo = "entrada"` suma. Los retiros se guardan
 * y se listan, pero JAMAS entran en un total.
 */
export const pagosZelle = sqliteTable(
  "pagos_zelle",
  {
    id: text("id").primaryKey(),
    origen: text("origen")
      .$type<(typeof ORIGENES_PAGO_ZELLE)[number]>()
      .notNull()
      .default("live"),
    tipo: text("tipo")
      .$type<(typeof TIPOS_PAGO_ZELLE)[number]>()
      .notNull()
      .default("entrada"),
    estado: text("estado")
      .$type<(typeof ESTADOS_PAGO_ZELLE)[number]>()
      .notNull()
      .default("pendiente"),

    // Dinero, siempre en centavos enteros.
    montoCentavos: integer("monto_centavos").notNull(),
    comisionCentavos: integer("comision_centavos").notNull().default(0),
    netoCentavos: integer("neto_centavos").notNull().default(0),
    moneda: text("moneda").notNull().default("USD"),

    /**
     * Captura del comprobante. En el historico es una direccion publica del
     * almacenamiento original (no se migraron las imagenes); en los pagos
     * nuevos apunta al bucket propio.
     */
    reciboUrl: text("recibo_url"),

    notas: text("notas"),
    motivoRechazo: text("motivo_rechazo"),

    /** Cuando el pagador subio la captura. */
    subidoEn: integer("subido_en", { mode: "timestamp" }),
    /** Cuando el validador la aprobo. */
    aprobadoEn: integer("aprobado_en", { mode: "timestamp" }),
    /** Fecha del pago segun el propio comprobante. */
    fechaTransaccion: integer("fecha_transaccion", { mode: "timestamp" }),

    /** Numero de confirmacion que da Zelle. */
    codigoConfirmacion: text("codigo_confirmacion"),

    // De donde vino el pago. Ojo: en las capturas, el nombre de origen suele
    // ser el producto bancario y no la persona, por eso se guarda el texto
    // crudo y aparte lo que se pudo deducir.
    pagadorNombreCrudo: text("pagador_nombre_crudo"),
    pagadorNombre: text("pagador_nombre"),
    pagadorCorreo: text("pagador_correo"),
    pagadorTipo: text("pagador_tipo")
      .$type<(typeof TIPOS_PAGADOR)[number]>()
      .notNull()
      .default("desconocido"),
    bancoOrigen: text("banco_origen"),
    cuentaUltimos4: text("cuenta_ultimos4"),

    // Cuenta que recibio el dinero. El nombre viene con muchas variantes del
    // lector automatico; el correo es el dato exacto.
    receptorNombreCrudo: text("receptor_nombre_crudo"),
    cuentaReceptora: text("cuenta_receptora"),

    plataforma: text("plataforma"),
    /** Sentido que traia el comprobante original (dato crudo, informativo). */
    direccionComprobante: text("direccion_comprobante"),

    // A que comercio pertenece el pago.
    sellerCuenta: text("seller_cuenta"),
    sellerReferencia: text("seller_referencia"),
    tiendaId: text("tienda_id").references(() => tiendas.id),
    /**
     * Que pedido esta pagando. El historico importado no tiene pedido (venia
     * de otro sistema); los pagos nuevos si.
     */
    pedidoId: text("pedido_id").references(() => pedidos.id),

    // Quien lo reviso (solo para los pagos nuevos).
    validadorId: text("validador_id").references(() => user.id),
    revisadoEn: integer("revisado_en", { mode: "timestamp" }),

    // Enlace con la billetera cuando el pago se acredita.
    billeteraId: text("billetera_id").references(() => billeteras.id),
    movimientoBilleteraId: text("movimiento_billetera_id").references(
      () => movimientosBilletera.id,
    ),

    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("idx_zelle_estado").on(t.estado),
    index("idx_zelle_tipo").on(t.tipo),
    index("idx_zelle_origen").on(t.origen),
    index("idx_zelle_subido").on(t.subidoEn),
    index("idx_zelle_cuenta_receptora").on(t.cuentaReceptora),
    index("idx_zelle_banco").on(t.bancoOrigen),
    index("idx_zelle_codigo").on(t.codigoConfirmacion),
    index("idx_zelle_monto").on(t.montoCentavos),
    index("idx_zelle_seller").on(t.sellerCuenta),
  ],
);

/**
 * La huella de cada captura de pago subida.
 *
 * ══ PARA QUE LA MISMA IMAGEN NO SE COBRE DOS VECES ══
 *
 * Zelle no manda un cobro: manda una FOTO. Y una foto se guarda, se reenvia y
 * se vuelve a subir en otro pedido. Guardando el SHA-256 del archivo, el
 * mismo archivo se reconoce aunque le cambien el nombre.
 *
 * No detecta una captura reeditada —cambiarle un pixel da otra huella— y no
 * pretende: atrapa el caso comun y perezoso. Lo demas lo mira la persona, con
 * las otras senales de `src/lib/zelle/alertas.ts`.
 *
 * ══ POR QUE ES UNA TABLA Y NO UNA COLUMNA EN `pagos_zelle` ══
 *
 * `schema.sql` solo trae `CREATE TABLE IF NOT EXISTS`, asi que una columna
 * nueva NO llega sola a una base que ya existe: habria que aplicar el ALTER a
 * mano. Una tabla nueva se crea sola en la siguiente publicacion.
 */
export const huellasComprobante = sqliteTable(
  "huellas_comprobante",
  {
    pagoId: text("pago_id")
      .primaryKey()
      .references(() => pagosZelle.id, { onDelete: "cascade" }),
    /** SHA-256 del archivo, en hexadecimal. */
    huella: text("huella").notNull(),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("idx_huellas_comprobante").on(t.huella)],
);

/**
 * LOS CONTRACARGOS: cuando el comprador desconoce el cargo en su tarjeta.
 *
 * ══ POR QUE HAY QUE GUARDARLOS ══
 *
 * Una tarjeta se puede revertir hasta 120 dias despues del cobro. Hasta hoy el
 * sistema no escuchaba ese aviso de Stripe: el dinero salia de la cuenta, el
 * comercio ya estaba acreditado y la mercancia ya estaba entregada, y **nadie
 * se enteraba** hasta mirar el extracto del banco.
 *
 * ══ LO QUE ESTA TABLA NO HACE, A PROPOSITO ══
 *
 * No revierte nada. Recuperar ese dinero del comercio es una decision de
 * negocio —puede tocarle a Mercatren, puede negociarse, puede ganarse la
 * disputa— y el sistema no la toma solo. Lo que hace es que se sepa el mismo
 * dia, con todo lo que hace falta para responderle a Stripe.
 */
export const ESTADOS_DISPUTA = [
  "abierta",
  "ganada",
  "perdida",
  "retirada",
] as const;

export const disputas = sqliteTable(
  "disputas",
  {
    /** El id de la disputa en Stripe (`dp_...`). Es unico alla y aqui. */
    id: text("id").primaryKey(),
    /** El cobro disputado (`pi_...`), que es como se enlaza con `pagos`. */
    intentoId: text("intento_id"),
    pedidoId: text("pedido_id").references(() => pedidos.id),
    estado: text("estado")
      .$type<(typeof ESTADOS_DISPUTA)[number]>()
      .notNull()
      .default("abierta"),
    montoCentavos: integer("monto_centavos").notNull().default(0),
    moneda: text("moneda").notNull().default("USD"),
    /** El motivo que da la red de la tarjeta (`fraudulent`, `product_not_received`...). */
    motivo: text("motivo"),
    /** Hasta cuando hay para mandar pruebas. Pasada esa fecha se pierde sola. */
    respondeHasta: integer("responde_hasta", { mode: "timestamp" }),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    actualizadoEn: integer("actualizado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("idx_disputas_pedido").on(t.pedidoId),
    index("idx_disputas_estado").on(t.estado),
  ],
);

/**
 * LO QUE LE FUE PASANDO A UN PEDIDO, Y QUIEN LO HIZO.
 *
 * `pedidos.estado` dice donde esta hoy y `actualizado_en` cuando se movio por
 * ultima vez, pero no queda constancia de QUIEN lo movio ni de por donde paso.
 * Cuando un comprador reclama que nunca recibio su compra, «entregado» a secas
 * no defiende a nadie; «marcado como entregado por Fulano el 12 de agosto» si.
 *
 * Tabla nueva y no columnas: `schema.sql` solo trae `CREATE TABLE IF NOT
 * EXISTS`, asi que una columna no llegaria sola a produccion.
 */
export const hitosPedido = sqliteTable(
  "hitos_pedido",
  {
    id: text("id").primaryKey(),
    pedidoId: text("pedido_id")
      .notNull()
      .references(() => pedidos.id, { onDelete: "cascade" }),
    /** El estado al que paso: `pagado`, `enviado`, `entregado`... */
    hito: text("hito").notNull(),
    /** Quien lo hizo. Null cuando lo hizo el sistema (un cobro confirmado). */
    hechoPorId: text("hecho_por_id").references(() => user.id),
    /** Como se llamaba entonces: si esa cuenta se borra, el registro aguanta. */
    hechoPorNombre: text("hecho_por_nombre"),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("idx_hitos_pedido").on(t.pedidoId)],
);

/**
 * COBROS PEDIDOS DESDE EL SISTEMA DE UN COMERCIO.
 *
 * La cajera de una ferreteria hace su factura como todos los dias, toca
 * «Cobrar por Mercatren», y el correo con el enlace de pago sale solo. Quien
 * paga —el cliente o su familiar en Estados Unidos— abre y paga con tarjeta o
 * por Zelle desde donde este.
 *
 * ══ POR QUE UNA TABLA APARTE Y NO UN PEDIDO NORMAL ══
 *
 * Un pedido de Mercatren tiene renglones de catalogo, existencias que
 * descontar y una direccion de entrega. Aqui no hay nada de eso: la venta ya
 * ocurrio en el local del comercio, la mercancia ya esta en el mostrador y lo
 * unico que falta es el dinero. Meterlo en `pedidos` obligaria a inventar
 * productos que no existen en nuestro catalogo.
 *
 * Lo que SI comparte es el cobro: cuando se paga, se crea el pago y se le
 * acredita al comercio igual que cualquier otra venta.
 */
export const ESTADOS_COBRO = [
  "abierto",
  "pagado",
  "vencido",
  "cancelado",
  /** Pagado y devuelto. Cerrado: si hay que cobrar otra vez, se crea otro. */
  "devuelto",
] as const;

export const cobrosSolicitados = sqliteTable(
  "cobros_solicitados",
  {
    id: text("id").primaryKey(),
    tiendaId: text("tienda_id")
      .notNull()
      .references(() => tiendas.id, { onDelete: "cascade" }),
    /**
     * El secreto que viaja en el correo. NO es el id: ese aparece en el
     * sistema del comercio y en sus pantallas, y quien lo viera podria abrir
     * el cobro de otro.
     */
    enlace: text("enlace").notNull().unique(),
    /** El numero de factura del comercio. Es su lado del rastro. */
    referencia: text("referencia").notNull(),
    montoCentavos: integer("monto_centavos").notNull(),
    moneda: text("moneda").notNull().default("USD"),
    estado: text("estado")
      .$type<(typeof ESTADOS_COBRO)[number]>()
      .notNull()
      .default("abierto"),
    /** A quien se le cobra. La cuenta se abre sola si no la tenia. */
    clienteId: text("cliente_id").references(() => user.id),
    contactoCorreo: text("contacto_correo").notNull(),
    contactoNombre: text("contacto_nombre"),
    /** Lo que el comercio quiera que vea quien paga. */
    concepto: text("concepto"),
    /** Cuando deja de poder pagarse. Se compara con el reloj, no se marca. */
    venceEn: integer("vence_en", { mode: "timestamp" }),
    /** El cobro real, cuando se paga. Enlaza con el resto del sistema. */
    pagoId: text("pago_id"),
    pagadoEn: integer("pagado_en", { mode: "timestamp" }),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("idx_cobros_tienda").on(t.tiendaId),
    index("idx_cobros_estado").on(t.estado),
    index("idx_cobros_referencia").on(t.referencia),
  ],
);

/* -------------------------------------------------------------------------- */
/* Tipos listos para usar en el resto de la aplicacion                        */
/* -------------------------------------------------------------------------- */

export type Usuario = typeof user.$inferSelect;
export type Tienda = typeof tiendas.$inferSelect;
export type Categoria = typeof categorias.$inferSelect;
export type FuenteCatalogo = typeof fuentesCatalogo.$inferSelect;
export type Producto = typeof productos.$inferSelect;
export type ImagenProducto = typeof imagenesProducto.$inferSelect;
export type Pedido = typeof pedidos.$inferSelect;
export type ItemPedido = typeof itemsPedido.$inferSelect;
export type Pago = typeof pagos.$inferSelect;
export type Billetera = typeof billeteras.$inferSelect;
export type MovimientoBilletera = typeof movimientosBilletera.$inferSelect;
export type PagoZelle = typeof pagosZelle.$inferSelect;
export type PagoZelleNuevo = typeof pagosZelle.$inferInsert;

/**
 * Ajustes internos del sitio que no pueden vivir en el repositorio.
 *
 * Existe por un caso concreto: la clave con la que se firman las sesiones.
 * Sin ella nadie puede entrar, y no puede ir en el codigo porque el
 * repositorio es publico. Lo normal es cargarla como variable de entorno en
 * el panel; si ese paso no se hizo, el sitio se genera una y la guarda aqui,
 * en su propia base, para poder funcionar solo.
 *
 * La variable de entorno SIEMPRE manda sobre lo que haya aqui.
 */
export const configuracion = sqliteTable("configuracion", {
  clave: text("clave").primaryKey(),
  valor: text("valor").notNull(),
  creadoEn: integer("creado_en", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * LAS VARIANTES DE UN PRODUCTO: talla, color, o las dos.
 *
 * El modelo es el de Amazon, y por algo es el suyo: un producto PADRE que
 * agrupa y no se vende, y variantes HIJAS que sí se venden, cada una con su
 * propio precio y su propio stock. Una camisa talla M en azul y la misma en
 * rojo son dos cosas distintas en el depósito: si comparten el stock, se
 * vende una que no existe.
 *
 * POR QUÉ UNA TABLA NUEVA Y NO COLUMNAS EN `productos`. `schema.sql` corre en
 * cada publicación y solo hace `CREATE TABLE IF NOT EXISTS`, así que una
 * tabla nueva se crea sola en producción. Una columna nueva necesitaría un
 * ALTER a mano con el token, y entre que se publica el código y se aplica el
 * ALTER el sitio devuelve 500 en cada ficha. Pasó el 5 ago 2026 con
 * `deposito_id` y no se repite.
 *
 * UN PRODUCTO SIN VARIANTES SIGUE FUNCIONANDO IGUAL. Los 689 del catálogo de
 * hoy no tienen ninguna fila aquí, y se venden como siempre: la variante es
 * opcional, no obligatoria. Un tubo de PVC no tiene talla.
 *
 * EL PRECIO DE LA VARIANTE LLEVA EL MISMO AJUSTE que el del padre: se guarda
 * lo que el proveedor cobra (`precioBaseCentavos`) y lo que se publica
 * (`precioCentavos`). Si no, una talla especial más cara se vendería sin
 * cubrir el procesador.
 */
export const variantesProducto = sqliteTable(
  "variantes_producto",
  {
    id: text("id").primaryKey(),
    productoId: text("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),

    /** Lo que diferencia esta variante. Al menos una de las dos va llena. */
    talla: text("talla"),
    color: text("color"),
    /** El color en hexadecimal, para pintar la muestra. Opcional. */
    colorHex: text("color_hex"),

    sku: text("sku"),

    /** Dinero en centavos enteros, igual que en `productos`. */
    precioBaseCentavos: integer("precio_base_centavos").notNull().default(0),
    precioCentavos: integer("precio_centavos").notNull().default(0),

    /** Su propio stock: no se comparte con el padre ni con las hermanas. */
    existencias: real("existencias").notNull().default(0),

    /** Para ordenarlas a mano: S, M, L no se ordenan solas alfabéticamente. */
    orden: integer("orden").notNull().default(0),
    activo: integer("activo", { mode: "boolean" }).notNull().default(true),

    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    actualizadoEn: integer("actualizado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("idx_variantes_producto").on(t.productoId),
    /* La misma combinación no puede existir dos veces en un producto: si no,
       el selector enseñaría "Azul · M" repetido y nadie sabría cuál compró. */
    uniqueIndex("uq_variante_combinacion").on(t.productoId, t.talla, t.color),
  ],
);

/**
 * LAS MEDIDAS FÍSICAS: peso y dimensiones.
 *
 * NO SON VARIANTES, y confundirlas es el error clásico. Una talla se elige y
 * cambia lo que se compra; un peso no se elige, se consulta. Por eso van
 * aparte: aquí no hay stock ni precio, es ficha técnica.
 *
 * Sirven para tres cosas concretas: que el cliente sepa si le entra en el
 * carro antes de manejar hasta el depósito, que el día que exista el reparto
 * se pueda calcular el flete, y que el comercio compare contra el catálogo
 * del fabricante.
 *
 * Es 1 a 1 con el producto y va en tabla aparte por lo mismo que las
 * variantes: una tabla nueva se crea sola al publicar; una columna nueva no.
 *
 * TODO EN MILÍMETROS Y GRAMOS, enteros. Ni centímetros ni kilos con coma: la
 * coma flotante pierde precisión y aquí se suman medidas. Lo que se enseña en
 * pantalla se convierte al mostrar.
 */
export const medidasProducto = sqliteTable("medidas_producto", {
  productoId: text("producto_id")
    .primaryKey()
    .references(() => productos.id, { onDelete: "cascade" }),

  pesoGramos: integer("peso_gramos"),
  largoMm: integer("largo_mm"),
  anchoMm: integer("ancho_mm"),
  altoMm: integer("alto_mm"),

  /** "Acero galvanizado", "Algodón 100%". Texto libre del comercio. */
  materialEs: text("material_es"),
  materialEn: text("material_en"),

  actualizadoEn: integer("actualizado_en", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * QUÉ VARIANTE SE VENDIÓ EN CADA LÍNEA DEL PEDIDO.
 *
 * Sin esto, al confirmarse el pago el stock se le descontaría al producto
 * padre y la talla vendida seguiría figurando disponible: se vendería tres
 * veces la única camisa M azul que había.
 *
 * Va en tabla aparte y no como columna de `items_pedido` por la misma razón
 * que las variantes: `schema.sql` crea tablas nuevas solas en cada
 * publicación, pero una columna nueva necesita un ALTER a mano y entre medias
 * el sitio se cae. Es 1 a 1 con la línea del pedido.
 */
export const itemsVariante = sqliteTable("items_variante", {
  itemPedidoId: text("item_pedido_id")
    .primaryKey()
    .references(() => itemsPedido.id, { onDelete: "cascade" }),
  varianteId: text("variante_id")
    .notNull()
    .references(() => variantesProducto.id),
});

/**
 * QUIÉN ACEPTÓ LOS TÉRMINOS, CUÁNDO Y QUÉ VERSIÓN.
 *
 * Un contrato con clic vale igual que uno en papel SOLO si se puede probar
 * quién vio qué texto y lo aceptó. Sin este registro, la reestructuración
 * legal entera queda sin firma: nadie está obligado por unos términos que no
 * consta que aceptó.
 *
 * Se guarda la VERSIÓN, no el texto: si los términos cambian a V2, aquí queda
 * probado que esta persona aceptó la V1, y qué decía la V1 lo dice el
 * historial del repositorio, que es inmutable.
 *
 * Tabla nueva a propósito (se crea sola al publicar, sin ALTER).
 */
export const aceptaciones = sqliteTable(
  "aceptaciones",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Qué aceptó: "terminos" hoy; mañana "contrato-proveedor". */
    documento: text("documento").notNull(),
    /** La versión exacta que tenía delante. */
    version: text("version").notNull(),
    /** Dónde lo aceptó: "registro" o "alta-comercio". */
    contexto: text("contexto").notNull(),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("idx_aceptaciones_usuario").on(t.userId)],
);

/* ══════════════════════════════════════════════════════════════════════════
   VENTAS A CRÉDITO DEL COMERCIO A SU CLIENTE
   ══════════════════════════════════════════════════════════════════════════

   Aprobado por el abogado del proyecto en agosto de 2026. El documento que se
   aprobó está en `docs/mercatren-ventas-a-credito.pdf`.

   LA FIGURA, QUE ES LO QUE MANDA SOBRE TODO EL DISEÑO:

   **El crédito lo da EL COMERCIO y el riesgo es suyo.** Él decide a quién, de
   cuánto y a cuántos días; él entrega la mercancía bajo su propio acuerdo con
   su cliente. Windoce, LLC no presta dinero ni sale de garante — no puede:
   prestar en Estados Unidos exige licencias de prestamista.

   Lo que hace Mercatren es, en cada abono, **comprarle al comercio la parte de
   mercancía correspondiente y pagársela**. Cada abono es una compra-venta
   cerrada, y por eso Windoce, LLC nunca financia nada: sigue comprando y
   revendiendo, que es su figura de siempre.

   POR QUÉ SON TABLAS NUEVAS Y NO COLUMNAS EN `pedidos`:

   `schema.sql` solo trae `CREATE TABLE IF NOT EXISTS`, así que una tabla nueva
   llega sola a producción en la siguiente publicación. Una columna nueva en una
   tabla que YA existe, no — hay que aplicar el ALTER a mano, y si a alguien se
   le olvida, la pantalla revienta con 500 en producción. Ya pasó el 5 ago 2026
   con `deposito_id`. Con tablas aparte, ese riesgo no existe.
   ══════════════════════════════════════════════════════════════════════════ */

export const ESTADOS_CREDITO = ["activo", "suspendido"] as const;

/**
 * El cupo que un comercio le da a UNO de sus clientes.
 *
 * No es saldo ni dinero: es un TOPE. "Hasta aquí puedes comprarme sin pagar de
 * contado". Lo que se va debiendo se calcula de los pedidos, no se guarda aquí
 * — un número de deuda guardado a mano se desincroniza el día que algo falla a
 * la mitad, y entonces nadie sabe cuál es el bueno.
 */
export const creditosCliente = sqliteTable(
  "creditos_cliente",
  {
    id: text("id").primaryKey(),
    /** Qué comercio da el crédito. */
    tiendaId: text("tienda_id")
      .notNull()
      .references(() => tiendas.id, { onDelete: "cascade" }),
    /** A qué cliente suyo. */
    clienteId: text("cliente_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** El tope, en centavos enteros. Nunca decimales. */
    topeCentavos: integer("tope_centavos").notNull().default(0),
    /** Cuántos días tiene para pagar cada compra. */
    diasPlazo: integer("dias_plazo").notNull().default(30),
    estado: text("estado")
      .$type<(typeof ESTADOS_CREDITO)[number]>()
      .notNull()
      .default("activo"),
    /**
     * QUIÉN LO ACTIVÓ Y CUÁNDO.
     *
     * Dar cupo es una decisión de dinero: tiene que quedar firmada. Si mañana
     * hay una discusión sobre cuánto se le autorizó a alguien, esto es la
     * respuesta.
     */
    activadoPorId: text("activado_por_id").references(() => user.id),
    /** Nota privada del comercio: qué documentos pidió, qué acordaron. */
    notaInterna: text("nota_interna"),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    actualizadoEn: integer("actualizado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    /* UN SOLO CUPO POR PAREJA comercio-cliente. Sin esto, dos activaciones
       seguidas dejarían dos cupos y nadie sabría cuál manda. */
    uniqueIndex("idx_credito_tienda_cliente").on(t.tiendaId, t.clienteId),
    index("idx_credito_tienda").on(t.tiendaId),
    index("idx_credito_cliente").on(t.clienteId),
  ],
);

export const ESTADOS_PEDIDO_CREDITO = ["abierto", "pagado", "vencido"] as const;

/**
 * Marca un pedido como comprado a crédito, y le pone fecha de vencimiento.
 *
 * Va uno a uno con el pedido. Lo abonado NO se guarda aquí: se suma de los
 * pagos confirmados de ese pedido. Guardar un total que también se puede
 * calcular es tener dos verdades, y el día que no coincidan hay que adivinar
 * cuál vale.
 */
export const pedidosCredito = sqliteTable(
  "pedidos_credito",
  {
    pedidoId: text("pedido_id")
      .primaryKey()
      .references(() => pedidos.id, { onDelete: "cascade" }),
    creditoId: text("credito_id")
      .notNull()
      .references(() => creditosCliente.id, { onDelete: "cascade" }),
    tiendaId: text("tienda_id")
      .notNull()
      .references(() => tiendas.id, { onDelete: "cascade" }),
    clienteId: text("cliente_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** El total que quedó a deber al comprar. Se congela: es el acuerdo. */
    totalCentavos: integer("total_centavos").notNull(),
    estado: text("estado")
      .$type<(typeof ESTADOS_PEDIDO_CREDITO)[number]>()
      .notNull()
      .default("abierto"),
    venceEn: integer("vence_en", { mode: "timestamp" }).notNull(),
    saldadoEn: integer("saldado_en", { mode: "timestamp" }),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("idx_pedcredito_tienda").on(t.tiendaId),
    index("idx_pedcredito_cliente").on(t.clienteId),
    index("idx_pedcredito_estado").on(t.estado),
  ],
);

/* ══════════════════════════════════════════════════════════════════════════
   FACTURACIÓN — las dos facturas de cada venta (7 ago 2026)

   El modelo se sostiene sobre esto: en cada operación hay una factura de
   COMPRA (el proveedor nos vende) y una de VENTA (nosotros le vendemos al
   comprador). El sitio lo dice, los términos lo dicen y el documento que
   revisó el abogado lo dice. Hasta hoy el sistema no emitía ninguna.

   TABLAS NUEVAS, NO COLUMNAS. `schema.sql` solo trae CREATE TABLE IF NOT
   EXISTS, así que una base que ya existe no recibe columnas nuevas y la
   pantalla revienta con 500 (pasó el 5 ago con `deposito_id`).
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * EL CONTADOR DE CADA SERIE DE DOCUMENTOS.
 *
 * POR QUÉ UNA TABLA Y NO `COUNT(*) + 1`, que es como se numeran los pedidos:
 *
 * Un correlativo de facturas **no puede saltar ni repetir**. Es lo primero que
 * mira una revisión. `COUNT(*) + 1` falla en las dos cosas: si dos ventas se
 * confirman en el mismo instante, las dos cuentan lo mismo y piden el mismo
 * número; y si alguna vez se borra una fila, el siguiente número repite uno ya
 * emitido.
 *
 * Aquí el número se pide con un `UPDATE ... SET ultimo = ultimo + 1 RETURNING`,
 * que en SQLite es una sola operación atómica: dos peticiones a la vez reciben
 * números distintos, siempre, sin bloqueos ni reintentos.
 *
 * En los pedidos se dejó `COUNT(*)` como estaba a propósito: un hueco en la
 * numeración de pedidos no le importa a nadie, y cambiarlo tocaría código que
 * hoy funciona.
 */
export const seriesDocumento = sqliteTable("series_documento", {
  /** `factura_venta` · `orden_compra`. */
  id: text("id").primaryKey(),
  prefijo: text("prefijo").notNull(),
  /** El último número YA emitido. El siguiente es este + 1. */
  ultimo: integer("ultimo").notNull().default(0),
});

export const TIPOS_FACTURA = ["venta"] as const;

/**
 * LA FACTURA DE VENTA: Windoce, LLC al comprador.
 *
 * SE EMITE CUANDO EL PAGO QUEDA CONFIRMADO, no al crear el pedido. Un pedido
 * sin pagar no es una venta y no puede tener factura.
 *
 * LOS DATOS DE LAS PARTES SE COPIAN, no se apuntan. Si mañana la sociedad
 * cambia de nombre o el comprador de dirección, la factura vieja tiene que
 * seguir diciendo lo que decía el día que se emitió. Por eso `emisor_*` y
 * `receptor_*` son texto congelado y no una referencia.
 *
 * UNA VEZ EMITIDA NO SE TOCA. Si hay que corregir, se emite una nota de
 * crédito; jamás se edita el documento ni se reusa su número.
 */
export const facturas = sqliteTable(
  "facturas",
  {
    id: text("id").primaryKey(),
    /** Correlativo sin huecos: MT-F-000001. */
    numero: text("numero").notNull().unique(),
    tipo: text("tipo")
      .$type<(typeof TIPOS_FACTURA)[number]>()
      .notNull()
      .default("venta"),
    pedidoId: text("pedido_id")
      .notNull()
      .references(() => pedidos.id),
    clienteId: text("cliente_id")
      .notNull()
      .references(() => user.id),

    /* Quién emite, congelado. */
    emisorNombre: text("emisor_nombre").notNull(),
    emisorIdentificacion: text("emisor_identificacion"),
    emisorDireccion: text("emisor_direccion"),

    /* Quién recibe, congelado. */
    receptorNombre: text("receptor_nombre").notNull(),
    receptorCorreo: text("receptor_correo"),
    receptorDireccion: text("receptor_direccion"),

    subtotalCentavos: integer("subtotal_centavos").notNull(),
    impuestosCentavos: integer("impuestos_centavos").notNull().default(0),
    totalCentavos: integer("total_centavos").notNull(),
    moneda: text("moneda").notNull().default("USD"),
    /** El idioma de la cuenta del comprador el día que se emitió. */
    idioma: text("idioma").notNull().default("es"),

    emitidaEn: integer("emitida_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    /* Un pedido tiene UNA factura de venta. Es la barrera que hace que emitir
       dos veces —porque Stripe reintentó el aviso— no cree dos documentos. */
    uniqueIndex("idx_facturas_pedido").on(t.pedidoId),
    index("idx_facturas_cliente").on(t.clienteId),
    index("idx_facturas_emitida").on(t.emitidaEn),
  ],
);

/** Los renglones de la factura, copiados del pedido y congelados con él. */
export const lineasFactura = sqliteTable(
  "lineas_factura",
  {
    id: text("id").primaryKey(),
    facturaId: text("factura_id")
      .notNull()
      .references(() => facturas.id, { onDelete: "cascade" }),
    descripcion: text("descripcion").notNull(),
    cantidad: real("cantidad").notNull().default(1),
    precioUnitarioCentavos: integer("precio_unitario_centavos").notNull(),
    subtotalCentavos: integer("subtotal_centavos").notNull(),
  },
  (t) => [index("idx_lineas_factura").on(t.facturaId)],
);

export const ESTADOS_ORDEN_COMPRA = ["emitida", "facturada"] as const;

/**
 * LA ORDEN DE COMPRA: Windoce, LLC al comercio.
 *
 * OJO CON LA DIFERENCIA, que es la que hace que esto sea correcto: **la
 * factura de compra la emite el COMERCIO, no nosotros.** No se puede fabricar
 * un documento a nombre de otro. Lo que sí podemos —y es lo que hoy le falta
 * al comercio para poder facturarnos— es emitirle la orden de compra con todo
 * lo que necesita, y guardar su factura contra ella.
 *
 * Un pedido con productos de tres comercios genera TRES órdenes, una por cada
 * uno: cada comercio nos vende lo suyo y nos factura lo suyo.
 *
 * EL MONTO ES LO QUE SE LE PAGA AL COMERCIO — el subtotal menos el margen de
 * Mercatren, que es exactamente lo que se le acredita. Si aquí figurara el
 * precio publicado, la orden diría que le compramos por más de lo que le
 * pagamos, y eso no cuadra con nada.
 *
 * Los renglones NO se copian: salen de `items_pedido`, que ya guarda el título
 * y el precio congelados al momento de comprar. Copiarlos otra vez sería tener
 * dos verdades.
 */
export const ordenesCompra = sqliteTable(
  "ordenes_compra",
  {
    id: text("id").primaryKey(),
    /** Correlativo sin huecos: MT-OC-000001. */
    numero: text("numero").notNull().unique(),
    pedidoId: text("pedido_id")
      .notNull()
      .references(() => pedidos.id),
    tiendaId: text("tienda_id")
      .notNull()
      .references(() => tiendas.id),

    /** Lo que se le paga al comercio: subtotal − margen de Mercatren. */
    subtotalCentavos: integer("subtotal_centavos").notNull(),
    moneda: text("moneda").notNull().default("USD"),

    estado: text("estado")
      .$type<(typeof ESTADOS_ORDEN_COMPRA)[number]>()
      .notNull()
      .default("emitida"),

    /* La factura que sube el comercio contra esta orden. */
    facturaProveedorNumero: text("factura_proveedor_numero"),
    facturaProveedorClave: text("factura_proveedor_clave"),
    facturadaEn: integer("facturada_en", { mode: "timestamp" }),

    emitidaEn: integer("emitida_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    /* Un comercio tiene UNA orden por pedido. Misma barrera que arriba: si el
       aviso de pago llega dos veces, la segunda no crea nada. */
    uniqueIndex("idx_oc_pedido_tienda").on(t.pedidoId, t.tiendaId),
    index("idx_oc_tienda").on(t.tiendaId),
    index("idx_oc_estado").on(t.estado),
  ],
);

/**
 * LA POLÍTICA DE ENVÍO DE CADA COMERCIO (7 ago 2026).
 *
 * TABLA APARTE, NO COLUMNAS EN `tiendas`. `schema.sql` solo trae
 * `CREATE TABLE IF NOT EXISTS`, así que una base que ya existe NO recibe
 * columnas nuevas: habría que aplicar un ALTER a mano con el token. Una tabla
 * nueva llega sola en la siguiente publicación.
 *
 * NO HAY UN BOOLEANO «hace envíos», y es la decisión importante de este
 * diseño: hacen falta CUATRO estados, porque «todavía no lo dijo» no es lo
 * mismo que «no envía». Si a un comercio que sí despacha le enseñáramos «solo
 * retiro en el local» por no haber llenado el formulario, le estaríamos
 * mintiendo a su comprador y quitándole ventas. El porqué de cada estado está
 * en `src/lib/envios/politica.ts`, que es donde vive la lógica.
 *
 * Un comercio sin fila aquí se comporta como `sin_definir`, que es justo lo
 * que hay que enseñar: «aún no especificado por el vendedor».
 */
export const enviosTienda = sqliteTable("envios_tienda", {
  tiendaId: text("tienda_id")
    .primaryKey()
    .references(() => tiendas.id, { onDelete: "cascade" }),

  modo: text("modo")
    .$type<(typeof MODOS_ENVIO_DB)[number]>()
    .notNull()
    .default("sin_definir"),

  /** Cuánto cobra por despachar, en puntos base: 400 = 4 %. */
  porcentajePuntosBase: integer("porcentaje_puntos_base").notNull().default(0),

  /** Hasta dónde llega, en sus palabras. Bilingüe como todo lo del público. */
  coberturaEs: text("cobertura_es"),
  coberturaEn: text("cobertura_en"),

  /** Cuánto suele tardar, en sus palabras: "2 a 4 días hábiles". */
  plazoEs: text("plazo_es"),
  plazoEn: text("plazo_en"),

  actualizadoEn: integer("actualizado_en", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Los modos, repetidos aquí a propósito.
 *
 * El esquema NO importa de `envios/politica.ts` porque ese archivo es puro y
 * corre también en el navegador; traerlo aquí metería el esquema entero en el
 * paquete del cliente. Una prueba comprueba que las dos listas coinciden, que
 * es lo que de verdad hace falta.
 */
export const MODOS_ENVIO_DB = [
  "sin_definir",
  "solo_retiro",
  "porcentaje",
  "incluido",
] as const;

/**
 * CÓMO SE VE LA TIENDA DE UN COMERCIO (7 ago 2026).
 *
 * Tabla aparte y no una columna en `tiendas`, por lo de siempre: `schema.sql`
 * solo trae `CREATE TABLE IF NOT EXISTS`, así que una base que ya existe no
 * recibe columnas nuevas y habría que aplicar un ALTER a mano con el token.
 *
 * Hoy guarda una sola cosa, el color del banner. Se hizo tabla igual porque lo
 * que viene después —tipografía, una portada por temporada, el orden de las
 * secciones— cae aquí sin volver a tocar la base.
 *
 * Un comercio SIN fila no se queda sin color: se le deriva del nombre. El
 * porqué está en `src/lib/marca/colores.ts`.
 */
export const aparienciaTienda = sqliteTable("apariencia_tienda", {
  tiendaId: text("tienda_id")
    .primaryKey()
    .references(() => tiendas.id, { onDelete: "cascade" }),

  /** El id de un color de la paleta: `azul`, `vino`, `bosque`… */
  colorBanner: text("color_banner"),

  actualizadoEn: integer("actualizado_en", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * LAS PLATAFORMAS SOCIAS (hoy: QRbott).
 *
 * Tabla NUEVA, no columnas en `tiendas`: asi llega sola a produccion con
 * `schema.sql`, que solo trae `CREATE TABLE IF NOT EXISTS` y no aplica ALTERs.
 *
 * Una fila por tienda vinculada. El token se guarda HASHEADO, nunca en claro:
 * ese token deja escribir en el catalogo de un comercio, y una copia de la base
 * en las manos equivocadas no puede ser tambien la llave.
 */
export const sociosTienda = sqliteTable("socios_tienda", {
  id: text("id").primaryKey(),

  tiendaId: text("tienda_id")
    .notNull()
    .references(() => tiendas.id, { onDelete: "cascade" }),

  /** Que plataforma es. Hoy solo `qrbott`, pero manana habra otra. */
  plataforma: text("plataforma").notNull(),

  /** El identificador de la tienda EN EL SOCIO (allá, el uuid del bot). */
  externoId: text("externo_id").notNull(),

  /** SHA-256 del token. El token en claro se enseña una sola vez, al vincular. */
  tokenHash: text("token_hash").notNull(),

  /**
   * El corte de la ultima lectura, tal como lo mando el socio.
   *
   * Se guarda el suyo y NO el nuestro a proposito: dos servidores nunca estan
   * exactamente en hora, y unos segundos de diferencia se comen los cambios de
   * esa ventana sin que nadie lo note.
   */
  cursor: text("cursor"),

  ultimoResultado: text("ultimo_resultado"),

  creadoEn: integer("creado_en", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  actualizadoEn: integer("actualizado_en", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * TODOS LOS IDENTIFICADORES QUE APUNTAN A UN PRODUCTO.
 *
 * Cuando el socio manda una linea por sucursal, el mismo tubo llega con DOS
 * identificadores y aqui se guarda como UN producto. En `productos.externo_id`
 * cabe uno solo, asi que el otro se perdia — y con el, dos cosas:
 *
 *  1. Una baja que llegara por el identificador "perdido" no encontraba nada y
 *     el producto se quedaba publicado para siempre.
 *  2. Una baja por el identificador canonico despublicaba el producto ENTERO,
 *     aunque la otra sucursal siguiera teniendolo. Al reves de lo correcto.
 *
 * Comprobado el 8 ago 2026 probando contra el servidor: la baja de la linea de
 * El Vigia no hacia absolutamente nada.
 *
 * Con esta tabla, una baja borra SU alias y el producto solo se despublica
 * cuando ya no le queda ninguno: es decir, cuando de verdad desaparecio de
 * todas las sucursales.
 */
export const sociosAlias = sqliteTable(
  "socios_alias",
  {
    id: text("id").primaryKey(),
    tiendaId: text("tienda_id")
      .notNull()
      .references(() => tiendas.id, { onDelete: "cascade" }),
    /** Un identificador del socio. Varios pueden apuntar al mismo producto. */
    externoId: text("externo_id").notNull(),
    productoId: text("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),
  },
  (t) => [
    uniqueIndex("socios_alias_tienda_externo").on(t.tiendaId, t.externoId),
    index("socios_alias_producto").on(t.productoId),
  ],
);

/**
 * SI UN COMERCIO ESTA COMPROBADO O TODAVIA SE LE ESTA MIRANDO.
 *
 * Tabla NUEVA, no una columna en `tiendas`: asi llega sola a produccion con
 * `schema.sql`, que solo trae `CREATE TABLE IF NOT EXISTS` y no aplica ALTERs.
 *
 * Y ES UN DATO APARTE DEL ESTADO DE LA TIENDA, a proposito. Son dos preguntas
 * distintas: `tiendas.estado` dice si el publico la ve; esto dice si nosotros
 * comprobamos que existe de verdad. Una tienda nueva esta ACTIVA y EN
 * OBSERVACION a la vez, y esa es la situacion normal — vende desde el primer
 * minuto mientras la revisamos por detras.
 *
 * El porque completo, y lo que enciende (el sello verde de la ficha publica),
 * esta en `src/lib/verificacion/estado.ts`.
 *
 * EL COMERCIANTE NO VE NADA DE ESTO. Ni el estado ni las notas.
 */
export const verificacionTienda = sqliteTable("verificacion_tienda", {
  tiendaId: text("tienda_id")
    .primaryKey()
    .references(() => tiendas.id, { onDelete: "cascade" }),

  /** `en_observacion` (el de entrada) · `verificada` · `rechazada`. */
  estado: text("estado").notNull().default("en_observacion"),

  /**
   * Lo que encontro quien reviso: si la tienda fisica existe, si los datos de
   * la empresa cuadran, si el logo es suyo. Es la constancia que los terminos
   * prometen y que hasta hoy no se guardaba en ninguna parte.
   */
  notas: text("notas"),

  revisadoPor: text("revisado_por").references(() => user.id, {
    onDelete: "set null",
  }),
  revisadoEn: integer("revisado_en", { mode: "timestamp" }),

  creadoEn: integer("creado_en", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * PREGUNTAS Y RESPUESTAS DE UN PRODUCTO.
 *
 * Tabla NUEVA, no columnas: asi llega sola a produccion con `schema.sql`.
 *
 * ══ PARA QUE SIRVE, Y NO ES LO QUE PARECE ══
 *
 * No es un chat ni un buzon de soporte. Es CONTENIDO DE LA FICHA, escrito en
 * las palabras que la gente usa de verdad al buscar: "¿sirve para 220?",
 * "¿cuantos metros trae?", "¿el galon para cuantos metros rinde?".
 *
 * Resuelve tres cosas a la vez:
 *
 *  1. Las fichas del catalogo importado tienen dos lineas de descripcion y
 *     nada mas. Search Console reporta 28 paginas "rastreada: actualmente sin
 *     indexar" — Google entrando y no encontrando sustancia. Cinco preguntas
 *     respondidas cambian eso.
 *  2. Los asistentes de IA citan justo este tipo de bloque cuando alguien
 *     pregunta si un producto sirve para algo.
 *  3. Responde la objecion antes de que mate la venta.
 *
 * OJO: el resultado enriquecido de FAQ en Google ya NO existe (lo retiraron en
 * junio 2026). El valor esta en el contenido, no en el adorno del buscador.
 *
 * ══ EL COMERCIO PUEDE ESCRIBIR LAS SUYAS ══
 *
 * Y no es hacer trampa: una pregunta frecuente escrita por el vendedor es
 * INFORMACION DEL PRODUCTO, no una resena. La diferencia con una estrella
 * inventada es que aqui nadie finge ser un cliente satisfecho.
 */
export const preguntasProducto = sqliteTable(
  "preguntas_producto",
  {
    id: text("id").primaryKey(),
    productoId: text("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),
    /** Se guarda tambien la tienda para que el comercio liste las suyas sin join. */
    tiendaId: text("tienda_id")
      .notNull()
      .references(() => tiendas.id, { onDelete: "cascade" }),

    preguntaEs: text("pregunta_es").notNull(),
    preguntaEn: text("pregunta_en"),
    /** NULL = preguntada y todavia sin responder. No sale al publico asi. */
    respuestaEs: text("respuesta_es"),
    respuestaEn: text("respuesta_en"),

    /** `comercio` (la escribio el vendedor) o `comprador` (la pregunto alguien). */
    autor: text("autor").notNull().default("comercio"),
    /** Quien pregunto, si fue un comprador. */
    usuarioId: text("usuario_id").references(() => user.id, {
      onDelete: "set null",
    }),

    /** El comercio decide el orden: lo primero que preguntan va arriba. */
    orden: integer("orden").notNull().default(0),
    /** `publicada` u `oculta`. Ocultar no borra: puede volver. */
    estado: text("estado").notNull().default("publicada"),

    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    respondidoEn: integer("respondido_en", { mode: "timestamp" }),
  },
  (t) => [index("preguntas_producto_producto").on(t.productoId)],
);

/**
 * LOS INTENTOS FALLIDOS EN LAS PUERTAS DE ENTRADA.
 *
 * Una fila por llave —`ip:1.2.3.4` o `cuenta:correo@x.com`— y no una por
 * intento: guardar cada golpe de un ataque de fuerza bruta sería dejar que el
 * atacante nos llene la base, que es justo lo que viene a hacer. Con un
 * contador y la fecha en que empezó la ventana alcanza, y son dos escrituras
 * por fallo en vez de miles.
 *
 * TABLA NUEVA, NO COLUMNAS: `schema.sql` solo trae `CREATE TABLE IF NOT
 * EXISTS`, así que una columna añadida a una tabla que ya existe no llegaría
 * sola a producción.
 *
 * La lógica —cuántos, cuánto dura la ventana y por qué el tope por dirección es
 * mucho más alto que el de cuenta— vive en `src/lib/seguridad/intentos.ts`,
 * pura y con pruebas.
 */
/**
 * LOS CORREOS QUE EL REGISTRO RECHAZO, Y POR QUE.
 *
 * ══ PARA QUE SIRVE ══
 *
 * El filtro de correos falsos es una pared, y una pared que nadie mide se
 * convierte en una pared silenciosa: si manana empieza a rechazar un dominio
 * legitimo, sin este registro nos enterariamos por un cliente enfadado — o por
 * ninguno, porque el que no puede registrarse simplemente se va.
 *
 * Con esto se puede mirar cuantos rechazos hubo de cada tipo y, sobre todo,
 * cuales fueron falsos positivos que hay que dejar pasar.
 *
 * ══ TABLA NUEVA, NO COLUMNA ══
 *
 * `schema.sql` solo trae `CREATE TABLE IF NOT EXISTS`, asi que una tabla nueva
 * llega sola a produccion en la siguiente publicacion. Una columna nueva en una
 * tabla que ya existe NO llegaria.
 */
export const rechazosCorreo = sqliteTable("rechazos_correo", {
  id: text("id").primaryKey(),
  /** El correo tal como lo escribio quien intentaba registrarse. */
  correo: text("correo").notNull(),
  /** Su dominio, aparte, para poder contar por dominio sin partir el texto. */
  dominio: text("dominio").notNull(),
  /** `correoDeEjemplo`, `correoTemporal`, `correoSinServidor`… */
  motivo: text("motivo").notNull(),
  /** De donde vino. Sirve para distinguir un cliente despistado de un robot. */
  ip: text("ip"),
  creadoEn: integer("creado_en", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const intentosAcceso = sqliteTable("intentos_acceso", {
  /** `ip:<direccion>` o `cuenta:<correo en minusculas>`. */
  llave: text("llave").primaryKey(),
  intentos: integer("intentos").notNull().default(0),
  /** Milisegundos. Cuando empezo la ventana vigente. */
  ventanaDesde: integer("ventana_desde").notNull(),
});

/**
 * LA PRUEBA DE ENTREGA: lo unico que gana una disputa.
 *
 * ══ POR QUE HACE FALTA ══
 *
 * Un cobro con tarjeta se revierte hasta **120 dias despues**. Cuando llega el
 * contracargo, el banco pregunta una sola cosa: demuestrame que el comprador
 * recibio la mercancia. `hitos_pedido` ya guarda quien marco «entregado» y
 * cuando, y eso no basta: cualquiera puede pulsar un boton. Lo que se defiende
 * es la GUIA del transportista, la FOTO de la entrega o la FIRMA de quien
 * recibio.
 *
 * ══ TABLA NUEVA, NO COLUMNAS ══
 *
 * `schema.sql` solo trae `CREATE TABLE IF NOT EXISTS`, asi que una columna
 * agregada a `pedidos` no llegaria sola a produccion. Y ademas un pedido puede
 * tener varias pruebas: la guia y la foto del paquete en la puerta.
 *
 * ══ EL ARCHIVO ES PRIVADO ══
 *
 * Una foto de entrega lleva una direccion y a veces una persona. Se guarda con
 * `clave` en nuestro bucket y se sirve por `/media`, que ya comprueba quien
 * pregunta — igual que los comprobantes de pago.
 */
export const TIPOS_PRUEBA = ["guia", "foto", "firma", "nota"] as const;

export const pruebasEntrega = sqliteTable(
  "pruebas_entrega",
  {
    id: text("id").primaryKey(),
    pedidoId: text("pedido_id")
      .notNull()
      .references(() => pedidos.id, { onDelete: "cascade" }),
    /** `guia`, `foto`, `firma` o `nota`. */
    tipo: text("tipo").notNull(),
    /** El numero de guia o el transportista, cuando el tipo lo lleva. */
    referencia: text("referencia"),
    /** La clave del archivo en nuestro bucket. Se sirve por /media. */
    clave: text("clave"),
    /** Lo que escriba quien la sube. */
    nota: text("nota"),

    /** Quien la aporto. Se guarda el nombre por si esa cuenta desaparece. */
    subidoPorId: text("subido_por_id").references(() => user.id),
    subidoPorNombre: text("subido_por_nombre"),

    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("idx_pruebas_entrega").on(t.pedidoId)],
);

/**
 * LAS ESTRELLAS Y EL COMENTARIO DE QUIEN COMPRÓ.
 *
 * ══ SOLO PUNTÚA QUIEN COMPRÓ, Y ESO NO ES NEGOCIABLE ══
 *
 * Una estrella de alguien que no compró no vale nada, y una tienda que las
 * admite se llena de opiniones falsas —propias y de la competencia— en cuanto
 * alguien se da cuenta. Por eso hay una llave única por (producto, persona) y
 * la acción comprueba que exista un pedido pagado suyo con ese producto.
 *
 * ══ NO SE MEZCLAN CON LAS DEL PROVEEDOR ══
 *
 * Las opiniones que trae CJ son de compradores de OTRAS tiendas. Se pueden
 * enseñar diciendo de dónde vienen, pero **jamás promediadas con estas**: el
 * número de estrellas de Mercatren tiene que salir solo de gente que le compró
 * a Mercatren. Mezclarlas es exactamente lo que sanciona la FTC.
 */
export const valoraciones = sqliteTable(
  "valoraciones",
  {
    id: text("id").primaryKey(),
    productoId: text("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),
    usuarioId: text("usuario_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** De 1 a 5. Se comprueba antes de guardar. */
    estrellas: integer("estrellas").notNull(),
    comentario: text("comentario"),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    /* UNA POR PERSONA Y PRODUCTO: sin esto, uno solo puede poner cien
       estrellas y el promedio deja de significar nada. */
    uniqueIndex("idx_valoracion_unica").on(t.productoId, t.usuarioId),
    index("idx_valoraciones_producto").on(t.productoId),
  ],
);

/**
 * EL PUENTE ENTRE UN COBRO POR ENLACE Y SU PAGO POR ZELLE.
 *
 * Un cobro pagado con tarjeta guarda su `pi_…` en `cobros_solicitados.pago_id`
 * y listo. Uno pagado por Zelle pasa primero por la cola de validación como
 * cualquier comprobante (`pagos_zelle`), y este puente es lo que le dice al
 * validador —y al sistema— a qué cobro pertenece esa captura.
 *
 * Es tabla y no columna a propósito: `schema.sql` solo trae CREATE TABLE IF
 * NOT EXISTS, así que una columna nueva jamás llegaría sola a producción. Y un
 * cobro puede acumular VARIOS intentos (uno rechazado, otro corregido), por
 * eso la llave primaria es el pago, no el cobro.
 */
export const cobrosZelle = sqliteTable(
  "cobros_zelle",
  {
    pagoZelleId: text("pago_zelle_id")
      .primaryKey()
      .references(() => pagosZelle.id, { onDelete: "cascade" }),
    cobroId: text("cobro_id")
      .notNull()
      .references(() => cobrosSolicitados.id, { onDelete: "cascade" }),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("idx_cobros_zelle_cobro").on(t.cobroId)],
);

/**
 * ZELLE EN LOS ENLACES DE COBRO: QUIÉN LO TIENE Y DESDE CUÁNTO.
 *
 * Lo decide el equipo, por tienda, desde Configuración. La tarjeta la tienen
 * todas siempre; Zelle se puede dar y quitar, porque cada pago por Zelle es
 * trabajo de validación para una persona.
 *
 *  - Sin fila, la tienda NO tiene Zelle en sus enlaces. Encenderlo es un acto
 *    del equipo, no un valor por defecto que nadie decidió.
 *  - `minimo_centavos` en null usa el mínimo general (llave
 *    `zelle_cobros_minimo_centavos` de la tabla `configuracion`).
 */
export const zelleCobrosTienda = sqliteTable("zelle_cobros_tienda", {
  tiendaId: text("tienda_id")
    .primaryKey()
    .references(() => tiendas.id, { onDelete: "cascade" }),
  habilitado: integer("habilitado", { mode: "boolean" })
    .notNull()
    .default(false),
  /** En null, manda el mínimo general. El dinero siempre en centavos enteros. */
  minimoCentavos: integer("minimo_centavos"),
  actualizadoEn: integer("actualizado_en", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * LOS PEDIDOS QUE HAY QUE COMPRARLE AL PROVEEDOR DE ESTADOS UNIDOS.
 *
 * ══ POR QUÉ EXISTE ESTA TABLA ══
 *
 * Una venta de Estados Unidos no se despacha sola: hay que comprarle el
 * producto a CJ. Su API **no puede cobrar una tarjeta guardada** —comprobado
 * en su documentación el 16 ago 2026: sus tres formas de pago son saldo,
 * saldo y «crear sin pagar»— pero sí devuelve un **enlace de pago**
 * (`cjPayUrl`) cuando el pedido se crea con `payType=1`.
 *
 * Con eso, todo lo pesado se automatiza: el pedido se crea en CJ con la
 * dirección del comprador, sus renglones y sus variantes. Lo único humano es
 * abrir ese enlace y pagar con tarjeta — diez segundos, sin buscar el
 * producto, sin copiar direcciones y sin cargar billetera.
 *
 * ══ ESTA TABLA ES EL RASTRO DE ESE PASO ══
 *
 * Sin ella, un pedido pagado por el cliente y no comprado al proveedor no
 * aparece en ninguna pantalla: es exactamente el fallo silencioso que deja a
 * un comprador esperando una caja que nadie pidió.
 *
 * Tabla y no columnas, como manda la regla del proyecto: `schema.sql` solo
 * trae CREATE TABLE IF NOT EXISTS y una columna nueva no llegaría sola a
 * producción.
 */
export const ESTADOS_PEDIDO_PROVEEDOR = [
  /** Creado en CJ, esperando que alguien abra el enlace y pague. */
  "por_pagar",
  /** Pagado; CJ lo está preparando. */
  "pagado",
  /** Despachado, con su número de guía. */
  "enviado",
  /** No se pudo crear en CJ. El motivo queda escrito. */
  "con_error",
  /** Se resolvió por fuera (compra a mano, cancelación). */
  "cerrado",
] as const;

export const pedidosProveedor = sqliteTable(
  "pedidos_proveedor",
  {
    id: text("id").primaryKey(),

    /** Nuestro pedido. Uno nuestro puede necesitar más de una compra. */
    pedidoId: text("pedido_id")
      .notNull()
      .references(() => pedidos.id, { onDelete: "cascade" }),

    /** Quién surte. Hoy solo `cj`, mañana el que gane la comparativa. */
    proveedor: text("proveedor").notNull().default("cj"),

    estado: text("estado")
      .$type<(typeof ESTADOS_PEDIDO_PROVEEDOR)[number]>()
      .notNull()
      .default("por_pagar"),

    /** El identificador del pedido EN EL PROVEEDOR, para reclamar. */
    externoId: text("externo_id"),
    /** El número que el proveedor le enseña a su propio soporte. */
    externoNumero: text("externo_numero"),

    /**
     * EL ENLACE DE PAGO. Es lo que hace que esto valga la pena.
     *
     * No se enseña en ninguna pantalla pública: es una dirección que cobra
     * dinero de nuestra tarjeta. Solo el equipo interno lo ve.
     */
    urlPago: text("url_pago"),

    /** Lo que nos cuesta a nosotros, en centavos enteros como todo el dinero. */
    costoCentavos: integer("costo_centavos"),

    /** El número de guía, cuando CJ despacha. */
    guia: text("guia"),
    transportista: text("transportista"),

    /** El motivo exacto cuando algo falla. Un «no se pudo» obliga a adivinar. */
    ultimoError: text("ultimo_error"),

    pagadoEn: integer("pagado_en", { mode: "timestamp" }),
    pagadoPorId: text("pagado_por_id").references(() => user.id),

    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    actualizadoEn: integer("actualizado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("idx_pedidos_proveedor_pedido").on(t.pedidoId),
    index("idx_pedidos_proveedor_estado").on(t.estado),
  ],
);

/**
 * QUÉ VARIANTE SE LE COMPRÓ AL PROVEEDOR, RENGLÓN POR RENGLÓN.
 *
 * ══ POR QUÉ HACE FALTA ESTO (18 ago 2026) ══
 *
 * Nuestra ficha publica un producto de CJ como **una sola cosa con un solo
 * precio**; CJ lo tiene con tallas y colores. O sea que el comprador nunca
 * eligió variante y **la elige el sistema** (`src/lib/cj/variantes.ts`: la más
 * barata, que es la que se le cobró).
 *
 * Una elección que hace el sistema y que nadie puede ver no es una elección: es
 * una sorpresa dentro de una caja. Aquí queda escrita, sale en el panel antes
 * de pagar —el pago a CJ lo pulsa una persona— y se puede cancelar si el color
 * no era ese.
 *
 * Y sirve para después: cuando llegue una devolución o una factura de ajuste
 * (`makeup`), esto dice exactamente qué se pidió.
 *
 * ══ TABLA NUEVA, NO COLUMNAS ══
 *
 * `schema.sql` solo trae `CREATE TABLE IF NOT EXISTS`, así que una columna
 * nueva NO llega sola a una base que ya existe. Una tabla sí.
 */
export const renglonesProveedor = sqliteTable(
  "renglones_proveedor",
  {
    id: text("id").primaryKey(),

    pedidoProveedorId: text("pedido_proveedor_id")
      .notNull()
      .references(() => pedidosProveedor.id, { onDelete: "cascade" }),

    /** Nuestro producto. Sin cascada: el histórico no se borra al despublicar. */
    productoId: text("producto_id").references(() => productos.id),

    /** Cómo se llama en nuestra ficha, copiado. Si mañana cambia, esto no. */
    titulo: text("titulo"),

    /** El identificador de la variante EN CJ. Es lo que viajó en el pedido. */
    vid: text("vid"),

    /**
     * El SKU de la VARIANTE — `CJJT05843-Black`, no `CJJT05843`.
     *
     * Confundir los dos es justo lo que tumbó la primera compra pagada.
     */
    varianteSku: text("variante_sku"),

    /** Legible: «Black-XXL». Es lo que lee la persona que va a pagar. */
    varianteNombre: text("variante_nombre"),

    cantidad: integer("cantidad").notNull().default(1),

    /**
     * La eligió el sistema porque había más de una, no porque fuera la única.
     *
     * Se pinta en ámbar en el panel: mandar la talla equivocada es una
     * devolución, y una devolución de un producto de $8 la pagamos nosotros.
     */
    varianteAutomatica: integer("variante_automatica", { mode: "boolean" })
      .notNull()
      .default(false),

    /** Cuántas variantes había. Un «1 de 12» se lee distinto que un «1 de 1». */
    variantesTotales: integer("variantes_totales"),

    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("idx_renglones_proveedor").on(t.pedidoProveedorId)],
);

/**
 * LAS DEVOLUCIONES.
 *
 * ══ LA REGLA QUE DEFINE ESTA TABLA (18 ago 2026) ══
 *
 * **La dirección de devolución no se publica: se entrega cuando el trámite
 * existe.** Esta fila ES el trámite. Sin una fila aquí, la persona no ve a
 * dónde mandar nada — ni en la política, ni en el correo, ni en el HTML.
 *
 * El motivo lo dio el dueño: esa dirección puede cambiar dentro de un año.
 * Publicada se copia, se reenvía y se queda circulando, y el día que cambie
 * seguirán llegando cajas a un sitio donde ya no hay nadie que las reciba.
 *
 * ══ Y LA DIRECCIÓN SE COPIA DENTRO ══
 *
 * `direccionEntregada` guarda la que se le enseñó **ese día**. Si mañana
 * cambia, el que ya despachó tiene que poder demostrar que mandó a donde se le
 * dijo — igual que las facturas copian los datos del emisor en vez de
 * apuntarlos.
 */
export const devoluciones = sqliteTable(
  "devoluciones",
  {
    id: text("id").primaryKey(),

    pedidoId: text("pedido_id")
      .notNull()
      .references(() => pedidos.id, { onDelete: "cascade" }),

    /** Quién la pidió. Solo el dueño del pedido puede abrirla. */
    usuarioId: text("usuario_id").references(() => user.id),

    estado: text("estado")
      .$type<
        "solicitada" | "en_camino" | "recibida" | "reembolsada" | "rechazada"
      >()
      .notNull()
      .default("solicitada"),

    /** De la lista cerrada de motivos, no texto libre: se cuenta y se compara. */
    motivo: text("motivo").notNull(),

    /** Lo que escribió la persona. Texto libre, aparte del motivo. */
    comentario: text("comentario"),

    /**
     * LA DIRECCIÓN QUE SE LE ENSEÑÓ, COPIADA.
     *
     * No se apunta a una variable de entorno: el día que cambie, esta
     * devolución tiene que seguir diciendo a dónde se le mandó despachar.
     */
    direccionEntregada: text("direccion_entregada"),

    /** El número de guía con el que la mandó de vuelta, si lo da. */
    guiaRetorno: text("guia_retorno"),

    /** Lo que se le devolvió, en centavos enteros como todo el dinero. */
    reembolsadoCentavos: integer("reembolsado_centavos"),

    /** Por qué se rechazó. Un rechazo sin motivo no se puede discutir. */
    motivoRechazo: text("motivo_rechazo"),

    resueltoEn: integer("resuelto_en", { mode: "timestamp" }),
    resueltoPorId: text("resuelto_por_id").references(() => user.id),

    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    actualizadoEn: integer("actualizado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("idx_devoluciones_pedido").on(t.pedidoId),
    index("idx_devoluciones_estado").on(t.estado),
  ],
);

/**
 * LAS FOTOS DE UNA DEVOLUCIÓN.
 *
 * Tabla aparte y no una columna con una lista: son varias, se borran de una en
 * una, y una lista dentro de un campo de texto no se puede consultar ni
 * limpiar cuando se borra el archivo del bucket.
 *
 * **No son públicas**: se sirven por `/media`, que ya comprueba quién mira —
 * igual que los comprobantes de pago. La foto del salón de alguien no es
 * material de catálogo.
 */
export const fotosDevolucion = sqliteTable(
  "fotos_devolucion",
  {
    id: text("id").primaryKey(),

    devolucionId: text("devolucion_id")
      .notNull()
      .references(() => devoluciones.id, { onDelete: "cascade" }),

    /** La llave dentro del bucket. Nunca una dirección pública. */
    clave: text("clave").notNull(),

    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("idx_fotos_devolucion").on(t.devolucionId)],
);

/**
 * LOS COBROS DE UNA CADENA: CUANDO EL QUE PAGA NO CONOCE AL COMERCIO.
 *
 * ══ EL CASO (19 ago 2026) ══
 *
 * Ferremateriales Bley le fía a la Ferretería B, y quien pone el dinero es un
 * cliente de la Ferretería B. Ese cliente le compró a B, no a Bley.
 *
 * En su pantalla de pago **no puede salir ninguno de los dos**: Bley es un
 * negocio con el que él no tiene nada que ver, y nombrar a B le contaría a su
 * propio cliente a quién le compra y cuánto le debe. Solo se ve **Mercatren**,
 * que es quien cobra y quien factura — igual que en Amazon o Mercado Libre.
 *
 * ══ TABLA NUEVA, NO COLUMNAS ══
 *
 * `schema.sql` solo trae `CREATE TABLE IF NOT EXISTS`, así que una columna
 * nueva NO llega sola a una base que ya existe. Y no es una tabla para un
 * booleano: guarda además **de qué deuda vino el pago**, que es lo que deja
 * reconstruir la cadena meses después cuando alguien reclame.
 */
/**
 * LOS CARGOS ADICIONALES DE UN COBRO: FLETE Y MANEJO.
 *
 * ══ POR QUÉ HACÍA FALTA ══
 *
 * Un comercio vende diez sacos de cemento por $540 y el cliente pide que se los
 * lleven. El camión cuesta $40 y subirlos a un tercer piso, otros $20. Hasta
 * hoy no había dónde meter eso: o se sumaba a mano al precio de la mercancía
 * —y entonces la factura miente sobre qué se vendió— o no se cobraba.
 *
 * ══ POR QUÉ TABLA Y NO DOS COLUMNAS ══
 *
 * Regla del proyecto: `schema.sql` solo trae `CREATE TABLE IF NOT EXISTS`, así
 * que una columna nueva NO llega sola a una base que ya existe. Y además cada
 * cargo lleva su propia explicación escrita por el comercio, que es lo que hace
 * que el cliente entienda por qué paga de más.
 *
 * ══ EL DESGLOSE SE VE, NO SE ESCONDE ══
 *
 * Quien paga tiene que leer «mercancía $540 · flete $40 · manejo $20» y no un
 * $600 sin explicar. Un cargo que aparece sin decir qué es, es la primera línea
 * de un contracargo.
 */
export const TIPOS_DE_CARGO = ["flete", "manejo"] as const;

export const cargosCobro = sqliteTable("cargos_cobro", {
  id: text("id").primaryKey(),

  cobroId: text("cobro_id")
    .notNull()
    .references(() => cobrosSolicitados.id, { onDelete: "cascade" }),

  /**
   * Qué clase de cargo es.
   *
   * `flete` es el traslado; `manejo` es lo que se hace con la mercancía —
   * embalaje especial, carga y descarga, acarreo, subir a un piso—. Es el
   * término de la industria (*handling*), y separarlos importa: el flete lo
   * cobra quien transporta y el manejo lo cobra quien pone la gente.
   */
  tipo: text("tipo").$type<(typeof TIPOS_DE_CARGO)[number]>().notNull(),

  /** Lo que el comercio escribe para justificarlo, en sus palabras. */
  concepto: text("concepto"),

  montoCentavos: integer("monto_centavos").notNull(),

  creadoEn: integer("creado_en", { mode: "timestamp" }).notNull(),
});

/**
 * LAS DEVOLUCIONES DE LOS COBROS POR ENLACE.
 *
 * ══ TABLA Y NO COLUMNAS ══
 *
 * Regla del proyecto: `schema.sql` solo trae `CREATE TABLE IF NOT EXISTS`, así
 * que una columna nueva NO llega sola a una base que ya existe. Y además una
 * devolución es un hecho con autor, fecha y motivo — merece su fila.
 *
 * ══ QUIÉN, CUÁNDO, CUÁNTO Y POR QUÉ ══
 *
 * Una devolución sin autor ni motivo es un movimiento de dinero que nadie puede
 * justificar tres meses después. Es justo lo que este sistema entero existe
 * para evitar, y se aplica también a lo que sale.
 */
export const devolucionesCobro = sqliteTable("devoluciones_cobro", {
  id: text("id").primaryKey(),

  cobroId: text("cobro_id")
    .notNull()
    .references(() => cobrosSolicitados.id, { onDelete: "cascade" }),

  /** Lo que se devolvió. Puede ser menos que el cobro: llegaron tres cosas y
   *  una vino rota. */
  montoCentavos: integer("monto_centavos").notNull(),

  /** El identificador del reembolso en el procesador, para reclamar. */
  externoId: text("externo_id"),

  motivo: text("motivo").notNull(),

  /** Quién la hizo. Un comercio solo devuelve lo suyo. */
  hechaPorId: text("hecha_por_id").references(() => user.id),

  creadoEn: integer("creado_en", { mode: "timestamp" }).notNull(),
});

export const cobrosCadena = sqliteTable("cobros_cadena", {
  cobroId: text("cobro_id")
    .primaryKey()
    .references(() => cobrosSolicitados.id, { onDelete: "cascade" }),

  /** `comercio` (el de siempre) o `solo_mercatren`. */
  modo: text("modo")
    .$type<"comercio" | "solo_mercatren">()
    .notNull()
    .default("comercio"),

  /**
   * Cómo llama el comercio a la deuda que este pago salda.
   *
   * Es SUYO y solo suyo: aquí no se interpreta, se guarda. Es lo que le
   * permite a su sistema saber cuál bajar cuando le avise que entró el pago.
   */
  referenciaDeuda: text("referencia_deuda"),

  /**
   * Quién debe, en palabras del comercio.
   *
   * **Nunca sale a ninguna pantalla pública** — la prueba
   * `cobros-presentacion` lo fija. Vive aquí para que, si meses después hay un
   * contracargo, se pueda demostrar quién pagó por cuenta de qué deuda.
   */
  deudorNombre: text("deudor_nombre"),

  creadoEn: integer("creado_en", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * LO QUE CUESTA MANDAR CADA PRODUCTO, GUARDADO.
 *
 * ══ POR QUÉ HACE FALTA GUARDARLO ══
 *
 * El precio publicado lleva el envío dentro. Hasta el 19 ago 2026 no lo
 * llevaba: se publicaba con `desglosarUs(costo, 0)`, y ese cero significa que
 * el envío salía del margen. Medido con la primera compra real —MT-000004— el
 * envío fueron **$1.57**, así que un producto que debía dejar $3.09 dejaba
 * $0.82. No se perdía dinero, pero se ganaba un tercio de lo declarado, y eso
 * no aparecía en ninguna pantalla.
 *
 * Sin esta tabla no se puede recalcular nada sin volver a preguntarle a CJ
 * producto por producto, y esa consulta cuesta dos llamadas por producto.
 *
 * ══ TABLA NUEVA Y NO COLUMNA, COMO MANDA LA REGLA DEL PROYECTO ══
 *
 * `schema.sql` solo trae `CREATE TABLE IF NOT EXISTS`, así que una columna
 * nueva NO llega sola a producción: hay que aplicar el ALTER a mano. Una tabla
 * sí llega en la primera publicación.
 *
 * ══ SE GUARDA CUÁNDO SE COTIZÓ, Y NO ES DECORACIÓN ══
 *
 * El flete de CJ cambia. Una cotización de hace seis meses metida en el precio
 * de hoy es la misma clase de error, más callado. La fecha permite volver a
 * cotizar lo viejo sin tocar lo recién puesto.
 */
export const enviosProducto = sqliteTable("envios_producto", {
  /** El producto. Uno solo, y por eso es la llave. */
  productoId: text("producto_id")
    .primaryKey()
    .references(() => productos.id, { onDelete: "cascade" }),

  /** Lo que cobra el proveedor por mandarlo, en centavos enteros. */
  costoCentavos: integer("costo_centavos").notNull(),

  /** Cómo se supo: `cotizado` si lo dijo el proveedor, `estimado` si es el
   *  respaldo. Un precio armado con un estimado se puede volver a mirar; uno
   *  armado con un cero no se distingue de uno correcto. */
  origen: text("origen").notNull().default("cotizado"),

  /** El transporte que dio ese precio, para poder reclamar. */
  transporte: text("transporte"),

  cotizadoEn: integer("cotizado_en", { mode: "timestamp" }).notNull(),
});

/**
 * POR QUÉ SE CANCELÓ UN COBRO, Y QUIÉN LO CANCELÓ.
 *
 * ══ TABLA NUEVA Y NO COLUMNA, COMO MANDA LA REGLA ══
 *
 * `schema.sql` solo trae `CREATE TABLE IF NOT EXISTS`, así que una columna
 * nueva en `cobros_solicitados` NO llegaría sola a producción. Una tabla sí.
 *
 * ══ EL MOTIVO VIVE AQUÍ Y NO SALE A LA PÁGINA DE PAGO ══
 *
 * Separarlo de la fila del cobro no es solo por la regla: es que el motivo lo
 * escribe una persona y puede nombrar al comercio. En el modo sin nombre, ese
 * nombre no puede llegarle a quien iba a pagar — es la razón entera de que ese
 * modo exista. Teniéndolo en otra tabla, la consulta que dibuja la página de
 * pago ni siquiera lo trae, así que no se puede filtrar por descuido.
 */
export const anulacionesCobro = sqliteTable("anulaciones_cobro", {
  /** El cobro. Uno solo se cancela una vez, y por eso es la llave. */
  cobroId: text("cobro_id")
    .primaryKey()
    .references(() => cobrosSolicitados.id, { onDelete: "cascade" }),

  /** Texto libre del comercio, recortado a 200. Nunca sale al público. */
  motivo: text("motivo"),

  /** `socio` si vino por la API del comercio, `panel` si lo hizo el equipo. */
  origen: text("origen").notNull().default("socio"),

  anuladoEn: integer("anulado_en", { mode: "timestamp" }).notNull(),
});

/**
 * POR QUÉ NO SE PUDO TRAER LA DESCRIPCIÓN DE UN PRODUCTO.
 *
 * ══ POR QUÉ HACE FALTA ══
 *
 * La primera versión marcaba los fallos con un espacio en el campo de la
 * descripción. Dos cosas salieron mal a la vez: la ficha dibujaba ese espacio
 * como si fuera una descripción —dejando un hueco en blanco— y, sobre todo,
 * **se perdía el motivo**. De 1.070 productos, 1.032 salieron «sin datos en
 * CJ» y no había forma de saber si era que CJ no tiene descripción de esos
 * productos, si nos estaba limitando por cantidad de llamadas, o si la
 * petición iba mal armada. Tres causas muy distintas con el mismo síntoma.
 *
 * Aquí queda escrito el motivo exacto que dio CJ. Con eso, una sola tanda
 * dice cuál de las tres es.
 *
 * ══ Y SIRVE DE MARCA PARA NO REPETIR ══
 *
 * Un producto con fila aquí no vuelve a entrar en la cola, así que la barra
 * llega al final. Para reintentarlos se borra la fila desde el panel.
 */
export const intentosDescripcion = sqliteTable("intentos_descripcion", {
  productoId: text("producto_id")
    .primaryKey()
    .references(() => productos.id, { onDelete: "cascade" }),

  /** Lo que dijo CJ, tal cual. Nunca un «no se pudo». */
  motivo: text("motivo").notNull(),

  intentadoEn: integer("intentado_en", { mode: "timestamp" }).notNull(),
});

/**
 * EL FORMULARIO FISCAL DE UN COMERCIO EXTRANJERO (W-8BEN-E).
 *
 * ══ TABLA NUEVA Y NO COLUMNAS EN `tiendas`, COMO MANDA LA REGLA ══
 *
 * `schema.sql` solo trae `CREATE TABLE IF NOT EXISTS`, así que doce columnas
 * nuevas en `tiendas` no llegarían solas a producción.
 *
 * ══ LA FIRMA SE GUARDA CON TODO LO QUE LA HACE VÁLIDA ══
 *
 * El IRS dice que escribir el nombre en la línea de la firma NO cuenta como
 * firma electrónica: hace falta **fecha, hora y una declaración** de que se
 * firmó electrónicamente. Por eso aquí no se guarda solo el nombre — se guarda
 * el momento exacto, desde qué dirección se firmó, y **el texto completo de la
 * declaración tal como se le enseñó**.
 *
 * Ese último detalle importa más de lo que parece: si mañana se cambia el
 * texto, quien firmó en 2026 tiene que poder demostrar qué fue exactamente lo
 * que aceptó. Guardar solo «aceptó los términos» no demuestra nada.
 *
 * ══ NO SE MANDA A NINGUNA PARTE ══
 *
 * Este formulario no va al IRS. Se guarda aquí por si algún día alguien
 * pregunta, y punto.
 */
export const formulariosFiscales = sqliteTable("formularios_fiscales", {
  /** Una tienda tiene uno vigente. Al rehacerlo se sustituye. */
  tiendaId: text("tienda_id")
    .primaryKey()
    .references(() => tiendas.id, { onDelete: "cascade" }),

  nombreLegal: text("nombre_legal").notNull(),
  paisConstitucion: text("pais_constitucion").notNull(),
  tipoEntidad: text("tipo_entidad").notNull(),
  direccion: text("direccion").notNull(),
  ciudad: text("ciudad").notNull(),
  region: text("region"),
  codigoPostal: text("codigo_postal"),
  identificacionFiscal: text("identificacion_fiscal"),

  /** Quién firmó y con qué cargo. */
  firmanteNombre: text("firmante_nombre").notNull(),
  firmanteCargo: text("firmante_cargo").notNull(),

  /** Lo que hace válida la firma electrónica. */
  firmadoEn: integer("firmado_en", { mode: "timestamp" }).notNull(),
  /** Desde dónde se firmó. Parte de la prueba, no un dato de más. */
  firmadoDesde: text("firmado_desde"),
  /** El texto EXACTO que se le enseñó al firmar. */
  declaracion: text("declaracion").notNull(),

  /** Último día del tercer año siguiente al de la firma. */
  venceEn: integer("vence_en", { mode: "timestamp" }).notNull(),
});

/**
 * LA FACTURA DE CJ DE UNA COMPRA AL PROVEEDOR.
 *
 * ══ POR QUÉ HACE FALTA ══
 *
 * En una venta de Estados Unidos, la tienda que aparece es una marca de la
 * casa: por dentro vende y factura Mercatren LLC, así que no hay ninguna
 * factura de un comercio que respalde ese costo. **El documento que lo sostiene
 * es la factura de CJ**, que es a quien de verdad se le compró la mercancía.
 *
 * Hasta ahora la compra quedaba registrada en el panel —con su número, su
 * monto y su guía— pero el PDF de CJ no se archivaba en ningún lado. Eso deja
 * un costo declarado sin el papel que lo demuestra, que es exactamente lo que
 * pide un contador o una auditoría.
 *
 * ══ TABLA NUEVA Y NO COLUMNAS, COMO MANDA LA REGLA ══
 *
 * `schema.sql` solo trae `CREATE TABLE IF NOT EXISTS`.
 */
export const facturasProveedor = sqliteTable("facturas_proveedor", {
  /** La compra al proveedor. Una compra, una factura. */
  pedidoProveedorId: text("pedido_proveedor_id")
    .primaryKey()
    .references(() => pedidosProveedor.id, { onDelete: "cascade" }),

  /** El número que le puso el proveedor, para reclamar. */
  numero: text("numero"),
  /** El archivo en nuestro bucket. Se sirve por `/media`, nunca en abierto. */
  clave: text("clave").notNull(),

  /** Quién la subió y cuándo. Igual que en los retiros: un documento
   *  contable sin autor no defiende a nadie. */
  subidaPor: text("subida_por"),
  subidaEn: integer("subida_en", { mode: "timestamp" }).notNull(),
});

/**
 * LOS BANNERS PUBLICITARIOS DE LAS PARRILLAS (23 ago 2026).
 *
 * Lo pidió el dueño: «veo de una tienda cuarenta productos y en la mitad veo
 * un banner publicitario de las mismas tiendas… esos banners los vamos a
 * manejar nosotros». Es publicidad de la casa a sus propios comercios —la
 * tienda de zapatos, la de electrónica—, no un espacio que se venda a
 * terceros; por eso lo administra SOLO el rol soporte y no hay nada del lado
 * del comercio.
 *
 * Tabla NUEVA, no columnas: así llega sola a producción con `schema.sql`. Los
 * textos van en los dos idiomas (sitio bilingüe); la foto va en nuestro bucket
 * (`imagen_clave`, se sirve por /media) y es opcional: sin foto el banner se
 * dibuja con el color de la casa y su título. `cada_cuantos` es cada cuántos
 * productos aparece en una parrilla; `ubicacion` en qué parrillas (portada,
 * tienda, catálogo o todas); `tienda_id` lo deja fijo a una tienda concreta
 * (null = en todas las tiendas); `desde`/`hasta` programan la campaña.
 */
export const banners = sqliteTable(
  "banners",
  {
    id: text("id").primaryKey(),
    tituloEs: text("titulo_es").notNull(),
    tituloEn: text("titulo_en"),
    textoEs: text("texto_es"),
    textoEn: text("texto_en"),
    /** Texto del botón: «Ver tienda», «Ver ofertas»… Opcional. */
    botonEs: text("boton_es"),
    botonEn: text("boton_en"),
    imagenClave: text("imagen_clave"),
    /** A dónde lleva: una ruta del sitio (/tienda/x, /catalogo?categoria=y) o una URL completa. */
    enlace: text("enlace").notNull(),
    /** portada | tienda | catalogo | todas */
    ubicacion: text("ubicacion").notNull().default("todas"),
    /** Si solo sale en la parrilla de UNA tienda. null = en todas. */
    tiendaId: text("tienda_id").references(() => tiendas.id, {
      onDelete: "set null",
    }),
    cadaCuantos: integer("cada_cuantos").notNull().default(12),
    orden: integer("orden").notNull().default(0),
    activo: integer("activo", { mode: "boolean" }).notNull().default(true),
    desde: integer("desde", { mode: "timestamp" }),
    hasta: integer("hasta", { mode: "timestamp" }),
    /** El país (mercado) donde sale. Un banner de mercatren.com no sale en .cl. */
    mercado: text("mercado").notNull().default("US"),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    actualizadoEn: integer("actualizado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("idx_banners_activo_mercado").on(t.activo, t.mercado),
    index("idx_banners_tienda").on(t.tiendaId),
  ],
);

/**
 * LOS VIDEOS DE CADA TIENDA (23 ago 2026): los Shorts de Mercatren.
 *
 * El comercio graba su tienda por dentro con el teléfono, en vertical, y lo
 * sube desde su panel. Esos videos salen en hileras en la portada —como los
 * Shorts de YouTube, entre bloques de productos—, en la ficha de su tienda, y
 * cada uno tiene SU PROPIA PÁGINA indexable (`/video/<slug>`) con su
 * `VideoObject` y su entrada en el mapa del sitio.
 *
 * Tabla NUEVA, no columnas: así llega sola a producción con `schema.sql`. El
 * archivo vive en nuestro bucket (`clave`, se sirve por `/media`) y la portada
 * también (`portadaClave`): sin portada, la hilera se ve como cinco recuadros
 * negros. El tope de duración son 3 minutos y se guarda en segundos para poder
 * enseñarlo y para el dato estructurado.
 */
export const videosTienda = sqliteTable(
  "videos_tienda",
  {
    id: text("id").primaryKey(),
    tiendaId: text("tienda_id")
      .notNull()
      .references(() => tiendas.id, { onDelete: "cascade" }),
    /** La dirección pública del video: /video/<slug>. No se cambia una vez publicado. */
    slug: text("slug").notNull().unique(),
    tituloEs: text("titulo_es").notNull(),
    tituloEn: text("titulo_en"),
    descripcionEs: text("descripcion_es"),
    descripcionEn: text("descripcion_en"),
    /** El archivo en el bucket. Se sirve por /media con soporte de rangos. */
    clave: text("clave").notNull(),
    /** La portada (un fotograma). La saca el navegador del propio video al subirlo. */
    portadaClave: text("portada_clave"),
    duracionSegundos: integer("duracion_segundos").notNull().default(0),
    anchoPx: integer("ancho_px"),
    altoPx: integer("alto_px"),
    pesoBytes: integer("peso_bytes").notNull().default(0),
    /** Un producto concreto, si el video habla de uno. Opcional. */
    productoId: text("producto_id").references(() => productos.id, {
      onDelete: "set null",
    }),
    /** publicado | borrador | oculto (lo esconde el equipo). */
    estado: text("estado").notNull().default("publicado"),
    /** Cuántas veces se abrió su página o se reprodujo en el visor. */
    vistas: integer("vistas").notNull().default(0),
    /** El país (mercado) donde sale, igual que el catálogo. */
    mercado: text("mercado").notNull().default("US"),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    actualizadoEn: integer("actualizado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("idx_videos_tienda").on(t.tiendaId),
    index("idx_videos_estado_mercado").on(t.estado, t.mercado),
    index("idx_videos_creado").on(t.creadoEn),
  ],
);

/**
 * LOS CORAZONES DE UN VIDEO (24 ago 2026).
 *
 * Uno por persona y por video: la llave primaria es la pareja, así que dar dos
 * veces no suma dos. Se guarda quién para poder quitarlo (el corazón se toca
 * otra vez y se va) y para que nadie infle el número con recargas.
 *
 * Hace falta sesión: un contador que cualquiera puede subir desde una ventana
 * de incógnito no significa nada, y aquí el número se le enseña al comercio
 * como señal de qué video funciona.
 */
export const meGustaVideo = sqliteTable(
  "me_gusta_video",
  {
    videoId: text("video_id")
      .notNull()
      .references(() => videosTienda.id, { onDelete: "cascade" }),
    usuarioId: text("usuario_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    primaryKey({ columns: [t.videoId, t.usuarioId] }),
    index("idx_me_gusta_video").on(t.videoId),
  ],
);

/**
 * LOS COMENTARIOS DE UN VIDEO.
 *
 * Con sesión, siempre: un comentario anónimo en la tienda de un comercio es
 * spam y es soporte. Se publican de una —esperar moderación mata la
 * conversación— y **el comercio dueño del video y el equipo pueden ocultarlos**
 * (`estado = 'oculto'`), que es la moderación que de verdad se usa. Quien lo
 * escribió puede borrar el suyo.
 *
 * No se borra la fila al ocultar: si mañana hay una discusión sobre lo que
 * alguien escribió, el rastro tiene que existir.
 */
export const comentariosVideo = sqliteTable(
  "comentarios_video",
  {
    id: text("id").primaryKey(),
    videoId: text("video_id")
      .notNull()
      .references(() => videosTienda.id, { onDelete: "cascade" }),
    usuarioId: text("usuario_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    texto: text("texto").notNull(),
    /** publicado | oculto */
    estado: text("estado").notNull().default("publicado"),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("idx_comentarios_video").on(t.videoId, t.estado)],
);

/**
 * EL AVISO AL SISTEMA DEL COMERCIO CUANDO ENTRA UN PAGO (24 ago 2026).
 *
 * Se lo prometimos al comercio piloto: su sistema hace la factura, crea el
 * cobro por enlace y **quiere enterarse solo** cuando el cliente paga, sin
 * estar preguntando cada minuto por `/datos/socios/cobro`.
 *
 * Tabla nueva, una fila por tienda. El `secreto` firma cada envío (HMAC-SHA256
 * en la cabecera `X-Mercatren-Firma`): sin firma, cualquiera que adivine la
 * dirección del comercio podría decirle que le pagaron. `ultimoError` guarda
 * el motivo del último fallo para que el comercio lo vea en su panel — un
 * aviso que falla en silencio es peor que no tenerlo.
 */
export const webhooksTienda = sqliteTable("webhooks_tienda", {
  tiendaId: text("tienda_id")
    .primaryKey()
    .references(() => tiendas.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  secreto: text("secreto").notNull(),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  ultimoIntentoEn: integer("ultimo_intento_en", { mode: "timestamp" }),
  ultimoOkEn: integer("ultimo_ok_en", { mode: "timestamp" }),
  ultimoError: text("ultimo_error"),
  creadoEn: integer("creado_en", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * LAS SECCIONES DE VIDEO DE MERCATREN (24 ago 2026).
 *
 * La primera es «Tu Próximo Producto Ganador»: el dueño va a los almacenes que
 * trabajan con nosotros y graba recomendaciones de productos que pueden
 * venderse bien. Habrá muchas más.
 *
 * ══ SON NEUTRAS, Y ESO ES LO QUE LAS DEFINE ══
 *
 * Un video de una sección **no lleva a la tienda de nadie**: lleva a
 * Mercatren. No es cortesía — es lo que hace que la recomendación valga. En
 * cuanto un video de «producto ganador» empuja a un comercio concreto deja de
 * ser una recomendación y pasa a ser publicidad pagada de ese comercio, y el
 * que la mira lo nota.
 *
 * ══ EL ENLACE QUE ES LA HERRAMIENTA ══
 *
 * `llaveSubida` es un secreto largo e inadivinable: con él se arma
 * `/subir/<llave>`, que se abre en el celular y **es** la herramienta de
 * subida — sin cuenta, sin login, desde un almacén y con una mano. El `pin`
 * de cuatro dígitos es la segunda capa, y se comprueba SIEMPRE en el
 * servidor: un PIN validado en el navegador no es un PIN.
 *
 * El PIN se guarda derivado con PBKDF2 y su propia sal, nunca en claro. Con
 * solo diez mil combinaciones posibles, lo que de verdad lo protege es el
 * límite de intentos — pero guardarlo en claro sería regalar la llave a
 * cualquiera que lea una copia de la base.
 */
export const seccionesVideo = sqliteTable(
  "secciones_video",
  {
    id: text("id").primaryKey(),
    /** La dirección pública: /seccion/<slug>. No se cambia una vez publicada. */
    slug: text("slug").notNull().unique(),
    nombreEs: text("nombre_es").notNull(),
    nombreEn: text("nombre_en"),
    descripcionEs: text("descripcion_es"),
    descripcionEn: text("descripcion_en"),
    /** El secreto del enlace de subida. Largo a propósito: es la llave. */
    llaveSubida: text("llave_subida").notNull().unique(),
    /** PBKDF2 del PIN de 4 dígitos, en hexadecimal. */
    pinHash: text("pin_hash"),
    pinSal: text("pin_sal"),
    /** `publicada` o `borrador`. */
    estado: text("estado").notNull().default("publicada"),
    mercado: text("mercado").notNull().default("US"),
    /** Menor primero, para ordenar las secciones entre sí. */
    orden: integer("orden").notNull().default(0),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    actualizadoEn: integer("actualizado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("idx_secciones_video_mercado").on(t.mercado, t.estado)],
);

/**
 * QUÉ VIDEO PERTENECE A QUÉ SECCIÓN.
 *
 * Tabla puente y NO una columna en `videos_tienda`, por las dos razones de
 * siempre: `schema.sql` solo trae `CREATE TABLE IF NOT EXISTS` y una columna
 * nueva no llegaría sola a producción; y así el video sigue siendo un video
 * normal —con su visor, sus corazones, sus comentarios, su compresión y sus
 * vistas— sin duplicar ni una línea de todo eso.
 */
export const videosDeSeccion = sqliteTable(
  "videos_de_seccion",
  {
    seccionId: text("seccion_id")
      .notNull()
      .references(() => seccionesVideo.id, { onDelete: "cascade" }),
    videoId: text("video_id")
      .notNull()
      .references(() => videosTienda.id, { onDelete: "cascade" }),
    orden: integer("orden").notNull().default(0),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    primaryKey({ columns: [t.seccionId, t.videoId] }),
    index("idx_videos_de_seccion").on(t.videoId),
  ],
);
