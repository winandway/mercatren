CREATE TABLE `cuentas_eliminadas` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`origen` text DEFAULT 'web' NOT NULL,
	`eliminada_en` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_cuentas_eliminadas_usuario` ON `cuentas_eliminadas` (`usuario_id`);