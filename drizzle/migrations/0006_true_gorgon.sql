CREATE TABLE `aceptaciones` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`documento` text NOT NULL,
	`version` text NOT NULL,
	`contexto` text NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_aceptaciones_usuario` ON `aceptaciones` (`user_id`);