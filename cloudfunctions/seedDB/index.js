const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async () => {
  const existing = await db.collection('dishes').count()
  if (existing.total > 0) return { message: '已有数据，跳过' }

  const list = [
    { name: '红烧牛肉面', category: 'noodle', sortOrder: 1 },
    { name: '番茄鸡蛋面', category: 'noodle', sortOrder: 2 },
    { name: '酸辣粉', category: 'noodle', sortOrder: 3 },
    { name: '葱油拌面', category: 'noodle', sortOrder: 4 },
    { name: '韭菜饺子', category: 'noodle', sortOrder: 5 },
    { name: '蛋炒饭', category: 'rice', sortOrder: 1 },
    { name: '黄焖鸡米饭', category: 'rice', sortOrder: 2 },
    { name: '腊味煲仔饭', category: 'rice', sortOrder: 3 },
    { name: '咖喱鸡肉饭', category: 'rice', sortOrder: 4 },
    { name: '皮蛋瘦肉粥', category: 'rice', sortOrder: 5 },
    { name: '水煮鱼', category: 'feast', sortOrder: 1 },
    { name: '红烧排骨', category: 'feast', sortOrder: 2 },
    { name: '宫保鸡丁', category: 'feast', sortOrder: 3 },
  ]

  const ids = []
  for (const d of list) {
    const r = await db.collection('dishes').add({
      data: { ...d, familyId: 'default', imageUrl: '', note: '', createdAt: db.serverDate() }
    })
    ids.push(r._id)
  }
  return { message: `添加了 ${ids.length} 道菜`, ids }
}
