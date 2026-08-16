CREATE TABLE `cobros_zelle` (
	`pago_zelle_id` text PRIMARY KEY NOT NULL,
	`cobro_id` text NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`pago_zelle_id`) REFERENCES `pagos_zelle`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cobro_id`) REFERENCES `cobros_solicitados`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_cobros_zelle_cobro` ON `cobros_zelle` (`cobro_id`);--> statement-breakpoint
CREATE TABLE `comprobantes_retiro` (
	`id` text PRIMARY KEY NOT NULL,
	`retiro_id` text NOT NULL,
	`clave` text NOT NULL,
	`subido_por_id` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`retiro_id`) REFERENCES `retiros`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subido_por_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_comprobantes_retiro` ON `comprobantes_retiro` (`retiro_id`);--> statement-breakpoint
CREATE TABLE `valoraciones` (
	`id` text PRIMARY KEY NOT NULL,
	`producto_id` text NOT NULL,
	`usuario_id` text NOT NULL,
	`estrellas` integer NOT NULL,
	`comentario` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`usuario_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_valoracion_unica` ON `valoraciones` (`producto_id`,`usuario_id`);--> statement-breakpoint
CREATE INDEX `idx_valoraciones_producto` ON `valoraciones` (`producto_id`);--> statement-breakpoint
CREATE TABLE `zelle_cobros_tienda` (
	`tienda_id` text PRIMARY KEY NOT NULL,
	`habilitado` integer DEFAULT false NOT NULL,
	`minimo_centavos` integer,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade
);
