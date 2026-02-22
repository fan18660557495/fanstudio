const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initToolCategories() {
  try {
    console.log('开始初始化工具分类...');

    // 默认工具分类
    const defaultCategories = [
      { name: 'AI写作', slug: 'ai-writing', description: '人工智能写作助手和内容生成工具' },
      { name: 'AI图像', slug: 'ai-image', description: 'AI图像生成、编辑和处理工具' },
      { name: 'AI视频', slug: 'ai-video', description: 'AI视频创作、剪辑和生成工具' },
      { name: 'AI办公', slug: 'ai-office', description: 'AI办公效率工具和文档处理' },
      { name: 'AI开发', slug: 'ai-development', description: 'AI模型开发和部署工具' },
      { name: 'AI聊天', slug: 'ai-chat', description: 'AI对话助手和智能聊天工具' }
    ];

    // 批量创建分类
    for (const category of defaultCategories) {
      const existing = await prisma.toolCategory.findUnique({ 
        where: { slug: category.slug } 
      });

      if (!existing) {
        const newCategory = await prisma.toolCategory.create({
          data: category
        });
        console.log(`创建分类: ${newCategory.name}`);
      } else {
        console.log(`分类已存在: ${category.name}`);
      }
    }

    console.log('工具分类初始化完成！');

  } catch (error) {
    console.error('初始化失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initToolCategories();
