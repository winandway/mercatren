CREATE TABLE `items_variante` (
	`item_pedido_id` text PRIMARY KEY NOT NULL,
	`variante_id` text NOT NULL,
	FOREIGN KEY (`item_pedido_id`) REFERENCES `items_pedido`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variante_id`) REFERENCES `variantes_producto`(`id`) ON UPDATE no action ON DELETE no action
);
