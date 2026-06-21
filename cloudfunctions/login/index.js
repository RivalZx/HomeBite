const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  const member = await db.collection('family_members').where({ openid: OPENID }).get()
  if (member.data.length === 0) {
    await db.collection('family_members').add({
      data: { openid: OPENID, familyId: 'default', role: 'member', joinedAt: db.serverDate() }
    })
  }
  return { openid: OPENID }
}
