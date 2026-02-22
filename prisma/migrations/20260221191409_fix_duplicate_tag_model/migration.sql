/*
  Warnings:

  - You are about to drop the `_knowledgebasearticletoknowledgebasetag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `knowledgebasecategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `knowledgebasetag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_knowledgebasearticletoknowledgebasetag` DROP FOREIGN KEY `_knowledgebasearticletoknowledgebasetag_A_fkey`;

-- DropForeignKey
ALTER TABLE `_knowledgebasearticletoknowledgebasetag` DROP FOREIGN KEY `_knowledgebasearticletoknowledgebasetag_B_fkey`;

-- DropForeignKey
ALTER TABLE `knowledgebasearticle` DROP FOREIGN KEY `KnowledgeBaseArticle_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `knowledgebasecategory` DROP FOREIGN KEY `KnowledgeBaseCategory_parentId_fkey`;

-- DropTable
DROP TABLE `_knowledgebasearticletoknowledgebasetag`;

-- DropTable
DROP TABLE `knowledgebasecategory`;

-- DropTable
DROP TABLE `knowledgebasetag`;

-- CreateTable
CREATE TABLE `_knowledgebasetagtopost` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_knowledgebasetagtopost_AB_unique`(`A`, `B`),
    INDEX `_knowledgebasetagtopost_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `knowledgebasearticle` ADD CONSTRAINT `KnowledgeBaseArticle_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_knowledgebasetagtopost` ADD CONSTRAINT `_knowledgebasetagtopost_A_fkey` FOREIGN KEY (`A`) REFERENCES `knowledgebasearticle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_knowledgebasetagtopost` ADD CONSTRAINT `_knowledgebasetagtopost_B_fkey` FOREIGN KEY (`B`) REFERENCES `tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
