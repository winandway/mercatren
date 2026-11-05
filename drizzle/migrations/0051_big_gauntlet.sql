CREATE TABLE `solicitudes_cierre` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`tienda_id` text NOT NULL,
	`origen` text DEFAULT 'web' NOT NULL,
	`estado` text DEFAULT 'pendiente' NOT NULL,
	`pedida_en` integer NOT NULL,
	`completada_en` integer
);
--> statement-breakpoint
CREATE INDEX `idx_solicitudes_cierre_usuario` ON `solicitudes_cierre` (`usuario_id`,`estado`);