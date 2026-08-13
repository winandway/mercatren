CREATE TABLE `intentos_acceso` (
	`llave` text PRIMARY KEY NOT NULL,
	`intentos` integer DEFAULT 0 NOT NULL,
	`ventana_desde` integer NOT NULL
);
