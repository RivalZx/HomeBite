const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { nickname, avatar, inviteFamilyId } = event

  // 查用户是否已加入家庭
  const member = await db.collection('family_members').where({ openid: OPENID }).get()
  const hasExistingFamily = member.data.length > 0

  // ====== 受邀加入已有家庭（优先级最高） ======
  if (inviteFamilyId) {
    const family = await db.collection('families').doc(inviteFamilyId).get().catch(() => null)
    if (family) {
      if (hasExistingFamily) {
        // 已有家庭 → 切换到被邀请的家庭
        await db.collection('family_members').doc(member.data[0]._id).update({
          data: { familyId: inviteFamilyId, role: 'member', nickname: nickname || '', avatar: avatar || '' }
        })
      } else {
        // 新用户 → 直接加入
        await db.collection('family_members').add({
          data: {
            openid: OPENID,
            familyId: inviteFamilyId,
            nickname: nickname || '',
            avatar: avatar || '',
            role: 'member',
            joinedAt: db.serverDate()
          }
        })
      }
      return {
        openid: OPENID,
        familyId: inviteFamilyId,
        role: 'member',
        familyName: family.data.name || '我的家'
      }
    }
  }

  // ====== 已有家庭（无邀请时） ======
  if (hasExistingFamily) {
    const user = member.data[0]

    // 升级旧数据：从 'default' 迁移到真实家庭
    if (user.familyId === 'default') {
      const newFamilyId = 'fam_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
      await db.collection('families').add({
        data: {
          _id: newFamilyId,
          name: nickname ? nickname + '的家' : '我的家',
          createdBy: OPENID,
          createdAt: db.serverDate()
        }
      })
      await db.collection('family_members').doc(user._id).update({
        data: { familyId: newFamilyId, role: 'owner', nickname: nickname || '', avatar: avatar || '' }
      })
      await db.collection('dishes').where({ familyId: 'default' }).update({
        data: { familyId: newFamilyId }
      })
      return { openid: OPENID, familyId: newFamilyId, role: 'owner', familyName: nickname ? nickname + '的家' : '我的家' }
    }

    const family = await db.collection('families').doc(user.familyId).get().catch(() => null)
    return {
      openid: OPENID,
      familyId: user.familyId,
      role: user.role,
      familyName: family ? family.data.name : '我的家'
    }
  }

  // ====== 创建新家庭 ======
  const familyId = 'fam_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
  await db.collection('families').add({
    data: {
      _id: familyId,
      name: nickname ? nickname + '的家' : '我的家',
      createdBy: OPENID,
      createdAt: db.serverDate()
    }
  })

  await db.collection('family_members').add({
    data: {
      openid: OPENID,
      familyId: familyId,
      nickname: nickname || '',
      avatar: avatar || '',
      role: 'owner',
      joinedAt: db.serverDate()
    }
  })

  return {
    openid: OPENID,
    familyId: familyId,
    role: 'owner',
    familyName: nickname ? nickname + '的家' : '我的家'
  }
}
