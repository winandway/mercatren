CREATE TABLE `busquedas_imagen` (
	`id` text PRIMARY KEY NOT NULL,
	`mercado` text NOT NULL,
	`imagen_clave` text NOT NULL,
	`mirada` text,
	`resultados` integer DEFAULT 0 NOT NULL,
	`correo` text,
	`idioma` text DEFAULT 'es' NOT NULL,
	`estado` text DEFAULT 'pendiente' NOT NULL,
	`enlace_avisado` text,
	`ip` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_busquedas_imagen_estado` ON `busquedas_imagen` (`estado`);--> statement-breakpoint
CREATE INDEX `idx_busquedas_imagen_creado` ON `busquedas_imagen` (`creado_en`);