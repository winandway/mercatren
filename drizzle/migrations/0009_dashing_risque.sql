CREATE TABLE `envios_tienda` (
	`tienda_id` text PRIMARY KEY NOT NULL,
	`modo` text DEFAULT 'sin_definir' NOT NULL,
	`porcentaje_puntos_base` integer DEFAULT 0 NOT NULL,
	`cobertura_es` text,
	`cobertura_en` text,
	`plazo_es` text,
	`plazo_en` text,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade
);
