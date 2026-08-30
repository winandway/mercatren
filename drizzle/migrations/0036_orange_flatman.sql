CREATE TABLE `bitacora_pagos` (
	`id` text PRIMARY KEY NOT NULL,
	`pedido_id` text NOT NULL,
	`metodo` text NOT NULL,
	`paso` text NOT NULL,
	`detalle` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_bitacora_pagos_pedido` ON `bitacora_pagos` (`pedido_id`);