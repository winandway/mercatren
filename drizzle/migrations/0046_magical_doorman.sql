CREATE TABLE `fotos_de_producto` (
	`producto_id` text PRIMARY KEY NOT NULL,
	`fotos` text NOT NULL,
	`actualizado_en` integer NOT NULL,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_fotos_de_producto_actualizado` ON `fotos_de_producto` (`actualizado_en`);--> statement-breakpoint
CREATE TABLE `tarifas_maritimas_casillero` (
	`pais` text PRIMARY KEY NOT NULL,
	`tarifa_pie_centavos` integer DEFAULT 0 NOT NULL,
	`minimo_pies` real DEFAULT 1 NOT NULL,
	`minimo_cobro_centavos` integer DEFAULT 0 NOT NULL,
	`seguro_puntos_base` integer DEFAULT 0 NOT NULL,
	`seguro_desde_centavos` integer DEFAULT 0 NOT NULL,
	`impuesto_incluido` integer DEFAULT false NOT NULL,
	`activa` integer DEFAULT false NOT NULL,
	`nota` text,
	`actualizado_en` integer NOT NULL,
	`actualizado_por` text
);
--> statement-breakpoint
CREATE TABLE `texto_de_busqueda` (
	`producto_id` text PRIMARY KEY NOT NULL,
	`titulo` text NOT NULL,
	`marca_sku` text NOT NULL,
	`texto` text NOT NULL,
	`calculado_en` integer NOT NULL,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_pedidos_estado_creado` ON `pedidos` (`estado`,`creado_en`);--> statement-breakpoint
CREATE INDEX `idx_productos_slug` ON `productos` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_productos_estado_categoria` ON `productos` (`estado`,`categoria_id`);--> statement-breakpoint
CREATE INDEX `idx_productos_estado_tienda` ON `productos` (`estado`,`tienda_id`);--> statement-breakpoint
CREATE INDEX `idx_productos_deposito_estado` ON `productos` (`deposito_id`,`estado`);--> statement-breakpoint
CREATE INDEX `idx_productos_categoria_creado` ON `productos` (`categoria_id`,`creado_en`);--> statement-breakpoint
CREATE INDEX `idx_productos_tienda_creado` ON `productos` (`tienda_id`,`creado_en`);--> statement-breakpoint
CREATE INDEX `idx_productos_tienda_estado_actualizado` ON `productos` (`tienda_id`,`estado`,`actualizado_en`);--> statement-breakpoint
CREATE INDEX `idx_tiendas_mercado_estado` ON `tiendas` (`mercado`,`estado`);