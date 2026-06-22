const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { action, familyId, familyName, nickname, avatar } = event

  // ===== 查询用户当前家庭 =====
  if (action === 'getMyFamily') {
    const member = await db.collection('family_members').where({ openid: OPENID }).get()
    if (member.data.length === 0) {
      return { hasFamily: false }
    }
    const m = member.data[0]
    const family = await db.collection('families').doc(m.familyId).get().catch(() => null)
    return {
      hasFamily: true,
      familyId: m.familyId,
      role: m.role,
      familyName: family ? family.data.name : '',
      chefOpenId: family ? family.data.chefOpenId : ''
    }
  }

  // ===== 创建家庭 =====
  if (action === 'create') {
    // 检查用户是否已有家庭
    const existing = await db.collection('family_members').where({ openid: OPENID }).get()
    if (existing.data.length > 0) {
      return { success: false, error: '已有家庭' }
    }

    // 生成9位随机ID（不重复）
    let newId = ''
    let tries = 0
    while (tries < 20) {
      newId = String(Math.floor(100000000 + Math.random() * 900000000))
      const check = await db.collection('families').doc(newId).get().catch(() => null)
      if (!check || !check.data) break
      tries++
    }

    // 创建家庭
    await db.collection('families').add({
      data: {
        _id: newId,
        name: familyName || '我的家',
        chefOpenId: OPENID,
        createdAt: db.serverDate()
      }
    })

    // 将自己添加为厨师
    await db.collection('family_members').add({
      data: {
        openid: OPENID,
        familyId: newId,
        nickname: nickname || '',
        avatar: avatar || '',
        role: 'chef',
        joinedAt: db.serverDate()
      }
    })

    return { success: true, familyId: newId, role: 'chef', familyName: familyName || '我的家' }
  }

  // ===== 加入家庭 =====
  if (action === 'join') {
    // 检查用户是否已有家庭
    const existing = await db.collection('family_members').where({ openid: OPENID }).get()
    if (existing.data.length > 0) {
      return { success: false, error: '已有家庭，请先退出再加入' }
    }

    // 检查家庭是否存在
    const family = await db.collection('families').doc(familyId).get().catch(() => null)
    if (!family || !family.data) {
      return { success: false, error: '家庭ID不存在' }
    }

    // 加入家庭
    await db.collection('family_members').add({
      data: {
        openid: OPENID,
        familyId: familyId,
        nickname: nickname || '',
        avatar: avatar || '',
        role: 'member',
        joinedAt: db.serverDate()
      }
    })

    return { success: true, familyId, role: 'member', familyName: family.data.name, chefOpenId: family.data.chefOpenId }
  }

  // ===== 退出家庭 =====
  if (action === 'leave') {
    const member = await db.collection('family_members').where({ openid: OPENID }).get()
    if (member.data.length > 0) {
      await db.collection('family_members').doc(member.data[0]._id).remove()
    }
    return { success: true }
  }

  return { success: false, error: '未知操作' }
}
