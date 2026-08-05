CREATE TABLE `depositos` (
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
--> statement-breakpoint
CREATE INDEX `idx_depositos_tienda` ON `depositos` (`tienda_id`);--> statement-breakpoint
CREATE INDEX `idx_depositos_zona` ON `depositos` (`zona`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_depositos_tienda_nombre` ON `depositos` (`tienda_id`,`nombre`);
