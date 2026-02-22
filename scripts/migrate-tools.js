const { PrismaClient: PrismaClientOld } = require('./prisma/client-temp');
const { PrismaClient: PrismaClientNew } = require('@prisma/client');

const prismaOld = new PrismaClientOld();
const prismaNew = new PrismaClientNew();

async function migrateToolCategories() {
  try {
    console.log('开始迁移工具分类数据...');

    // 1. 导出旧的工具分类数据
    console.log('导出旧的工具分类数据...');
    const oldToolCategories = await prismaOld.toolCategory.findMany();
    console.log(`找到 ${oldToolCategories.length} 个工具分类`);

    // 2. 将旧的工具分类导入到新的Category模型中
    console.log('导入工具分类到新的Category模型...');
    const newToolCategories = [];
    for (const oldCategory of oldToolCategories) {
      try {
        const newCategory = await prismaNew.category.create({
          data: {
            name: oldCategory.name,
            slug: oldCategory.slug,
            type: 'TOOL'
          }
        });
        newToolCategories.push({
          oldId: oldCategory.id,
          newId: newCategory.id,
          name: oldCategory.name
        });
        console.log(`导入工具分类: ${oldCategory.name} (${oldCategory.id} → ${newCategory.id})`);
      } catch (error) {
        console.error(`导入工具分类失败: ${oldCategory.name}`, error);
      }
    }

    // 3. 导出旧的工具数据
    console.log('\n导出旧的工具数据...');
    const oldTools = await prismaOld.tool.findMany({
      include: {
        category: true
      }
    });
    console.log(`找到 ${oldTools.length} 个工具`);

    // 4. 将旧的工具导入到新的Tool模型中，使用新的分类ID
    console.log('导入工具到新的Tool模型...');
    let importedTools = 0;
    for (const oldTool of oldTools) {
      try {
        // 找到对应的新分类ID
        const categoryMapping = newToolCategories.find(
          mapping => mapping.oldId === oldTool.categoryId
        );

        if (!categoryMapping) {
          console.error(`找不到工具 ${oldTool.name} 的分类映射: ${oldTool.categoryId}`);
          continue;
        }

        const newTool = await prismaNew.tool.create({
          data: {
            name: oldTool.name,
            description: oldTool.description,
            link: oldTool.link,
            categoryId: categoryMapping.newId,
            isActive: oldTool.isActive
          }
        });
        importedTools++;
        console.log(`导入工具: ${oldTool.name} (${oldTool.id} → ${newTool.id})`);
      } catch (error) {
        console.error(`导入工具失败: ${oldTool.name}`, error);
      }
    }

    console.log(`\n迁移完成: 导入了 ${newToolCategories.length} 个工具分类和 ${importedTools} 个工具`);

  } catch (error) {
    console.error('迁移过程中发生错误:', error);
  } finally {
    await prismaOld.$disconnect();
    await prismaNew.$disconnect();
  }
}

migrateToolCategories();