-- schema.sql — YaDominios Cloud lo ejecuta contra env.DB en cada publicacion.
-- Generado por scripts/generar-schema-cloud.ts. NO editar a mano:
--   npm run db:schema-cloud
-- Todo lo de aqui es idempotente: correr dos veces deja lo mismo.
-- SOLO tablas y el comercio piloto: esto corre en CADA publicacion y tiene
-- que ser rapido. El catalogo y el historico se cargan aparte, una vez.

-- ── Tablas (0000_young_dormammu.sql) ──
CREATE TABLE IF NOT EXISTS `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS `idx_account_user` ON `account` (`user_id`);
CREATE TABLE IF NOT EXISTS `billeteras` (
	`id` text PRIMARY KEY NOT NULL,
	`tienda_id` text NOT NULL,
	`saldo_centavos` integer DEFAULT 0 NOT NULL,
	`moneda` text DEFAULT 'USD' NOT NULL,
	`proveedor` text DEFAULT 'tokiia' NOT NULL,
	`proveedor_billetera_id` text,
	`estado` text DEFAULT 'activa' NOT NULL,
	`sincronizado_en` integer,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS `billeteras_tienda_id_unique` ON `billeteras` (`tienda_id`);
CREATE INDEX IF NOT EXISTS `idx_billeteras_tienda` ON `billeteras` (`tienda_id`);
CREATE TABLE IF NOT EXISTS `categorias` (
	`id` text PRIMARY KEY NOT NULL,
	`tienda_id` text,
	`slug` text NOT NULL,
	`nombre_es` text NOT NULL,
	`nombre_en` text,
	`padre_id` text,
	`orden` integer DEFAULT 0 NOT NULL,
	`externo_id` text,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_categorias_tienda_slug` ON `categorias` (`tienda_id`,`slug`);
CREATE INDEX IF NOT EXISTS `idx_categorias_padre` ON `categorias` (`padre_id`);
CREATE TABLE IF NOT EXISTS `configuracion` (
	`clave` text PRIMARY KEY NOT NULL,
	`valor` text NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL
);

CREATE TABLE IF NOT EXISTS `fuentes_catalogo` (
	`id` text PRIMARY KEY NOT NULL,
	`tienda_id` text NOT NULL,
	`nombre` text NOT NULL,
	`url` text,
	`token` text,
	`estado` text DEFAULT 'activa' NOT NULL,
	`cada_minutos` integer DEFAULT 15 NOT NULL,
	`ultima_sincronizacion` integer,
	`ultimo_resultado` text,
	`productos_sincronizados` integer DEFAULT 0 NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS `idx_fuentes_tienda` ON `fuentes_catalogo` (`tienda_id`);
CREATE TABLE IF NOT EXISTS `imagenes_producto` (
	`id` text PRIMARY KEY NOT NULL,
	`producto_id` text NOT NULL,
	`clave` text,
	`url` text,
	`texto_alt_es` text,
	`texto_alt_en` text,
	`orden` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS `idx_imagenes_producto` ON `imagenes_producto` (`producto_id`);
CREATE TABLE IF NOT EXISTS `items_pedido` (
	`id` text PRIMARY KEY NOT NULL,
	`pedido_id` text NOT NULL,
	`producto_id` text,
	`tienda_id` text NOT NULL,
	`titulo` text NOT NULL,
	`precio_unitario_centavos` integer NOT NULL,
	`cantidad` integer DEFAULT 1 NOT NULL,
	`subtotal_centavos` integer NOT NULL,
	`comision_centavos` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX IF NOT EXISTS `idx_items_pedido` ON `items_pedido` (`pedido_id`);
CREATE INDEX IF NOT EXISTS `idx_items_tienda` ON `items_pedido` (`tienda_id`);
CREATE TABLE IF NOT EXISTS `movimientos_billetera` (
	`id` text PRIMARY KEY NOT NULL,
	`billetera_id` text NOT NULL,
	`tipo` text NOT NULL,
	`monto_centavos` integer NOT NULL,
	`saldo_resultante_centavos` integer NOT NULL,
	`referencia` text,
	`nota` text,
	`hecho_por_id` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`billetera_id`) REFERENCES `billeteras`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`hecho_por_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX IF NOT EXISTS `idx_movimientos_billetera` ON `movimientos_billetera` (`billetera_id`);
CREATE INDEX IF NOT EXISTS `idx_movimientos_referencia` ON `movimientos_billetera` (`referencia`);
CREATE TABLE IF NOT EXISTS `pagos` (
	`id` text PRIMARY KEY NOT NULL,
	`pedido_id` text NOT NULL,
	`metodo` text NOT NULL,
	`estado` text DEFAULT 'pendiente' NOT NULL,
	`monto_centavos` integer NOT NULL,
	`moneda` text DEFAULT 'USD' NOT NULL,
	`referencia_externa` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS `idx_pagos_pedido` ON `pagos` (`pedido_id`);
CREATE INDEX IF NOT EXISTS `idx_pagos_estado` ON `pagos` (`estado`);
CREATE TABLE IF NOT EXISTS `pagos_zelle` (
	`id` text PRIMARY KEY NOT NULL,
	`origen` text DEFAULT 'live' NOT NULL,
	`tipo` text DEFAULT 'entrada' NOT NULL,
	`estado` text DEFAULT 'pendiente' NOT NULL,
	`monto_centavos` integer NOT NULL,
	`comision_centavos` integer DEFAULT 0 NOT NULL,
	`neto_centavos` integer DEFAULT 0 NOT NULL,
	`moneda` text DEFAULT 'USD' NOT NULL,
	`recibo_url` text,
	`notas` text,
	`motivo_rechazo` text,
	`subido_en` integer,
	`aprobado_en` integer,
	`fecha_transaccion` integer,
	`codigo_confirmacion` text,
	`pagador_nombre_crudo` text,
	`pagador_nombre` text,
	`pagador_correo` text,
	`pagador_tipo` text DEFAULT 'desconocido' NOT NULL,
	`banco_origen` text,
	`cuenta_ultimos4` text,
	`receptor_nombre_crudo` text,
	`cuenta_receptora` text,
	`plataforma` text,
	`direccion_comprobante` text,
	`seller_cuenta` text,
	`seller_referencia` text,
	`tienda_id` text,
	`pedido_id` text,
	`validador_id` text,
	`revisado_en` integer,
	`billetera_id` text,
	`movimiento_billetera_id` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`validador_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`billetera_id`) REFERENCES `billeteras`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`movimiento_billetera_id`) REFERENCES `movimientos_billetera`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX IF NOT EXISTS `idx_zelle_estado` ON `pagos_zelle` (`estado`);
CREATE INDEX IF NOT EXISTS `idx_zelle_tipo` ON `pagos_zelle` (`tipo`);
CREATE INDEX IF NOT EXISTS `idx_zelle_origen` ON `pagos_zelle` (`origen`);
CREATE INDEX IF NOT EXISTS `idx_zelle_subido` ON `pagos_zelle` (`subido_en`);
CREATE INDEX IF NOT EXISTS `idx_zelle_cuenta_receptora` ON `pagos_zelle` (`cuenta_receptora`);
CREATE INDEX IF NOT EXISTS `idx_zelle_banco` ON `pagos_zelle` (`banco_origen`);
CREATE INDEX IF NOT EXISTS `idx_zelle_codigo` ON `pagos_zelle` (`codigo_confirmacion`);
CREATE INDEX IF NOT EXISTS `idx_zelle_monto` ON `pagos_zelle` (`monto_centavos`);
CREATE INDEX IF NOT EXISTS `idx_zelle_seller` ON `pagos_zelle` (`seller_cuenta`);
CREATE TABLE IF NOT EXISTS `pedidos` (
	`id` text PRIMARY KEY NOT NULL,
	`numero` text NOT NULL,
	`cliente_id` text NOT NULL,
	`estado` text DEFAULT 'pendiente_pago' NOT NULL,
	`subtotal_centavos` integer DEFAULT 0 NOT NULL,
	`envio_centavos` integer DEFAULT 0 NOT NULL,
	`impuestos_centavos` integer DEFAULT 0 NOT NULL,
	`total_centavos` integer DEFAULT 0 NOT NULL,
	`moneda` text DEFAULT 'USD' NOT NULL,
	`metodo_pago` text,
	`direccion_entrega` text,
	`pais_destino` text,
	`telefono_contacto` text,
	`notas_cliente` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS `pedidos_numero_unique` ON `pedidos` (`numero`);
CREATE INDEX IF NOT EXISTS `idx_pedidos_cliente` ON `pedidos` (`cliente_id`);
CREATE INDEX IF NOT EXISTS `idx_pedidos_estado` ON `pedidos` (`estado`);
CREATE TABLE IF NOT EXISTS `productos` (
	`id` text PRIMARY KEY NOT NULL,
	`tienda_id` text NOT NULL,
	`categoria_id` text,
	`slug` text NOT NULL,
	`sku` text,
	`marca` text,
	`titulo_es` text NOT NULL,
	`titulo_en` text,
	`descripcion_es` text,
	`descripcion_en` text,
	`precio_centavos` integer NOT NULL,
	`precio_base_centavos` integer,
	`deposito_id` text,
	`precio_antes_centavos` integer,
	`moneda` text DEFAULT 'USD' NOT NULL,
	`existencias` real DEFAULT 0 NOT NULL,
	`controla_existencias` integer DEFAULT true NOT NULL,
	`unidad` text,
	`peso_gramos` integer,
	`estado` text DEFAULT 'borrador' NOT NULL,
	`destacado` integer DEFAULT false NOT NULL,
	`fuente_id` text,
	`externo_id` text,
	`sincronizado_en` integer,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fuente_id`) REFERENCES `fuentes_catalogo`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_productos_tienda_slug` ON `productos` (`tienda_id`,`slug`);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_productos_externo` ON `productos` (`tienda_id`,`externo_id`);
CREATE INDEX IF NOT EXISTS `idx_productos_estado` ON `productos` (`estado`);
CREATE INDEX IF NOT EXISTS `idx_productos_categoria` ON `productos` (`categoria_id`);
CREATE INDEX IF NOT EXISTS `idx_productos_destacado` ON `productos` (`destacado`);
CREATE TABLE IF NOT EXISTS `session` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS `session_token_unique` ON `session` (`token`);
CREATE INDEX IF NOT EXISTS `idx_session_user` ON `session` (`user_id`);
CREATE TABLE IF NOT EXISTS `tiendas` (
	`id` text PRIMARY KEY NOT NULL,
	`propietario_id` text,
	`slug` text NOT NULL,
	`nombre` text NOT NULL,
	`descripcion_es` text,
	`descripcion_en` text,
	`logo_clave` text,
	`portada_clave` text,
	`estado` text DEFAULT 'borrador' NOT NULL,
	`comision_puntos_base` integer DEFAULT 300 NOT NULL,
	`stripe_cuenta_id` text,
	`pais_origen` text DEFAULT 'US' NOT NULL,
	`razon_social` text,
	`identificacion_fiscal` text,
	`correo_contacto` text,
	`telefono` text,
	`direccion` text,
	`ciudad` text,
	`sitio_web` text,
	`horario` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`propietario_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE UNIQUE INDEX IF NOT EXISTS `tiendas_slug_unique` ON `tiendas` (`slug`);
CREATE INDEX IF NOT EXISTS `idx_tiendas_propietario` ON `tiendas` (`propietario_id`);
CREATE INDEX IF NOT EXISTS `idx_tiendas_estado` ON `tiendas` (`estado`);
CREATE TABLE IF NOT EXISTS `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`rol` text DEFAULT 'cliente' NOT NULL,
	`idioma` text DEFAULT 'es' NOT NULL,
	`pais_entrega` text,
	`telefono` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `user_email_unique` ON `user` (`email`);
CREATE INDEX IF NOT EXISTS `idx_user_rol` ON `user` (`rol`);
CREATE TABLE IF NOT EXISTS `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);

CREATE INDEX IF NOT EXISTS `idx_verification_identifier` ON `verification` (`identifier`);
-- ── Tablas (0001_curly_lady_deathstrike.sql) ──
CREATE TABLE IF NOT EXISTS `retiros_fee` (
	`id` text PRIMARY KEY NOT NULL,
	`monto_centavos` integer NOT NULL,
	`moneda` text DEFAULT 'USD' NOT NULL,
	`hecho_en` integer NOT NULL,
	`nota` text,
	`origen` text DEFAULT 'live' NOT NULL,
	`hecho_por_id` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`hecho_por_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX IF NOT EXISTS `idx_retiros_fee_fecha` ON `retiros_fee` (`hecho_en`);
-- ── Tablas (0002_brainy_lord_tyger.sql) ──
CREATE TABLE IF NOT EXISTS `retiros` (
	`id` text PRIMARY KEY NOT NULL,
	`tienda_id` text NOT NULL,
	`solicitado_por_id` text,
	`monto_centavos` integer NOT NULL,
	`moneda` text DEFAULT 'USD' NOT NULL,
	`estado` text DEFAULT 'solicitado' NOT NULL,
	`forma` text NOT NULL,
	`destino` text,
	`destino_tienda_id` text,
	`nota_comercio` text,
	`motivo_rechazo` text,
	`referencia` text,
	`resuelto_por_id` text,
	`resuelto_en` integer,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`solicitado_por_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`destino_tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resuelto_por_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX IF NOT EXISTS `idx_retiros_tienda` ON `retiros` (`tienda_id`);
CREATE INDEX IF NOT EXISTS `idx_retiros_estado` ON `retiros` (`estado`);
CREATE INDEX IF NOT EXISTS `idx_retiros_fecha` ON `retiros` (`creado_en`);
-- ── Tablas (0003_loose_virginia_dare.sql) ──
CREATE TABLE IF NOT EXISTS `depositos` (
	`id` text PRIMARY KEY NOT NULL,
	`tienda_id` text NOT NULL,
	`nombre` text NOT NULL,
	`que_guarda` text,
	`zona` text NOT NULL,
	`direccion` text,
	`como_llegar` text,
	`externo_nombre` text,
	`activo` integer DEFAULT true NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS `idx_depositos_tienda` ON `depositos` (`tienda_id`);
CREATE INDEX IF NOT EXISTS `idx_depositos_zona` ON `depositos` (`zona`);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_depositos_tienda_nombre` ON `depositos` (`tienda_id`,`nombre`);
-- ── Tablas (0004_curly_raza.sql) ──
CREATE TABLE IF NOT EXISTS `medidas_producto` (
	`producto_id` text PRIMARY KEY NOT NULL,
	`peso_gramos` integer,
	`largo_mm` integer,
	`ancho_mm` integer,
	`alto_mm` integer,
	`material_es` text,
	`material_en` text,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `variantes_producto` (
	`id` text PRIMARY KEY NOT NULL,
	`producto_id` text NOT NULL,
	`talla` text,
	`color` text,
	`color_hex` text,
	`sku` text,
	`precio_base_centavos` integer DEFAULT 0 NOT NULL,
	`precio_centavos` integer DEFAULT 0 NOT NULL,
	`existencias` real DEFAULT 0 NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS `idx_variantes_producto` ON `variantes_producto` (`producto_id`);
CREATE UNIQUE INDEX IF NOT EXISTS `uq_variante_combinacion` ON `variantes_producto` (`producto_id`,`talla`,`color`);
-- ── Tablas (0005_silly_anita_blake.sql) ──
CREATE TABLE IF NOT EXISTS `items_variante` (
	`item_pedido_id` text PRIMARY KEY NOT NULL,
	`variante_id` text NOT NULL,
	FOREIGN KEY (`item_pedido_id`) REFERENCES `items_pedido`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variante_id`) REFERENCES `variantes_producto`(`id`) ON UPDATE no action ON DELETE no action
);
-- ── Tablas (0006_true_gorgon.sql) ──
CREATE TABLE IF NOT EXISTS `aceptaciones` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`documento` text NOT NULL,
	`version` text NOT NULL,
	`contexto` text NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS `idx_aceptaciones_usuario` ON `aceptaciones` (`user_id`);
-- ── Tablas (0007_cynical_exodus.sql) ──
CREATE TABLE IF NOT EXISTS `creditos_cliente` (
	`id` text PRIMARY KEY NOT NULL,
	`tienda_id` text NOT NULL,
	`cliente_id` text NOT NULL,
	`tope_centavos` integer DEFAULT 0 NOT NULL,
	`dias_plazo` integer DEFAULT 30 NOT NULL,
	`estado` text DEFAULT 'activo' NOT NULL,
	`activado_por_id` text,
	`nota_interna` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cliente_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`activado_por_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_credito_tienda_cliente` ON `creditos_cliente` (`tienda_id`,`cliente_id`);
CREATE INDEX IF NOT EXISTS `idx_credito_tienda` ON `creditos_cliente` (`tienda_id`);
CREATE INDEX IF NOT EXISTS `idx_credito_cliente` ON `creditos_cliente` (`cliente_id`);
CREATE TABLE IF NOT EXISTS `pedidos_credito` (
	`pedido_id` text PRIMARY KEY NOT NULL,
	`credito_id` text NOT NULL,
	`tienda_id` text NOT NULL,
	`cliente_id` text NOT NULL,
	`total_centavos` integer NOT NULL,
	`estado` text DEFAULT 'abierto' NOT NULL,
	`vence_en` integer NOT NULL,
	`saldado_en` integer,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`credito_id`) REFERENCES `creditos_cliente`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cliente_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS `idx_pedcredito_tienda` ON `pedidos_credito` (`tienda_id`);
CREATE INDEX IF NOT EXISTS `idx_pedcredito_cliente` ON `pedidos_credito` (`cliente_id`);
CREATE INDEX IF NOT EXISTS `idx_pedcredito_estado` ON `pedidos_credito` (`estado`);
-- ── Tablas (0008_massive_crusher_hogan.sql) ──
CREATE TABLE IF NOT EXISTS `facturas` (
	`id` text PRIMARY KEY NOT NULL,
	`numero` text NOT NULL,
	`tipo` text DEFAULT 'venta' NOT NULL,
	`pedido_id` text NOT NULL,
	`cliente_id` text NOT NULL,
	`emisor_nombre` text NOT NULL,
	`emisor_identificacion` text,
	`emisor_direccion` text,
	`receptor_nombre` text NOT NULL,
	`receptor_correo` text,
	`receptor_direccion` text,
	`subtotal_centavos` integer NOT NULL,
	`impuestos_centavos` integer DEFAULT 0 NOT NULL,
	`total_centavos` integer NOT NULL,
	`moneda` text DEFAULT 'USD' NOT NULL,
	`idioma` text DEFAULT 'es' NOT NULL,
	`emitida_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cliente_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS `facturas_numero_unique` ON `facturas` (`numero`);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_facturas_pedido` ON `facturas` (`pedido_id`);
CREATE INDEX IF NOT EXISTS `idx_facturas_cliente` ON `facturas` (`cliente_id`);
CREATE INDEX IF NOT EXISTS `idx_facturas_emitida` ON `facturas` (`emitida_en`);
CREATE TABLE IF NOT EXISTS `lineas_factura` (
	`id` text PRIMARY KEY NOT NULL,
	`factura_id` text NOT NULL,
	`descripcion` text NOT NULL,
	`cantidad` real DEFAULT 1 NOT NULL,
	`precio_unitario_centavos` integer NOT NULL,
	`subtotal_centavos` integer NOT NULL,
	FOREIGN KEY (`factura_id`) REFERENCES `facturas`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS `idx_lineas_factura` ON `lineas_factura` (`factura_id`);
CREATE TABLE IF NOT EXISTS `ordenes_compra` (
	`id` text PRIMARY KEY NOT NULL,
	`numero` text NOT NULL,
	`pedido_id` text NOT NULL,
	`tienda_id` text NOT NULL,
	`subtotal_centavos` integer NOT NULL,
	`moneda` text DEFAULT 'USD' NOT NULL,
	`estado` text DEFAULT 'emitida' NOT NULL,
	`factura_proveedor_numero` text,
	`factura_proveedor_clave` text,
	`facturada_en` integer,
	`emitida_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS `ordenes_compra_numero_unique` ON `ordenes_compra` (`numero`);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_oc_pedido_tienda` ON `ordenes_compra` (`pedido_id`,`tienda_id`);
CREATE INDEX IF NOT EXISTS `idx_oc_tienda` ON `ordenes_compra` (`tienda_id`);
CREATE INDEX IF NOT EXISTS `idx_oc_estado` ON `ordenes_compra` (`estado`);
CREATE TABLE IF NOT EXISTS `series_documento` (
	`id` text PRIMARY KEY NOT NULL,
	`prefijo` text NOT NULL,
	`ultimo` integer DEFAULT 0 NOT NULL
);
-- ── Tablas (0009_dashing_risque.sql) ──
CREATE TABLE IF NOT EXISTS `envios_tienda` (
	`tienda_id` text PRIMARY KEY NOT NULL,
	`modo` text DEFAULT 'sin_definir' NOT NULL,
	`porcentaje_puntos_base` integer DEFAULT 0 NOT NULL,
	`cobertura_es` text,
	`cobertura_en` text,
	`plazo_es` text,
	`plazo_en` text,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade
);
-- ── Tablas (0010_handy_black_panther.sql) ──
CREATE TABLE IF NOT EXISTS `apariencia_tienda` (
	`tienda_id` text PRIMARY KEY NOT NULL,
	`color_banner` text,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade
);
-- ── Tablas (0011_quiet_the_anarchist.sql) ──
CREATE TABLE IF NOT EXISTS `socios_tienda` (
	`id` text PRIMARY KEY NOT NULL,
	`tienda_id` text NOT NULL,
	`plataforma` text NOT NULL,
	`externo_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`cursor` text,
	`ultimo_resultado` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade
);
-- ── Tablas (0012_fine_tyger_tiger.sql) ──
CREATE TABLE IF NOT EXISTS `socios_alias` (
	`id` text PRIMARY KEY NOT NULL,
	`tienda_id` text NOT NULL,
	`externo_id` text NOT NULL,
	`producto_id` text NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS `socios_alias_tienda_externo` ON `socios_alias` (`tienda_id`,`externo_id`);
CREATE INDEX IF NOT EXISTS `socios_alias_producto` ON `socios_alias` (`producto_id`);
-- ── Tablas (0013_long_sage.sql) ──
CREATE TABLE IF NOT EXISTS `verificacion_tienda` (
	`tienda_id` text PRIMARY KEY NOT NULL,
	`estado` text DEFAULT 'en_observacion' NOT NULL,
	`notas` text,
	`revisado_por` text,
	`revisado_en` integer,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`revisado_por`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
-- ── Tablas (0014_cynical_karnak.sql) ──
CREATE TABLE IF NOT EXISTS `preguntas_producto` (
	`id` text PRIMARY KEY NOT NULL,
	`producto_id` text NOT NULL,
	`tienda_id` text NOT NULL,
	`pregunta_es` text NOT NULL,
	`pregunta_en` text,
	`respuesta_es` text,
	`respuesta_en` text,
	`autor` text DEFAULT 'comercio' NOT NULL,
	`usuario_id` text,
	`orden` integer DEFAULT 0 NOT NULL,
	`estado` text DEFAULT 'publicada' NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	`respondido_en` integer,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`usuario_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE INDEX IF NOT EXISTS `preguntas_producto_producto` ON `preguntas_producto` (`producto_id`);
-- ── Tablas (0015_purple_sumo.sql) ──
CREATE TABLE IF NOT EXISTS `huellas_comprobante` (
	`pago_id` text PRIMARY KEY NOT NULL,
	`huella` text NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`pago_id`) REFERENCES `pagos_zelle`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS `idx_huellas_comprobante` ON `huellas_comprobante` (`huella`);
-- ── Tablas (0016_early_hex.sql) ──
CREATE TABLE IF NOT EXISTS `disputas` (
	`id` text PRIMARY KEY NOT NULL,
	`intento_id` text,
	`pedido_id` text,
	`estado` text DEFAULT 'abierta' NOT NULL,
	`monto_centavos` integer DEFAULT 0 NOT NULL,
	`moneda` text DEFAULT 'USD' NOT NULL,
	`motivo` text,
	`responde_hasta` integer,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX IF NOT EXISTS `idx_disputas_pedido` ON `disputas` (`pedido_id`);
CREATE INDEX IF NOT EXISTS `idx_disputas_estado` ON `disputas` (`estado`);
CREATE TABLE IF NOT EXISTS `hitos_pedido` (
	`id` text PRIMARY KEY NOT NULL,
	`pedido_id` text NOT NULL,
	`hito` text NOT NULL,
	`hecho_por_id` text,
	`hecho_por_nombre` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`hecho_por_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX IF NOT EXISTS `idx_hitos_pedido` ON `hitos_pedido` (`pedido_id`);
-- ── Tablas (0017_mighty_the_call.sql) ──
CREATE TABLE IF NOT EXISTS `cobros_solicitados` (
	`id` text PRIMARY KEY NOT NULL,
	`tienda_id` text NOT NULL,
	`enlace` text NOT NULL,
	`referencia` text NOT NULL,
	`monto_centavos` integer NOT NULL,
	`moneda` text DEFAULT 'USD' NOT NULL,
	`estado` text DEFAULT 'abierto' NOT NULL,
	`cliente_id` text,
	`contacto_correo` text NOT NULL,
	`contacto_nombre` text,
	`concepto` text,
	`vence_en` integer,
	`pago_id` text,
	`pagado_en` integer,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cliente_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS `cobros_solicitados_enlace_unique` ON `cobros_solicitados` (`enlace`);
CREATE INDEX IF NOT EXISTS `idx_cobros_tienda` ON `cobros_solicitados` (`tienda_id`);
CREATE INDEX IF NOT EXISTS `idx_cobros_estado` ON `cobros_solicitados` (`estado`);
CREATE INDEX IF NOT EXISTS `idx_cobros_referencia` ON `cobros_solicitados` (`referencia`);
-- ── Tablas (0018_futuristic_prowler.sql) ──
CREATE TABLE IF NOT EXISTS `intentos_acceso` (
	`llave` text PRIMARY KEY NOT NULL,
	`intentos` integer DEFAULT 0 NOT NULL,
	`ventana_desde` integer NOT NULL
);
-- ── Tablas (0019_unique_spyke.sql) ──
CREATE TABLE IF NOT EXISTS `pruebas_entrega` (
	`id` text PRIMARY KEY NOT NULL,
	`pedido_id` text NOT NULL,
	`tipo` text NOT NULL,
	`referencia` text,
	`clave` text,
	`nota` text,
	`subido_por_id` text,
	`subido_por_nombre` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subido_por_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX IF NOT EXISTS `idx_pruebas_entrega` ON `pruebas_entrega` (`pedido_id`);
-- ── Tablas (0020_colorful_switch.sql) ──
CREATE TABLE IF NOT EXISTS `rechazos_correo` (
	`id` text PRIMARY KEY NOT NULL,
	`correo` text NOT NULL,
	`dominio` text NOT NULL,
	`motivo` text NOT NULL,
	`ip` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL
);
-- ── Tablas (0021_bizarre_grim_reaper.sql) ──
CREATE TABLE IF NOT EXISTS `cobros_zelle` (
	`pago_zelle_id` text PRIMARY KEY NOT NULL,
	`cobro_id` text NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`pago_zelle_id`) REFERENCES `pagos_zelle`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cobro_id`) REFERENCES `cobros_solicitados`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS `idx_cobros_zelle_cobro` ON `cobros_zelle` (`cobro_id`);
CREATE TABLE IF NOT EXISTS `comprobantes_retiro` (
	`id` text PRIMARY KEY NOT NULL,
	`retiro_id` text NOT NULL,
	`clave` text NOT NULL,
	`subido_por_id` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`retiro_id`) REFERENCES `retiros`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subido_por_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX IF NOT EXISTS `idx_comprobantes_retiro` ON `comprobantes_retiro` (`retiro_id`);
CREATE TABLE IF NOT EXISTS `valoraciones` (
	`id` text PRIMARY KEY NOT NULL,
	`producto_id` text NOT NULL,
	`usuario_id` text NOT NULL,
	`estrellas` integer NOT NULL,
	`comentario` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`usuario_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_valoracion_unica` ON `valoraciones` (`producto_id`,`usuario_id`);
CREATE INDEX IF NOT EXISTS `idx_valoraciones_producto` ON `valoraciones` (`producto_id`);
CREATE TABLE IF NOT EXISTS `zelle_cobros_tienda` (
	`tienda_id` text PRIMARY KEY NOT NULL,
	`habilitado` integer DEFAULT false NOT NULL,
	`minimo_centavos` integer,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade
);

-- ── Comercio piloto y su billetera ──
-- La billetera nace en CERO (el historico ya se liquido en el sistema
-- anterior) y DO NOTHING garantiza que un despliegue jamas pise el
-- saldo real que este andando en produccion.
INSERT INTO tiendas (id, slug, nombre, estado, comision_puntos_base, pais_origen, descripcion_es, descripcion_en, creado_en, actualizado_en)
VALUES ('tienda-bley-ferreteria', 'bley-ferreteria', 'Ferremateriales Bley C.A', 'activa', 300, 'VE', NULL, NULL, 1786886766, 1786886766)
ON CONFLICT(id) DO NOTHING;

INSERT INTO billeteras (id, tienda_id, saldo_centavos, moneda, proveedor, estado, creado_en)
VALUES ('billetera-bley-ferreteria', 'tienda-bley-ferreteria', 0, 'USD', 'tokiia', 'activa', 1786886766)
ON CONFLICT(tienda_id) DO NOTHING;

-- ── Departamentos de Mercatren (categorias de la casa, tienda_id NULL) ──
-- Es la lista cerrada que elige el vendedor. Si cada comercio inventara
-- la suya, el mismo taladro acabaria en cuatro categorias distintas y
-- quien busca taladros encontraria una.
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-ferreteria-construccion', NULL, 'ferreteria-construccion', 'Ferretería y construcción', 'Tools & Home Improvement', NULL, 0)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-pintura-acabados', NULL, 'pintura-acabados', 'Pintura y acabados', 'Paint & Finishes', NULL, 1)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-repuestos-carro', NULL, 'repuestos-carro', 'Repuestos de carro', 'Auto Parts', NULL, 2)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-motos-repuestos', NULL, 'motos-repuestos', 'Motos y repuestos', 'Motorcycles & Parts', NULL, 3)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-celulares-accesorios', NULL, 'celulares-accesorios', 'Celulares y accesorios', 'Cell Phones & Accessories', NULL, 4)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-computacion', NULL, 'computacion', 'Computación', 'Computers', NULL, 5)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-electronica', NULL, 'electronica', 'Electrónica', 'Electronics', NULL, 6)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-electrodomesticos', NULL, 'electrodomesticos', 'Electrodomésticos', 'Appliances', NULL, 7)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-hogar-muebles', NULL, 'hogar-muebles', 'Hogar y muebles', 'Home & Furniture', NULL, 8)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-cocina-comedor', NULL, 'cocina-comedor', 'Cocina y comedor', 'Kitchen & Dining', NULL, 9)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-belleza-cuidado', NULL, 'belleza-cuidado', 'Belleza y cuidado personal', 'Beauty & Personal Care', NULL, 10)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-salud-bienestar', NULL, 'salud-bienestar', 'Salud y bienestar', 'Health & Wellness', NULL, 11)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-bebes-ninos', NULL, 'bebes-ninos', 'Bebés y niños', 'Baby & Kids', NULL, 12)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-ropa-calzado', NULL, 'ropa-calzado', 'Ropa y calzado', 'Clothing & Shoes', NULL, 13)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-relojes-joyeria', NULL, 'relojes-joyeria', 'Relojes y joyería', 'Watches & Jewelry', NULL, 14)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-deportes-aire-libre', NULL, 'deportes-aire-libre', 'Deportes y aire libre', 'Sports & Outdoors', NULL, 15)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-juguetes-juegos', NULL, 'juguetes-juegos', 'Juguetes y juegos', 'Toys & Games', NULL, 16)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-mascotas', NULL, 'mascotas', 'Mascotas', 'Pet Supplies', NULL, 17)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-jardin-exteriores', NULL, 'jardin-exteriores', 'Jardín y exteriores', 'Garden & Outdoor', NULL, 18)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-oficina-papeleria', NULL, 'oficina-papeleria', 'Oficina y papelería', 'Office & School', NULL, 19)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-agro-campo', NULL, 'agro-campo', 'Agro y campo', 'Farm & Agriculture', NULL, 20)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-industrial-equipos', NULL, 'industrial-equipos', 'Industrial y equipos', 'Industrial & Equipment', NULL, 21)
ON CONFLICT(id) DO NOTHING;
INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden)
VALUES ('dep-otros', NULL, 'otros', 'Otros', 'Other', NULL, 22)
ON CONFLICT(id) DO NOTHING;
