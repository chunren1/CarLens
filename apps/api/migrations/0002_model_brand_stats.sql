ALTER TABLE `models` ADD COLUMN `brand` text DEFAULT '比亚迪' NOT NULL;
--> statement-breakpoint
ALTER TABLE `models` ADD COLUMN `range_km` integer DEFAULT 500 NOT NULL;
--> statement-breakpoint
ALTER TABLE `models` ADD COLUMN `zero_100` real DEFAULT 6 NOT NULL;
--> statement-breakpoint
ALTER TABLE `models` ADD COLUMN `wheel_inch` integer DEFAULT 19 NOT NULL;
