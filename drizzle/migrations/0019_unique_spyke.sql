CREATE TABLE `pruebas_entrega` (
	`id` text PRIMARY KEY NOT NULL,
	`pedido_id` text NOT NULL,
	`tipo` text NOT NULL,
	`referencia` text,
	`clave` text,
	`nota` text,
	`subido_por_id` text,
	`subido_por_nombre` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subido_por_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_pruebas_entrega` ON `pruebas_entrega` (`pedido_id`);