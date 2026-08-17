ALTER TABLE `pedidos` ADD `mercado` text DEFAULT 'US' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_pedidos_mercado_estado` ON `pedidos` (`mercado`,`estado`);