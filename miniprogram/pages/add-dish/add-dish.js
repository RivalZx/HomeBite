const app = getApp()

Page({
  data: { isEdit: false, editId: null, imageUrl: '', dishName: '', category: 'noodle', note: '', canSave: false, uploading: false },

  onLoad(options) {
    if (options.id) {
      const d = app.globalData.dishes.find(d => d.id === options.id)
      if (d) {
        this.setData({ isEdit: true, editId: options.id, imageUrl: d.imageUrl || '', dishName: d.name, category: d.category, note: d.note || '', canSave: true })
        wx.setNavigationBarTitle({ title: '编辑菜品' })
      }
    } else if (options.category) {
      this.setData({ category: options.category })
    }
  },

  chooseImage() {
    wx.chooseImage({
      count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ imageUrl: res.tempFilePaths[0] })
        this.checkCanSave()
      }
    })
  },

  onNameInput(e) { this.setData({ dishName: e.detail.value }); this.checkCanSave() },
  selectCategory(e) { this.setData({ category: e.currentTarget.dataset.cate }) },
  onNoteInput(e) { this.setData({ note: e.detail.value }) },
  checkCanSave() { this.setData({ canSave: !!this.data.dishName.trim() }) },

  async saveDish() {
    if (!this.data.canSave) { wx.showToast({ title: '菜名不能为空', icon: 'none' }); return }

    let imageUrl = this.data.imageUrl
    // 如果图片路径不是 cloud:// 格式，说明是临时路径，上传到云存储
    if (imageUrl && !imageUrl.startsWith('cloud://')) {
      this.setData({ uploading: true })
      try {
        const r = await wx.cloud.uploadFile({
          cloudPath: `dishes/${Date.now()}.jpg`,
          filePath: imageUrl
        })
        console.log('上传成功:', r.fileID)
        imageUrl = r.fileID
      } catch (e) {
        console.error('图片上传失败，跳过', e)
        imageUrl = ''
      }
      this.setData({ uploading: false })
    }

    try {
      if (this.data.isEdit) {
        await app.updateDish(this.data.editId, { name: this.data.dishName.trim(), category: this.data.category, note: this.data.note, imageUrl })
        wx.showToast({ title: '已更新 🎉', icon: 'none' })
      } else {
        await app.addDish({ name: this.data.dishName.trim(), category: this.data.category, imageUrl, note: this.data.note })
        wx.showToast({ title: '已加入菜单 🎉', icon: 'none' })
      }
      setTimeout(() => wx.navigateBack(), 1000)
    } catch (e) {
      console.error('保存失败', e)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  async deleteDish() {
    wx.showModal({
      title: '确定删除？', content: '删了可就没了哦',
      success: async (r) => {
        if (r.confirm) {
          try { await app.deleteDish(this.data.editId); wx.showToast({ title: '已删除', icon: 'none' }); setTimeout(() => wx.navigateBack(), 1000) }
          catch (e) { wx.showToast({ title: '删除失败', icon: 'none' }) }
        }
      }
    })
  }
})
