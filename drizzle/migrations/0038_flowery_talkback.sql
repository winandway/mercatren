CREATE TABLE `contactos_busqueda` (
	`busqueda_id` text PRIMARY KEY NOT NULL,
	`nombre` text,
	`correo` text NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL
);
