CREATE TABLE `bloqueos_usuario` (
	`usuario_id` text NOT NULL,
	`bloqueado_id` text NOT NULL,
	`creado_en` integer NOT NULL,
	PRIMARY KEY(`usuario_id`, `bloqueado_id`)
);
--> statement-breakpoint
CREATE TABLE `denuncias_contenido` (
	`id` text PRIMARY KEY NOT NULL,
	`tipo` text NOT NULL,
	`objeto_id` text NOT NULL,
	`autor_id` text,
	`denunciante_id` text NOT NULL,
	`motivo` text NOT NULL,
	`estado` text DEFAULT 'abierta' NOT NULL,
	`creado_en` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_denuncia_una_por_persona` ON `denuncias_contenido` (`tipo`,`objeto_id`,`denunciante_id`);--> statement-breakpoint
CREATE INDEX `idx_denuncias_objeto` ON `denuncias_contenido` (`tipo`,`objeto_id`,`estado`);