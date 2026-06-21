const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event) => {
  const { fileID } = event
  if (!fileID) return { success: false, error: '缺少文件ID' }
  return { success: true, fileID }
}
