CREATE TABLE `importaciones_cj` (
	`id` text PRIMARY KEY NOT NULL,
	`mercado` text NOT NULL,
	`almacen` text NOT NULL,
	`estado` text DEFAULT 'en_curso' NOT NULL,
	`propietario_id` text NOT NULL,
	`stock_minimo` integer DEFAULT 5 NOT NULL,
	`solo_verificado` integer DEFAULT true NOT NULL,
	`tope` integer DEFAULT 0 NOT NULL,
	`agregados` integer DEFAULT 0 NOT NULL,
	`actualizados` integer DEFAULT 0 NOT NULL,
	`saltados` integer DEFAULT 0 NOT NULL,
	`fallidos` integer DEFAULT 0 NOT NULL,
	`ultimo_error` text,
	`creado_en` integer NOT NULL,
	`actualizado_en` integer NOT NULL,
	`terminado_en` integer
);
--> statement-breakpoint
CREATE TABLE `tandas_importacion_cj` (
	`id` text PRIMARY KEY NOT NULL,
	`importacion_id` text NOT NULL,
	`categoria_id` text,
	`categoria_nombre` text,
	`desde_centavos` integer,
	`hasta_centavos` integer,
	`pagina` integer DEFAULT 0 NOT NULL,
	`total_paginas` integer,
	`total_registros` integer,
	`estado` text DEFAULT 'pendiente' NOT NULL,
	`agregados` integer DEFAULT 0 NOT NULL,
	`actualizados` integer DEFAULT 0 NOT NULL,
	`saltados` integer DEFAULT 0 NOT NULL,
	`tomada_en` integer,
	`ultimo_error` text,
	FOREIGN KEY (`importacion_id`) REFERENCES `importaciones_cj`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_tandas_importacion` ON `tandas_importacion_cj` (`importacion_id`,`estado`);