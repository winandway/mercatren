CREATE TABLE `socios_tienda` (
	`id` text PRIMARY KEY NOT NULL,
	`tienda_id` text NOT NULL,
	`plataforma` text NOT NULL,
	`externo_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`cursor` text,
	`ultimo_resultado` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade
);
