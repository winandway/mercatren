CREATE TABLE `accesos_datos` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`casillero_id` text NOT NULL,
	`campo` text NOT NULL,
	`creado_en` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `altas_casillero` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text,
	`origen_id` text,
	`url_referente` text,
	`ip_hash` text,
	`user_agent` text,
	`estado` text NOT NULL,
	`motivo` text,
	`creado_en` integer NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`origen_id`) REFERENCES `origenes_casillero`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_altas_casillero_origen` ON `altas_casillero` (`origen_id`,`creado_en`);--> statement-breakpoint
CREATE TABLE `asignaciones_paquete` (
	`id` text PRIMARY KEY NOT NULL,
	`paquete_id` text NOT NULL,
	`casillero_id` text NOT NULL,
	`metodo` text NOT NULL,
	`score` integer NOT NULL,
	`automatico` integer NOT NULL,
	`motivo` text,
	`usuario_id` text,
	`creado_en` integer NOT NULL,
	FOREIGN KEY (`paquete_id`) REFERENCES `paquetes_casillero`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`casillero_id`) REFERENCES `casilleros`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `avisos_entrante` (
	`id` text PRIMARY KEY NOT NULL,
	`bodega_id` text NOT NULL,
	`carrier` text NOT NULL,
	`tracking` text NOT NULL,
	`casillero_id` text,
	`remitente` text,
	`peso_lb` real,
	`eta` integer,
	`estado` text,
	`recibido_en` integer NOT NULL,
	FOREIGN KEY (`bodega_id`) REFERENCES `bodegas_casillero`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`casillero_id`) REFERENCES `casilleros`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_avisos_entrante_tracking` ON `avisos_entrante` (`tracking`);--> statement-breakpoint
CREATE TABLE `bodegas_casillero` (
	`id` text PRIMARY KEY NOT NULL,
	`codigo` text NOT NULL,
	`nombre` text NOT NULL,
	`linea1` text NOT NULL,
	`linea2` text,
	`ciudad` text NOT NULL,
	`estado_us` text NOT NULL,
	`zip` text NOT NULL,
	`telefono` text NOT NULL,
	`activa` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bodegas_casillero_codigo_unique` ON `bodegas_casillero` (`codigo`);--> statement-breakpoint
CREATE TABLE `casilleros` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`bodega_id` text NOT NULL,
	`codigo` text NOT NULL,
	`secuencia` integer NOT NULL,
	`nombre_legal` text NOT NULL,
	`telefono` text NOT NULL,
	`pais_destino` text NOT NULL,
	`estado` text DEFAULT 'activo' NOT NULL,
	`verificado` integer DEFAULT false NOT NULL,
	`alias_email` text,
	`origen_id` text,
	`creado_en` integer NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bodega_id`) REFERENCES `bodegas_casillero`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`origen_id`) REFERENCES `origenes_casillero`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `casilleros_codigo_unique` ON `casilleros` (`codigo`);--> statement-breakpoint
CREATE UNIQUE INDEX `casilleros_secuencia_unique` ON `casilleros` (`secuencia`);--> statement-breakpoint
CREATE UNIQUE INDEX `casilleros_alias_email_unique` ON `casilleros` (`alias_email`);--> statement-breakpoint
CREATE INDEX `idx_casilleros_usuario` ON `casilleros` (`usuario_id`);--> statement-breakpoint
CREATE INDEX `idx_casilleros_origen` ON `casilleros` (`origen_id`,`creado_en`);--> statement-breakpoint
CREATE TABLE `contadores_casillero` (
	`clave` text PRIMARY KEY NOT NULL,
	`valor` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `direcciones_destino` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`etiqueta` text,
	`destinatario` text NOT NULL,
	`documento` text,
	`telefono` text NOT NULL,
	`pais` text NOT NULL,
	`region` text,
	`ciudad` text NOT NULL,
	`linea1` text NOT NULL,
	`linea2` text,
	`referencias` text,
	`es_default` integer DEFAULT false NOT NULL,
	`creado_en` integer NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_direcciones_destino_usuario` ON `direcciones_destino` (`usuario_id`);--> statement-breakpoint
CREATE TABLE `eventos_paquete` (
	`id` text PRIMARY KEY NOT NULL,
	`paquete_id` text NOT NULL,
	`tipo` text NOT NULL,
	`detalle` text DEFAULT '{}' NOT NULL,
	`visible_cliente` integer DEFAULT true NOT NULL,
	`usuario_id` text,
	`creado_en` integer NOT NULL,
	FOREIGN KEY (`paquete_id`) REFERENCES `paquetes_casillero`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_eventos_paquete` ON `eventos_paquete` (`paquete_id`,`creado_en`);--> statement-breakpoint
CREATE TABLE `intentos_casillero` (
	`clave` text PRIMARY KEY NOT NULL,
	`conteo` integer NOT NULL,
	`ventana_desde` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `origenes_casillero` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`dominio` text NOT NULL,
	`clave_publica` text NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`creado_en` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `origenes_casillero_clave_publica_unique` ON `origenes_casillero` (`clave_publica`);--> statement-breakpoint
CREATE TABLE `paquetes_casillero` (
	`id` text PRIMARY KEY NOT NULL,
	`wr` text NOT NULL,
	`bodega_id` text NOT NULL,
	`casillero_id` text,
	`prealerta_id` text,
	`tracking` text,
	`carrier` text,
	`remitente` text,
	`peso_lb` real,
	`largo_in` real,
	`ancho_in` real,
	`alto_in` real,
	`peso_facturable_lb` real,
	`ubicacion` text,
	`estado` text DEFAULT 'recibido' NOT NULL,
	`condicion` text,
	`valor_declarado_centavos` integer,
	`descripcion_declarada` text,
	`texto_ocr` text,
	`fotos` text DEFAULT '[]' NOT NULL,
	`recibido_en` integer NOT NULL,
	`recibido_por` text,
	FOREIGN KEY (`bodega_id`) REFERENCES `bodegas_casillero`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`casillero_id`) REFERENCES `casilleros`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`prealerta_id`) REFERENCES `prealertas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `paquetes_casillero_wr_unique` ON `paquetes_casillero` (`wr`);--> statement-breakpoint
CREATE INDEX `idx_paquetes_casillero` ON `paquetes_casillero` (`casillero_id`,`estado`);--> statement-breakpoint
CREATE INDEX `idx_paquetes_cas_tracking` ON `paquetes_casillero` (`tracking`);--> statement-breakpoint
CREATE INDEX `idx_paquetes_cas_estado` ON `paquetes_casillero` (`estado`);--> statement-breakpoint
CREATE TABLE `prealertas` (
	`id` text PRIMARY KEY NOT NULL,
	`casillero_id` text NOT NULL,
	`tracking` text,
	`carrier` text,
	`comercio` text,
	`descripcion` text NOT NULL,
	`cantidad` integer DEFAULT 1 NOT NULL,
	`valor_centavos` integer NOT NULL,
	`factura_clave` text,
	`origen` text DEFAULT 'manual' NOT NULL,
	`estado` text DEFAULT 'abierta' NOT NULL,
	`creado_en` integer NOT NULL,
	FOREIGN KEY (`casillero_id`) REFERENCES `casilleros`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_prealertas_tracking` ON `prealertas` (`tracking`);--> statement-breakpoint
CREATE INDEX `idx_prealertas_casillero` ON `prealertas` (`casillero_id`,`estado`);--> statement-breakpoint
CREATE TABLE `tarifas_casillero` (
	`pais` text PRIMARY KEY NOT NULL,
	`tarifa_libra_centavos` integer DEFAULT 0 NOT NULL,
	`minimo_lb` real DEFAULT 1 NOT NULL,
	`minimo_cobro_centavos` integer DEFAULT 0 NOT NULL,
	`despacho_centavos` integer DEFAULT 0 NOT NULL,
	`seguro_puntos_base` integer DEFAULT 0 NOT NULL,
	`seguro_desde_centavos` integer DEFAULT 0 NOT NULL,
	`divisor_volumetrico` integer DEFAULT 166 NOT NULL,
	`dias_almacenaje_gratis` integer DEFAULT 30 NOT NULL,
	`almacenaje_dia_centavos` integer DEFAULT 0 NOT NULL,
	`impuesto_incluido` integer DEFAULT false NOT NULL,
	`activa` integer DEFAULT false NOT NULL,
	`nota` text,
	`actualizado_en` integer NOT NULL,
	`actualizado_por` text
);
--> statement-breakpoint
CREATE TABLE `tarifas_del_cobro` (
	`cobro_id` text PRIMARY KEY NOT NULL,
	`puntos_base` integer NOT NULL,
	FOREIGN KEY (`cobro_id`) REFERENCES `cobros_solicitados`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tiendas` (
	`id` text PRIMARY KEY NOT NULL,
	`propietario_id` text,
	`slug` text NOT NULL,
	`nombre` text NOT NULL,
	`descripcion_es` text,
	`descripcion_en` text,
	`logo_clave` text,
	`portada_clave` text,
	`estado` text DEFAULT 'borrador' NOT NULL,
	`comision_puntos_base` integer DEFAULT 600 NOT NULL,
	`stripe_cuenta_id` text,
	`pais_origen` text DEFAULT 'US' NOT NULL,
	`mercado` text DEFAULT 'US' NOT NULL,
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
INSERT INTO `__new_tiendas`("id", "propietario_id", "slug", "nombre", "descripcion_es", "descripcion_en", "logo_clave", "portada_clave", "estado", "comision_puntos_base", "stripe_cuenta_id", "pais_origen", "mercado", "razon_social", "identificacion_fiscal", "correo_contacto", "telefono", "direccion", "ciudad", "sitio_web", "horario", "creado_en", "actualizado_en") SELECT "id", "propietario_id", "slug", "nombre", "descripcion_es", "descripcion_en", "logo_clave", "portada_clave", "estado", "comision_puntos_base", "stripe_cuenta_id", "pais_origen", "mercado", "razon_social", "identificacion_fiscal", "correo_contacto", "telefono", "direccion", "ciudad", "sitio_web", "horario", "creado_en", "actualizado_en" FROM `tiendas`;--> statement-breakpoint
DROP TABLE `tiendas`;--> statement-breakpoint
ALTER TABLE `__new_tiendas` RENAME TO `tiendas`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `tiendas_slug_unique` ON `tiendas` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_tiendas_propietario` ON `tiendas` (`propietario_id`);--> statement-breakpoint
CREATE INDEX `idx_tiendas_estado` ON `tiendas` (`estado`);--> statement-breakpoint
CREATE INDEX `idx_tiendas_mercado` ON `tiendas` (`mercado`);