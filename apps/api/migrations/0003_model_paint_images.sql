CREATE TABLE `model_paint_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`model_id` integer NOT NULL,
	`paint_id` integer NOT NULL,
	`image_path` text NOT NULL,
	`source` text DEFAULT 'ai' NOT NULL,
	`prompt` text,
	`reviewed` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`paint_id`) REFERENCES `paints`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `model_paint_unique` ON `model_paint_images` (`model_id`,`paint_id`);
