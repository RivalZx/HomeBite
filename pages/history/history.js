const app = getApp()

Page({
  data: {
    orders: []
  },

  onShow() {
    const orders = wx.getStorageSync('homebite_orders') || []
    this.setData({ orders })
  },

  goHome() {
    wx.navigateBack()
  }
})
