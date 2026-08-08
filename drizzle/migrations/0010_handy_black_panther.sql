CREATE TABLE `apariencia_tienda` (
	`tienda_id` text PRIMARY KEY NOT NULL,
	`color_banner` text,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade
);
