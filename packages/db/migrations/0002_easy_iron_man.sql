CREATE TABLE `column` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspace`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "column_position_nonnegative" CHECK("column"."position" >= 0)
);
--> statement-breakpoint
CREATE INDEX `column_projectId_position_idx` ON `column` (`project_id`,`position`);--> statement-breakpoint
CREATE INDEX `column_workspaceId_idx` ON `column` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `task` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`project_id` text NOT NULL,
	`column_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspace`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`column_id`) REFERENCES `column`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "task_position_nonnegative" CHECK("task"."position" >= 0)
);
--> statement-breakpoint
CREATE INDEX `task_columnId_position_idx` ON `task` (`column_id`,`position`);--> statement-breakpoint
CREATE INDEX `task_workspaceId_idx` ON `task` (`workspace_id`);