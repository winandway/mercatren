CREATE TABLE `preguntas_producto` (
	`id` text PRIMARY KEY NOT NULL,
	`producto_id` text NOT NULL,
	`tienda_id` text NOT NULL,
	`pregunta_es` text NOT NULL,
	`pregunta_en` text,
	`respuesta_es` text,
	`respuesta_en` text,
	`autor` text DEFAULT 'comercio' NOT NULL,
	`usuario_id` text,
	`orden` integer DEFAULT 0 NOT NULL,
	`estado` text DEFAULT 'publicada' NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	`respondido_en` integer,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`usuario_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `preguntas_producto_producto` ON `preguntas_producto` (`producto_id`);