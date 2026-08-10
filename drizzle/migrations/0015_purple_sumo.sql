CREATE TABLE `huellas_comprobante` (
	`pago_id` text PRIMARY KEY NOT NULL,
	`huella` text NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`pago_id`) REFERENCES `pagos_zelle`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_huellas_comprobante` ON `huellas_comprobante` (`huella`);