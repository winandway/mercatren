CREATE TABLE `adjuntos_ayuda` (
	`id` text PRIMARY KEY NOT NULL,
	`mensaje_id` text NOT NULL,
	`caso_id` text NOT NULL,
	`clave` text NOT NULL,
	`nombre` text NOT NULL,
	`tipo` text NOT NULL,
	`bytes` integer NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`mensaje_id`) REFERENCES `mensajes_ayuda`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`caso_id`) REFERENCES `casos_ayuda`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_adjuntos_ayuda_mensaje` ON `adjuntos_ayuda` (`mensaje_id`);--> statement-breakpoint
CREATE INDEX `idx_adjuntos_ayuda_caso` ON `adjuntos_ayuda` (`caso_id`);