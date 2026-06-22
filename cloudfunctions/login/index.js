const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  return { openid: OPENID }
}
