CREATE TABLE `account` (
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
--> statement-breakpoint
CREATE INDEX `idx_account_user` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `billeteras` (
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
--> statement-breakpoint
CREATE UNIQUE INDEX `billeteras_tienda_id_unique` ON `billeteras` (`tienda_id`);--> statement-breakpoint
CREATE INDEX `idx_billeteras_tienda` ON `billeteras` (`tienda_id`);--> statement-breakpoint
CREATE TABLE `categorias` (
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
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_categorias_tienda_slug` ON `categorias` (`tienda_id`,`slug`);--> statement-breakpoint
CREATE INDEX `idx_categorias_padre` ON `categorias` (`padre_id`);--> statement-breakpoint
CREATE TABLE `configuracion` (
	`clave` text PRIMARY KEY NOT NULL,
	`valor` text NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fuentes_catalogo` (
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
--> statement-breakpoint
CREATE INDEX `idx_fuentes_tienda` ON `fuentes_catalogo` (`tienda_id`);--> statement-breakpoint
CREATE TABLE `imagenes_producto` (
	`id` text PRIMARY KEY NOT NULL,
	`producto_id` text NOT NULL,
	`clave` text,
	`url` text,
	`texto_alt_es` text,
	`texto_alt_en` text,
	`orden` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_imagenes_producto` ON `imagenes_producto` (`producto_id`);--> statement-breakpoint
CREATE TABLE `items_pedido` (
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
--> statement-breakpoint
CREATE INDEX `idx_items_pedido` ON `items_pedido` (`pedido_id`);--> statement-breakpoint
CREATE INDEX `idx_items_tienda` ON `items_pedido` (`tienda_id`);--> statement-breakpoint
CREATE TABLE `movimientos_billetera` (
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
--> statement-breakpoint
CREATE INDEX `idx_movimientos_billetera` ON `movimientos_billetera` (`billetera_id`);--> statement-breakpoint
CREATE INDEX `idx_movimientos_referencia` ON `movimientos_billetera` (`referencia`);--> statement-breakpoint
CREATE TABLE `pagos` (
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
--> statement-breakpoint
CREATE INDEX `idx_pagos_pedido` ON `pagos` (`pedido_id`);--> statement-breakpoint
CREATE INDEX `idx_pagos_estado` ON `pagos` (`estado`);--> statement-breakpoint
CREATE TABLE `pagos_zelle` (
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
--> statement-breakpoint
CREATE INDEX `idx_zelle_estado` ON `pagos_zelle` (`estado`);--> statement-breakpoint
CREATE INDEX `idx_zelle_tipo` ON `pagos_zelle` (`tipo`);--> statement-breakpoint
CREATE INDEX `idx_zelle_origen` ON `pagos_zelle` (`origen`);--> statement-breakpoint
CREATE INDEX `idx_zelle_subido` ON `pagos_zelle` (`subido_en`);--> statement-breakpoint
CREATE INDEX `idx_zelle_cuenta_receptora` ON `pagos_zelle` (`cuenta_receptora`);--> statement-breakpoint
CREATE INDEX `idx_zelle_banco` ON `pagos_zelle` (`banco_origen`);--> statement-breakpoint
CREATE INDEX `idx_zelle_codigo` ON `pagos_zelle` (`codigo_confirmacion`);--> statement-breakpoint
CREATE INDEX `idx_zelle_monto` ON `pagos_zelle` (`monto_centavos`);--> statement-breakpoint
CREATE INDEX `idx_zelle_seller` ON `pagos_zelle` (`seller_cuenta`);--> statement-breakpoint
CREATE TABLE `pedidos` (
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
--> statement-breakpoint
CREATE UNIQUE INDEX `pedidos_numero_unique` ON `pedidos` (`numero`);--> statement-breakpoint
CREATE INDEX `idx_pedidos_cliente` ON `pedidos` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `idx_pedidos_estado` ON `pedidos` (`estado`);--> statement-breakpoint
CREATE TABLE `productos` (
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
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_productos_tienda_slug` ON `productos` (`tienda_id`,`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_productos_externo` ON `productos` (`tienda_id`,`externo_id`);--> statement-breakpoint
CREATE INDEX `idx_productos_estado` ON `productos` (`estado`);--> statement-breakpoint
CREATE INDEX `idx_productos_categoria` ON `productos` (`categoria_id`);--> statement-breakpoint
CREATE INDEX `idx_productos_destacado` ON `productos` (`destacado`);--> statement-breakpoint
CREATE TABLE `session` (
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
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `idx_session_user` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `tiendas` (
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
--> statement-breakpoint
CREATE UNIQUE INDEX `tiendas_slug_unique` ON `tiendas` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_tiendas_propietario` ON `tiendas` (`propietario_id`);--> statement-breakpoint
CREATE INDEX `idx_tiendas_estado` ON `tiendas` (`estado`);--> statement-breakpoint
CREATE TABLE `user` (
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
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `idx_user_rol` ON `user` (`rol`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_verification_identifier` ON `verification` (`identifier`);