CREATE TABLE `column` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspace`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "column_position_check" CHECK("column"."position" >= 0)
);
--> statement-breakpoint
CREATE INDEX `column_project_position_idx` ON `column` (`project_id`,`position`);--> statement-breakpoint
CREATE INDEX `column_workspace_id_idx` ON `column` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `task` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`project_id` text NOT NULL,
	`column_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspace`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`column_id`) REFERENCES `column`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "task_position_check" CHECK("task"."position" >= 0)
);
--> statement-breakpoint
CREATE INDEX `task_column_position_idx` ON `task` (`column_id`,`position`);--> statement-breakpoint
CREATE INDEX `task_workspace_id_idx` ON `task` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `task_project_id_idx` ON `task` (`project_id`);