CREATE TABLE `cobros_solicitados` (
	`id` text PRIMARY KEY NOT NULL,
	`tienda_id` text NOT NULL,
	`enlace` text NOT NULL,
	`referencia` text NOT NULL,
	`monto_centavos` integer NOT NULL,
	`moneda` text DEFAULT 'USD' NOT NULL,
	`estado` text DEFAULT 'abierto' NOT NULL,
	`cliente_id` text,
	`contacto_correo` text NOT NULL,
	`contacto_nombre` text,
	`concepto` text,
	`vence_en` integer,
	`pago_id` text,
	`pagado_en` integer,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cliente_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cobros_solicitados_enlace_unique` ON `cobros_solicitados` (`enlace`);--> statement-breakpoint
CREATE INDEX `idx_cobros_tienda` ON `cobros_solicitados` (`tienda_id`);--> statement-breakpoint
CREATE INDEX `idx_cobros_estado` ON `cobros_solicitados` (`estado`);--> statement-breakpoint
CREATE INDEX `idx_cobros_referencia` ON `cobros_solicitados` (`referencia`);