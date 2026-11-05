CREATE TABLE `clics_promocion` (
	`promocion_id` text NOT NULL,
	`dia` text NOT NULL,
	`huella` text NOT NULL,
	PRIMARY KEY(`promocion_id`, `dia`, `huella`)
);
--> statement-breakpoint
CREATE TABLE `gasto_promociones` (
	`promocion_id` text NOT NULL,
	`tienda_id` text NOT NULL,
	`dia` text NOT NULL,
	`clics` integer DEFAULT 0 NOT NULL,
	`clics_gratis` integer DEFAULT 0 NOT NULL,
	`gasto_centavos` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`promocion_id`, `dia`)
);
--> statement-breakpoint
CREATE INDEX `idx_gasto_promociones_tienda_dia` ON `gasto_promociones` (`tienda_id`,`dia`);--> statement-breakpoint
CREATE TABLE `planes_tienda` (
	`id` text PRIMARY KEY NOT NULL,
	`tienda_id` text NOT NULL,
	`plan` text DEFAULT 'pro' NOT NULL,
	`estado` text DEFAULT 'prueba' NOT NULL,
	`prueba_hasta` integer,
	`pagado_hasta` integer,
	`stripe_suscripcion_id` text,
	`empezado_en` integer NOT NULL,
	`cancelado_en` integer,
	`actualizado_en` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_planes_tienda_tienda` ON `planes_tienda` (`tienda_id`);--> statement-breakpoint
CREATE TABLE `promociones` (
	`id` text PRIMARY KEY NOT NULL,
	`tienda_id` text NOT NULL,
	`producto_id` text NOT NULL,
	`presupuesto_diario_centavos` integer NOT NULL,
	`cpc_centavos` integer DEFAULT 15 NOT NULL,
	`estado` text DEFAULT 'activa' NOT NULL,
	`creada_en` integer NOT NULL,
	`actualizada_en` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_promociones_producto` ON `promociones` (`producto_id`);--> statement-breakpoint
CREATE INDEX `idx_promociones_tienda` ON `promociones` (`tienda_id`);--> statement-breakpoint
CREATE INDEX `idx_promociones_estado` ON `promociones` (`estado`);