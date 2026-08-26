-- Solo lo nuevo (26 ago 2026): las partes de una factura cobrada en abonos.
CREATE TABLE `partes_del_cobro` (
	`cobro_id` text PRIMARY KEY NOT NULL,
	`grupo` text NOT NULL,
	`numero` integer NOT NULL,
	`total` integer NOT NULL,
	`total_factura_centavos` integer NOT NULL,
	FOREIGN KEY (`cobro_id`) REFERENCES `cobros_solicitados`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_partes_del_cobro_grupo` ON `partes_del_cobro` (`grupo`);
