CREATE TABLE `cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` int NOT NULL,
	`title` varchar(120) NOT NULL,
	`description` text NOT NULL,
	`type` enum('prompt','link') NOT NULL,
	`content` text NOT NULL,
	`imageUrl` text,
	`imageKey` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(40) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `webhook` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);