ALTER TABLE `donations` DROP FOREIGN KEY `donations_payment_account_id_payment_accounts_id_fk`;

ALTER TABLE `donations` ADD `payment_account` varchar(255);
ALTER TABLE `donations` ADD CONSTRAINT `donations_payment_account_id_payment_accounts_id_fk` FOREIGN KEY (`payment_account_id`) REFERENCES `payment_accounts`(`id`) ON DELETE set null ON UPDATE no action;