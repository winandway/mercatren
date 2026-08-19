CREATE TABLE `devoluciones` (
	`id` text PRIMARY KEY NOT NULL,
	`pedido_id` text NOT NULL,
	`usuario_id` text,
	`estado` text DEFAULT 'solicitada' NOT NULL,
	`motivo` text NOT NULL,
	`comentario` text,
	`direccion_entregada` text,
	`guia_retorno` text,
	`reembolsado_centavos` integer,
	`motivo_rechazo` text,
	`resuelto_en` integer,
	`resuelto_por_id` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`usuario_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resuelto_por_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_devoluciones_pedido` ON `devoluciones` (`pedido_id`);--> statement-breakpoint
CREATE INDEX `idx_devoluciones_estado` ON `devoluciones` (`estado`);--> statement-breakpoint
CREATE TABLE `fotos_devolucion` (
	`id` text PRIMARY KEY NOT NULL,
	`devolucion_id` text NOT NULL,
	`clave` text NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`devolucion_id`) REFERENCES `devoluciones`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_fotos_devolucion` ON `fotos_devolucion` (`devolucion_id`);