CREATE TABLE `medidas_producto` (
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
--> statement-breakpoint
CREATE TABLE `variantes_producto` (
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
--> statement-breakpoint
CREATE INDEX `idx_variantes_producto` ON `variantes_producto` (`producto_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_variante_combinacion` ON `variantes_producto` (`producto_id`,`talla`,`color`);