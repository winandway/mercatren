CREATE TABLE `casos_ayuda` (
	`id` text PRIMARY KEY NOT NULL,
	`codigo` text NOT NULL,
	`usuario_id` text,
	`nombre` text NOT NULL,
	`email` text NOT NULL,
	`idioma` text DEFAULT 'es' NOT NULL,
	`asunto` text NOT NULL,
	`estado` text DEFAULT 'abierto' NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `casos_ayuda_codigo_unique` ON `casos_ayuda` (`codigo`);--> statement-breakpoint
CREATE INDEX `idx_casos_ayuda_estado` ON `casos_ayuda` (`estado`,`actualizado_en`);--> statement-breakpoint
CREATE INDEX `idx_casos_ayuda_usuario` ON `casos_ayuda` (`usuario_id`);--> statement-breakpoint
CREATE INDEX `idx_casos_ayuda_email` ON `casos_ayuda` (`email`,`creado_en`);--> statement-breakpoint
CREATE TABLE `mensajes_ayuda` (
	`id` text PRIMARY KEY NOT NULL,
	`caso_id` text NOT NULL,
	`autor` text NOT NULL,
	`texto` text NOT NULL,
	`plantilla` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`caso_id`) REFERENCES `casos_ayuda`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_mensajes_ayuda_caso` ON `mensajes_ayuda` (`caso_id`,`creado_en`);