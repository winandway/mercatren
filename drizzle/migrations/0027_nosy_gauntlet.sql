CREATE TABLE `cobros_cadena` (
	`cobro_id` text PRIMARY KEY NOT NULL,
	`modo` text DEFAULT 'comercio' NOT NULL,
	`referencia_deuda` text,
	`deudor_nombre` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`cobro_id`) REFERENCES `cobros_solicitados`(`id`) ON UPDATE no action ON DELETE cascade
);
