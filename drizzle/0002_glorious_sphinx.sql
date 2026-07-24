ALTER TABLE `ministry_areas` DROP INDEX `ministry_areas_slug_unique`;
ALTER TABLE `ministry_areas` DROP COLUMN `slug`;
ALTER TABLE `ministry_areas` DROP COLUMN `icon`;
ALTER TABLE `ministry_areas` DROP COLUMN `sort_order`;