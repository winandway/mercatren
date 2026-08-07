CREATE TABLE `facturas` (
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
--> statement-breakpoint
CREATE UNIQUE INDEX `facturas_numero_unique` ON `facturas` (`numero`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_facturas_pedido` ON `facturas` (`pedido_id`);--> statement-breakpoint
CREATE INDEX `idx_facturas_cliente` ON `facturas` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `idx_facturas_emitida` ON `facturas` (`emitida_en`);--> statement-breakpoint
CREATE TABLE `lineas_factura` (
	`id` text PRIMARY KEY NOT NULL,
	`factura_id` text NOT NULL,
	`descripcion` text NOT NULL,
	`cantidad` real DEFAULT 1 NOT NULL,
	`precio_unitario_centavos` integer NOT NULL,
	`subtotal_centavos` integer NOT NULL,
	FOREIGN KEY (`factura_id`) REFERENCES `facturas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_lineas_factura` ON `lineas_factura` (`factura_id`);--> statement-breakpoint
CREATE TABLE `ordenes_compra` (
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
--> statement-breakpoint
CREATE UNIQUE INDEX `ordenes_compra_numero_unique` ON `ordenes_compra` (`numero`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_oc_pedido_tienda` ON `ordenes_compra` (`pedido_id`,`tienda_id`);--> statement-breakpoint
CREATE INDEX `idx_oc_tienda` ON `ordenes_compra` (`tienda_id`);--> statement-breakpoint
CREATE INDEX `idx_oc_estado` ON `ordenes_compra` (`estado`);--> statement-breakpoint
CREATE TABLE `series_documento` (
	`id` text PRIMARY KEY NOT NULL,
	`prefijo` text NOT NULL,
	`ultimo` integer DEFAULT 0 NOT NULL
);
