CREATE TABLE `renglones_proveedor` (
	`id` text PRIMARY KEY NOT NULL,
	`pedido_proveedor_id` text NOT NULL,
	`producto_id` text,
	`titulo` text,
	`vid` text,
	`variante_sku` text,
	`variante_nombre` text,
	`cantidad` integer DEFAULT 1 NOT NULL,
	`variante_automatica` integer DEFAULT false NOT NULL,
	`variantes_totales` integer,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`pedido_proveedor_id`) REFERENCES `pedidos_proveedor`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_renglones_proveedor` ON `renglones_proveedor` (`pedido_proveedor_id`);