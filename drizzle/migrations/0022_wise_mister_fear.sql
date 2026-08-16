CREATE TABLE `pedidos_proveedor` (
	`id` text PRIMARY KEY NOT NULL,
	`pedido_id` text NOT NULL,
	`proveedor` text DEFAULT 'cj' NOT NULL,
	`estado` text DEFAULT 'por_pagar' NOT NULL,
	`externo_id` text,
	`externo_numero` text,
	`url_pago` text,
	`costo_centavos` integer,
	`guia` text,
	`transportista` text,
	`ultimo_error` text,
	`pagado_en` integer,
	`pagado_por_id` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pagado_por_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_pedidos_proveedor_pedido` ON `pedidos_proveedor` (`pedido_id`);--> statement-breakpoint
CREATE INDEX `idx_pedidos_proveedor_estado` ON `pedidos_proveedor` (`estado`);