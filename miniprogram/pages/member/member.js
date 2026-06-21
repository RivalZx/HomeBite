const app = getApp()

Page({
  data: {
    members: [],
    myOpenid: '',
    loading: true
  },

  onShow() {
    this.loadMembers()
  },

  async loadMembers() {
    this.setData({ loading: true })
    try {
      const members = await app.fetchFamilyMembers()
      this.setData({
        members: members,
        myOpenid: app.globalData.openid
      })
    } catch (e) {
      console.error(e)
    }
    this.setData({ loading: false })
  },

  inviteMember() {
    // 触发微信分享
    this.setData({}, () => {
      wx.showToast({ title: '点击右上角分享给家人', icon: 'none' })
    })
  },

  onShareAppMessage() {
    const familyId = app.globalData.familyId
    return {
      title: '来 HomeBite 一起点餐吧！🏠',
      path: `/pages/index/index?familyId=${familyId}`,
      imageUrl: ''
    }
  }
})
