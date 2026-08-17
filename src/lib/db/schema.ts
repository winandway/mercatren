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
