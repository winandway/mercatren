CREATE TABLE `embeddings_producto` (
	`producto_id` text PRIMARY KEY NOT NULL,
	`mercado` text NOT NULL,
	`vector` blob NOT NULL,
	`dimension` integer NOT NULL,
	`modelo` text NOT NULL,
	`error` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_embeddings_producto_mercado` ON `embeddings_producto` (`mercado`);