CREATE TABLE `socios_alias` (
	`id` text PRIMARY KEY NOT NULL,
	`tienda_id` text NOT NULL,
	`externo_id` text NOT NULL,
	`producto_id` text NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `socios_alias_tienda_externo` ON `socios_alias` (`tienda_id`,`externo_id`);--> statement-breakpoint
CREATE INDEX `socios_alias_producto` ON `socios_alias` (`producto_id`);