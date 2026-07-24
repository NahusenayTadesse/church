ALTER TABLE `galleries` DROP INDEX `galleries_slug_unique`;
ALTER TABLE `partners` DROP INDEX `partners_slug_unique`;
ALTER TABLE `tags` DROP INDEX `tags_slug_unique`;
ALTER TABLE `team_members` DROP INDEX `team_members_slug_unique`;
ALTER TABLE `galleries` DROP COLUMN `slug`;
ALTER TABLE `partners` DROP COLUMN `slug`;
ALTER TABLE `tags` DROP COLUMN `slug`;
ALTER TABLE `team_members` DROP COLUMN `slug`;