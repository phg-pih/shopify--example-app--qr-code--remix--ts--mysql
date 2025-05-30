-- CreateTable
CREATE TABLE `QRCode` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `shop` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `productHandle` VARCHAR(191) NOT NULL,
    `productVariantId` VARCHAR(191) NOT NULL,
    `destination` VARCHAR(191) NOT NULL,
    `scans` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `QRCode_productId_productVariantId_idx`(`productId`, `productVariantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
