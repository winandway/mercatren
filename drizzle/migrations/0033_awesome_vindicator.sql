-- Solo lo nuevo (26 ago 2026): qué métodos acepta cada cobro por enlace.
CREATE TABLE `metodos_del_cobro` (
	`cobro_id` text NOT NULL,
	`metodo` text NOT NULL,
	PRIMARY KEY(`cobro_id`, `metodo`),
	FOREIGN KEY (`cobro_id`) REFERENCES `cobros_solicitados`(`id`) ON UPDATE no action ON DELETE cascade
);
