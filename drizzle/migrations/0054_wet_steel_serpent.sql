CREATE TABLE `seguridad_producto` (
	`producto_id` text PRIMARY KEY NOT NULL,
	`fabricante_nombre` text NOT NULL,
	`fabricante_direccion` text NOT NULL,
	`fabricante_correo` text NOT NULL,
	`responsable_ue` text,
	`advertencias_es` text,
	`advertencias_en` text,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE cascade
);
