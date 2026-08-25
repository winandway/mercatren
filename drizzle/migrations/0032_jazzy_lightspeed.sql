-- Solo lo nuevo (24 ago 2026): las secciones de video de Mercatren.
CREATE TABLE `secciones_video` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`nombre_es` text NOT NULL,
	`nombre_en` text,
	`descripcion_es` text,
	`descripcion_en` text,
	`llave_subida` text NOT NULL,
	`pin_hash` text,
	`pin_sal` text,
	`estado` text DEFAULT 'publicada' NOT NULL,
	`mercado` text DEFAULT 'US' NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `secciones_video_slug_unique` ON `secciones_video` (`slug`);
--> statement-breakpoint
CREATE UNIQUE INDEX `secciones_video_llave_subida_unique` ON `secciones_video` (`llave_subida`);
--> statement-breakpoint
CREATE INDEX `idx_secciones_video_mercado` ON `secciones_video` (`mercado`,`estado`);
--> statement-breakpoint
CREATE TABLE `videos_de_seccion` (
	`seccion_id` text NOT NULL,
	`video_id` text NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`seccion_id`, `video_id`),
	FOREIGN KEY (`seccion_id`) REFERENCES `secciones_video`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`video_id`) REFERENCES `videos_tienda`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_videos_de_seccion` ON `videos_de_seccion` (`video_id`);
