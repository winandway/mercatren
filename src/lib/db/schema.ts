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

/** Roles posibles de una cuenta. "soporte" es la cuenta interna de Windoce LLC. */
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

export const ESTADOS_TIENDA = ["borrador", "activa", "suspendida"] as const;

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
