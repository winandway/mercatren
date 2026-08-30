CREATE TABLE `visitas` (
	`id` text PRIMARY KEY NOT NULL,
	`visitante` text NOT NULL,
	`mercado` text NOT NULL,
	`pais` text,
	`ruta` text NOT NULL,
	`referido` text,
	`segundos` integer DEFAULT 0 NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_visitas_creado` ON `visitas` (`creado_en`);--> statement-breakpoint
CREATE INDEX `idx_visitas_mercado` ON `visitas` (`mercado`);--> statement-breakpoint
CREATE INDEX `idx_visitas_visitante` ON `visitas` (`visitante`);