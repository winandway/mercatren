CREATE TABLE `creditos_cliente` (
	`id` text PRIMARY KEY NOT NULL,
	`tienda_id` text NOT NULL,
	`cliente_id` text NOT NULL,
	`tope_centavos` integer DEFAULT 0 NOT NULL,
	`dias_plazo` integer DEFAULT 30 NOT NULL,
	`estado` text DEFAULT 'activo' NOT NULL,
	`activado_por_id` text,
	`nota_interna` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cliente_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`activado_por_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_credito_tienda_cliente` ON `creditos_cliente` (`tienda_id`,`cliente_id`);--> statement-breakpoint
CREATE INDEX `idx_credito_tienda` ON `creditos_cliente` (`tienda_id`);--> statement-breakpoint
CREATE INDEX `idx_credito_cliente` ON `creditos_cliente` (`cliente_id`);--> statement-breakpoint
CREATE TABLE `pedidos_credito` (
	`pedido_id` text PRIMARY KEY NOT NULL,
	`credito_id` text NOT NULL,
	`tienda_id` text NOT NULL,
	`cliente_id` text NOT NULL,
	`total_centavos` integer NOT NULL,
	`estado` text DEFAULT 'abierto' NOT NULL,
	`vence_en` integer NOT NULL,
	`saldado_en` integer,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`credito_id`) REFERENCES `creditos_cliente`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cliente_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_pedcredito_tienda` ON `pedidos_credito` (`tienda_id`);--> statement-breakpoint
CREATE INDEX `idx_pedcredito_cliente` ON `pedidos_credito` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `idx_pedcredito_estado` ON `pedidos_credito` (`estado`);