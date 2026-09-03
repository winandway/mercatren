CREATE TABLE `errores_sistema` (
	`clave` text PRIMARY KEY NOT NULL,
	`origen` text NOT NULL,
	`mensaje` text NOT NULL,
	`detalle` text,
	`veces` integer DEFAULT 1 NOT NULL,
	`primera_vez_en` integer NOT NULL,
	`ultima_vez_en` integer NOT NULL,
	`resuelto_en` integer
);
