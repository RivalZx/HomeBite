const app = getApp()

Page({
  data: {
    step: 'choose', // choose | create | join | loading
    familyName: '',
    joinId: ''
  },

  onLoad() {
    app.login()
  },

  // 显示创建表单
  showCreate() {
    this.setData({ step: 'create', familyName: '' })
  },

  // 显示加入表单
  showJoin() {
    this.setData({ step: 'join', joinId: '' })
  },

  // 返回选择页
  backToChoose() {
    this.setData({ step: 'choose' })
  },

  // 输入家庭名称
  onNameInput(e) {
    this.setData({ familyName: e.detail.value })
  },

  // 输入家庭ID
  onJoinIdInput(e) {
    this.setData({ joinId: e.detail.value })
  },

  // 创建家庭
  async createFamily() {
    if (!this.data.familyName) {
      wx.showToast({ title: '请输入家庭名称', icon: 'none' })
      return
    }
    this.setData({ step: 'loading' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'family',
        data: {
          action: 'create',
          familyName: this.data.familyName,
          nickname: '',
          avatar: ''
        }
      })
      const data = res.result
      if (data.success) {
        // 保存到全局和本地缓存
        app.globalData.openid = wx.getStorageSync('hb_user')?.openid || ''
        app.globalData.familyId = data.familyId
        app.globalData.familyName = data.familyName
        app.globalData.currentUser.role = 'chef'
        app.globalData.currentUser.isLoggedIn = true
        app.globalData.currentUser.isChef = true

        wx.setStorageSync('hb_user', {
          openid: app.globalData.openid,
          familyId: data.familyId,
          familyName: data.familyName,
          currentUser: {
            nickname: '我',
            avatar: '👤',
            avatarUrl: '',
            role: 'chef',
            isLoggedIn: true,
            isChef: true
          }
        })

        wx.reLaunch({ url: '/pages/index/index' })
      } else {
        wx.showToast({ title: data.error || '创建失败', icon: 'none' })
        this.setData({ step: 'create' })
      }
    } catch (e) {
      console.error(e)
      wx.showToast({ title: '网络错误，请重试', icon: 'none' })
      this.setData({ step: 'create' })
    }
  },

  // 加入家庭
  async joinFamily() {
    if (this.data.joinId.length !== 9) {
      wx.showToast({ title: '请输入9位家庭ID', icon: 'none' })
      return
    }
    this.setData({ step: 'loading' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'family',
        data: {
          action: 'join',
          familyId: this.data.joinId,
          nickname: '',
          avatar: ''
        }
      })
      const data = res.result
      if (data.success) {
        app.globalData.openid = wx.getStorageSync('hb_user')?.openid || ''
        app.globalData.familyId = data.familyId
        app.globalData.familyName = data.familyName
        app.globalData.currentUser.role = 'member'
        app.globalData.currentUser.isLoggedIn = true
        app.globalData.currentUser.isChef = false

        wx.setStorageSync('hb_user', {
          openid: app.globalData.openid,
          familyId: data.familyId,
          familyName: data.familyName,
          currentUser: {
            nickname: '我',
            avatar: '👤',
            avatarUrl: '',
            role: 'member',
            isLoggedIn: true,
            isChef: false
          }
        })

        wx.reLaunch({ url: '/pages/index/index' })
      } else {
        wx.showToast({ title: data.error || '加入失败', icon: 'none' })
        this.setData({ step: 'join' })
      }
    } catch (e) {
      console.error(e)
      wx.showToast({ title: '网络错误，请重试', icon: 'none' })
      this.setData({ step: 'join' })
    }
  }
})
