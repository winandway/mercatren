CREATE TABLE `avisos_vigilante` (
	`clave` text PRIMARY KEY NOT NULL,
	`nivel` text NOT NULL,
	`titulo` text NOT NULL,
	`avisado_en` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `latidos_vigilante` (
	`id` text PRIMARY KEY NOT NULL,
	`corrido_en` integer NOT NULL,
	`duracion_ms` integer DEFAULT 0 NOT NULL,
	`origen` text DEFAULT 'reloj' NOT NULL,
	`alertas` text DEFAULT '[]' NOT NULL,
	`acciones` text DEFAULT '[]' NOT NULL,
	`hechos` text DEFAULT '{}' NOT NULL
);
