CREATE TABLE `retiros_fee` (
	`id` text PRIMARY KEY NOT NULL,
	`monto_centavos` integer NOT NULL,
	`moneda` text DEFAULT 'USD' NOT NULL,
	`hecho_en` integer NOT NULL,
	`nota` text,
	`origen` text DEFAULT 'live' NOT NULL,
	`hecho_por_id` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`hecho_por_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_retiros_fee_fecha` ON `retiros_fee` (`hecho_en`);