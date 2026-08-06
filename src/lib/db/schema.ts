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
    /** Comision de Mercatren sobre cada venta, en puntos base (300 = 3%). */
    comisionPuntosBase: integer("comision_puntos_base").notNull().default(300),
    /** Cuenta conectada de Stripe del vendedor, para el pago dividido. */
    stripeCuentaId: text("stripe_cuenta_id"),
    paisOrigen: text("pais_origen").notNull().default("US"),

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
