-- CreateTable
CREATE TABLE `Client` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fullName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `points` INTEGER NOT NULL DEFAULT 0,
    `establishmentId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Establishment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `primaryColor` VARCHAR(191) NOT NULL DEFAULT '#3498db',
    `secondaryColor` VARCHAR(191) NOT NULL DEFAULT '#2ecc71',
    `backgroundColor` VARCHAR(191) NOT NULL DEFAULT '#f5f5f5',
    `containerBg` VARCHAR(191) NOT NULL DEFAULT '#ffffff',
    `textColor` VARCHAR(191) NOT NULL DEFAULT '#333333',
    `headerBg` VARCHAR(191) NOT NULL DEFAULT '#2980b9',
    `footerBg` VARCHAR(191) NOT NULL DEFAULT '#34495e',
    `footerText` VARCHAR(191) NOT NULL DEFAULT '#ecf0f1',
    `inputBorder` VARCHAR(191) NOT NULL DEFAULT '#cccccc',
    `buttonBg` VARCHAR(191) NOT NULL DEFAULT '#3498db',
    `buttonText` VARCHAR(191) NOT NULL DEFAULT '#ffffff',
    `sectionMargin` VARCHAR(191) NOT NULL DEFAULT '20px',
    `logoURL` VARCHAR(191) NOT NULL DEFAULT 'default-logo.png',
    `voucherMessage` VARCHAR(191) NULL,
    `lastPaymentDate` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `establishmentId` INTEGER NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Client` ADD CONSTRAINT `Client_establishmentId_fkey` FOREIGN KEY (`establishmentId`) REFERENCES `Establishment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_establishmentId_fkey` FOREIGN KEY (`establishmentId`) REFERENCES `Establishment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
