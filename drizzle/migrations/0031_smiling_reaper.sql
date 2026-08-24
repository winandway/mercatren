-- Solo lo nuevo (24 ago 2026): el aviso al sistema del comercio cuando entra un pago.
CREATE TABLE `webhooks_tienda` (
	`tienda_id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`secreto` text NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`ultimo_intento_en` integer,
	`ultimo_ok_en` integer,
	`ultimo_error` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade
);
