CREATE TABLE `correcciones_pago` (
	`id` text PRIMARY KEY NOT NULL,
	`pago_zelle_id` text NOT NULL,
	`monto_declarado_centavos` integer NOT NULL,
	`monto_real_centavos` integer NOT NULL,
	`motivo` text NOT NULL,
	`corregido_por` text,
	`corregido_por_nombre` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`pago_zelle_id`) REFERENCES `pagos_zelle`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_correcciones_pago` ON `correcciones_pago` (`pago_zelle_id`);