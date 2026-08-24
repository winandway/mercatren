-- Solo lo nuevo de este trabajo (24 ago 2026): corazones y comentarios de los Shorts.
CREATE TABLE `comentarios_video` (
	`id` text PRIMARY KEY NOT NULL,
	`video_id` text NOT NULL,
	`usuario_id` text NOT NULL,
	`texto` text NOT NULL,
	`estado` text DEFAULT 'publicado' NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`video_id`) REFERENCES `videos_tienda`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`usuario_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_comentarios_video` ON `comentarios_video` (`video_id`,`estado`);
--> statement-breakpoint
CREATE TABLE `me_gusta_video` (
	`video_id` text NOT NULL,
	`usuario_id` text NOT NULL,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`video_id`, `usuario_id`),
	FOREIGN KEY (`video_id`) REFERENCES `videos_tienda`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`usuario_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_me_gusta_video` ON `me_gusta_video` (`video_id`);
