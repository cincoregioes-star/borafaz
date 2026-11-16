CREATE TABLE `professionals` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `whatsapp` text NOT NULL,
  `service` text NOT NULL,
  `location` text NOT NULL,
  `areas` text NOT NULL,
  `description` text NOT NULL,
  `experience_since` integer,
  `photo_key` text,
  `consent_at` text NOT NULL,
  `status` text NOT NULL DEFAULT 'pending',
  `payment_status` text NOT NULL DEFAULT 'pending',
  `paid_until` text,
  `active` integer NOT NULL DEFAULT 1,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text,
  `reviewed_at` text,
  `reviewed_by` text
);
--> statement-breakpoint
CREATE INDEX `idx_borafaz_professionals_status` ON `professionals` (`status`, `payment_status`, `paid_until`);
--> statement-breakpoint
CREATE INDEX `idx_borafaz_professionals_phone` ON `professionals` (`whatsapp`, `service`, `created_at`);
