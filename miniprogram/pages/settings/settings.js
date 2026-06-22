const app = getApp()

Page({
  data: {
    currentUser: {
      nickname: '我',
      avatarUrl: ''
    },
    familyName: '我的家',
    familyId: '',
    isChef: false
  },

  onShow() {
    this.loadUserInfo()
  },

  loadUserInfo() {
    const gu = app.globalData
    this.setData({
      currentUser: {
        nickname: gu.currentUser.nickname || '我',
        avatarUrl: gu.currentUser.avatarUrl || ''
      },
      familyName: gu.familyName || '我的家',
      familyId: gu.familyId || '',
      isChef: gu.currentUser.isChef || false
    })
  },

  onAvatarChosen(e) {
    const avatarUrl = e.detail.avatarUrl
    if (avatarUrl) {
      app.updateUserInfo(this.data.currentUser.nickname, avatarUrl)
      this.setData({
        currentUser: { ...this.data.currentUser, avatarUrl: avatarUrl }
      })
      wx.showToast({ title: '头像已更新 ✅', icon: 'none' })
    }
  },

  onNicknameInput(e) {
    const nickname = e.detail.value
    app.updateUserInfo(nickname, this.data.currentUser.avatarUrl)
    this.setData({
      currentUser: { ...this.data.currentUser, nickname: nickname }
    })
  },

  onFamilyNameInput(e) {
    const name = e.detail.value
    if (name) {
      app.globalData.familyName = name
      const saved = wx.getStorageSync('hb_user') || {}
      saved.familyName = name
      wx.setStorageSync('hb_user', saved)
      this.setData({ familyName: name })
    }
  },

  // 复制家庭ID
  copyFamilyId() {
    wx.setClipboardData({
      data: this.data.familyId,
      success: () => {
        wx.showToast({ title: '已复制家庭ID', icon: 'none' })
      }
    })
  },

  // 退出家庭
  leaveFamily() {
    wx.showModal({
      title: '退出家庭',
      content: '退出后需要重新创建或加入家庭，确定退出吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await wx.cloud.callFunction({
              name: 'family',
              data: { action: 'leave' }
            })
            // 清除本地缓存
            wx.removeStorageSync('hb_user')
            app.globalData.familyId = ''
            app.globalData.familyName = '我的家'
            app.globalData.currentUser.isChef = false
            app.globalData.currentUser.isLoggedIn = false
            wx.reLaunch({ url: '/pages/welcome/welcome' })
          } catch (e) {
            wx.showToast({ title: '退出失败', icon: 'none' })
          }
        }
      }
    })
  }
})
