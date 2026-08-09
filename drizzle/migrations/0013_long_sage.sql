CREATE TABLE `verificacion_tienda` (
	`tienda_id` text PRIMARY KEY NOT NULL,
	`estado` text DEFAULT 'en_observacion' NOT NULL,
	`notas` text,
	`revisado_por` text,
	`revisado_en` integer,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`revisado_por`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
