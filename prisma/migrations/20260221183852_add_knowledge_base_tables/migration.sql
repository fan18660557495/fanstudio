/*
  Warnings:

  - You are about to drop the `toolcategory` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `workversion` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `tool` DROP FOREIGN KEY `Tool_categoryId_fkey`;

-- AlterTable
ALTER TABLE `category` MODIFY `type` ENUM('POST', 'WORK', 'DESIGN', 'DEVELOPMENT', 'TUTORIAL', 'TOOL', 'KNOWLEDGE_BASE') NOT NULL;

-- AlterTable
ALTER TABLE `workversion` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- DropTable
DROP TABLE `toolcategory`;

-- CreateTable
CREATE TABLE `knowledgebasearticle` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `content` JSON NOT NULL,
    `excerpt` TEXT NULL,
    `coverImage` TEXT NULL,
    `coverRatio` VARCHAR(10) NOT NULL DEFAULT '3:4',
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `categoryId` VARCHAR(191) NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `publishedAt` DATETIME(3) NULL,

    UNIQUE INDEX `KnowledgeBaseArticle_slug_key`(`slug`),
    INDEX `KnowledgeBaseArticle_authorId_idx`(`authorId`),
    INDEX `KnowledgeBaseArticle_categoryId_idx`(`categoryId`),
    INDEX `KnowledgeBaseArticle_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `knowledgebasecategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `KnowledgeBaseCategory_slug_key`(`slug`),
    INDEX `KnowledgeBaseCategory_parentId_idx`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `knowledgebasetag` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `KnowledgeBaseTag_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_knowledgebasearticletoknowledgebasetag` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_knowledgebasearticletoknowledgebasetag_AB_unique`(`A`, `B`),
    INDEX `_knowledgebasearticletoknowledgebasetag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `knowledgebasearticle` ADD CONSTRAINT `KnowledgeBaseArticle_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `knowledgebasearticle` ADD CONSTRAINT `KnowledgeBaseArticle_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `knowledgebasecategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `knowledgebasecategory` ADD CONSTRAINT `KnowledgeBaseCategory_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `knowledgebasecategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tool` ADD CONSTRAINT `Tool_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_knowledgebasearticletoknowledgebasetag` ADD CONSTRAINT `_knowledgebasearticletoknowledgebasetag_A_fkey` FOREIGN KEY (`A`) REFERENCES `knowledgebasearticle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_knowledgebasearticletoknowledgebasetag` ADD CONSTRAINT `_knowledgebasearticletoknowledgebasetag_B_fkey` FOREIGN KEY (`B`) REFERENCES `knowledgebasetag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `_posttotag` RENAME INDEX `_PostToTag_AB_unique` TO `_posttotag_AB_unique`;

-- RenameIndex
ALTER TABLE `_posttotag` RENAME INDEX `_PostToTag_B_index` TO `_posttotag_B_index`;

-- RenameIndex
ALTER TABLE `_tagtovideotutorial` RENAME INDEX `_TagToVideoTutorial_AB_unique` TO `_tagtovideotutorial_AB_unique`;

-- RenameIndex
ALTER TABLE `_tagtovideotutorial` RENAME INDEX `_TagToVideoTutorial_B_index` TO `_tagtovideotutorial_B_index`;

-- RenameIndex
ALTER TABLE `_tagtowork` RENAME INDEX `_TagToWork_AB_unique` TO `_tagtowork_AB_unique`;

-- RenameIndex
ALTER TABLE `_tagtowork` RENAME INDEX `_TagToWork_B_index` TO `_tagtowork_B_index`;
