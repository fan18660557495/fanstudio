const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTools() {
  try {
    // 检查工具分类表
    console.log('检查工具分类表...');
    const toolCategories = await prisma.toolCategory.findMany();
    console.log('工具分类数量:', toolCategories.length);
    console.log('工具分类:', toolCategories.map(c => ({ id: c.id, name: c.name })));

    // 检查工具表
    console.log('\n检查工具表...');
    const tools = await prisma.tool.findMany({
      include: {
        category: true
      }
    });
    console.log('工具数量:', tools.length);
    console.log('工具:', tools.map(t => ({ id: t.id, name: t.name, categoryId: t.categoryId, categoryName: t.category?.name })));

    // 检查分类表
    console.log('\n检查分类表...');
    const categories = await prisma.category.findMany();
    console.log('分类数量:', categories.length);
    console.log('分类:', categories.map(c => ({ id: c.id, name: c.name, type: c.type })));
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTools();