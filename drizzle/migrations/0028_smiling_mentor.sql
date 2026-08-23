-- Solo la tabla nueva de este trabajo (23 ago 2026): los banners publicitarios de las
-- parrillas. Las demás tablas que drizzle-kit quiso volver a crear aquí ya existen en
-- producción (llegaron por schema.sql, que corre en cada publicación).
CREATE TABLE `banners` (
	`id` text PRIMARY KEY NOT NULL,
	`titulo_es` text NOT NULL,
	`titulo_en` text,
	`texto_es` text,
	`texto_en` text,
	`boton_es` text,
	`boton_en` text,
	`imagen_clave` text,
	`enlace` text NOT NULL,
	`ubicacion` text DEFAULT 'todas' NOT NULL,
	`tienda_id` text,
	`cada_cuantos` integer DEFAULT 12 NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`desde` integer,
	`hasta` integer,
	`mercado` text DEFAULT 'US' NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_banners_activo_mercado` ON `banners` (`activo`,`mercado`);
--> statement-breakpoint
CREATE INDEX `idx_banners_tienda` ON `banners` (`tienda_id`);
