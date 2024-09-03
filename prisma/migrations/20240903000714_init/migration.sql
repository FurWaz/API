/*
  Warnings:

  - You are about to drop the `userprofile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usersettings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `userprofile` DROP FOREIGN KEY `UserProfile_userId_fkey`;

-- DropForeignKey
ALTER TABLE `usersettings` DROP FOREIGN KEY `UserSettings_userId_fkey`;

-- DropTable
DROP TABLE `userprofile`;

-- DropTable
DROP TABLE `usersettings`;
