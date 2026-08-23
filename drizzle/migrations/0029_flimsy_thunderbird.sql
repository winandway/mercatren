-- Solo la tabla nueva de este trabajo (23 ago 2026): los videos de cada tienda (Shorts).
-- Las demás tablas que drizzle-kit quiso volver a crear ya existen en producción.
CREATE TABLE `videos_tienda` (
	`id` text PRIMARY KEY NOT NULL,
	`tienda_id` text NOT NULL,
	`slug` text NOT NULL,
	`titulo_es` text NOT NULL,
	`titulo_en` text,
	`descripcion_es` text,
	`descripcion_en` text,
	`clave` text NOT NULL,
	`portada_clave` text,
	`duracion_segundos` integer DEFAULT 0 NOT NULL,
	`ancho_px` integer,
	`alto_px` integer,
	`peso_bytes` integer DEFAULT 0 NOT NULL,
	`producto_id` text,
	`estado` text DEFAULT 'publicado' NOT NULL,
	`vistas` integer DEFAULT 0 NOT NULL,
	`mercado` text DEFAULT 'US' NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `videos_tienda_slug_unique` ON `videos_tienda` (`slug`);
--> statement-breakpoint
CREATE INDEX `idx_videos_tienda` ON `videos_tienda` (`tienda_id`);
--> statement-breakpoint
CREATE INDEX `idx_videos_estado_mercado` ON `videos_tienda` (`estado`,`mercado`);
--> statement-breakpoint
CREATE INDEX `idx_videos_creado` ON `videos_tienda` (`creado_en`);
