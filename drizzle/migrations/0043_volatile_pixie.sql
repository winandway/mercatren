CREATE TABLE `fotos_rotas` (
	`imagen_id` text PRIMARY KEY NOT NULL,
	`producto_id` text NOT NULL,
	`url` text NOT NULL,
	`motivo` text NOT NULL,
	`intentos` integer DEFAULT 1 NOT NULL,
	`definitiva` integer DEFAULT false NOT NULL,
	`ultimo_intento_en` integer NOT NULL
);
