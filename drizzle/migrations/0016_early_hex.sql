CREATE TABLE `disputas` (
	`id` text PRIMARY KEY NOT NULL,
	`intento_id` text,
	`pedido_id` text,
	`estado` text DEFAULT 'abierta' NOT NULL,
	`monto_centavos` integer DEFAULT 0 NOT NULL,
	`moneda` text DEFAULT 'USD' NOT NULL,
	`motivo` text,
	`responde_hasta` integer,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_disputas_pedido` ON `disputas` (`pedido_id`);--> statement-breakpoint
CREATE INDEX `idx_disputas_estado` ON `disputas` (`estado`);--> statement-breakpoint
CREATE TABLE `hitos_pedido` (
	`id` text PRIMARY KEY NOT NULL,
	`pedido_id` text NOT NULL,
	`hito` text NOT NULL,
	`hecho_por_id` text,
	`hecho_por_nombre` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`hecho_por_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_hitos_pedido` ON `hitos_pedido` (`pedido_id`);