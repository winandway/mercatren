CREATE TABLE `retiros` (
	`id` text PRIMARY KEY NOT NULL,
	`tienda_id` text NOT NULL,
	`solicitado_por_id` text,
	`monto_centavos` integer NOT NULL,
	`moneda` text DEFAULT 'USD' NOT NULL,
	`estado` text DEFAULT 'solicitado' NOT NULL,
	`forma` text NOT NULL,
	`destino` text,
	`destino_tienda_id` text,
	`nota_comercio` text,
	`motivo_rechazo` text,
	`referencia` text,
	`resuelto_por_id` text,
	`resuelto_en` integer,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`solicitado_por_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`destino_tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resuelto_por_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_retiros_tienda` ON `retiros` (`tienda_id`);--> statement-breakpoint
CREATE INDEX `idx_retiros_estado` ON `retiros` (`estado`);--> statement-breakpoint
CREATE INDEX `idx_retiros_fecha` ON `retiros` (`creado_en`);