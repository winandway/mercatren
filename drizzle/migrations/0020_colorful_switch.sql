CREATE TABLE `rechazos_correo` (
	`id` text PRIMARY KEY NOT NULL,
	`correo` text NOT NULL,
	`dominio` text NOT NULL,
	`motivo` text NOT NULL,
	`ip` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL
);
