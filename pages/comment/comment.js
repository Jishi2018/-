// pages/comment/comment.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    article_id:'',
    proc_mode:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var cur_item;
    var cur_proc_mode;
    cur_item = JSON.parse(options.item);
    cur_proc_mode = options.proc_mode;
    console.log(cur_item);
    console.log("获取的处理模式为");
    console.log(cur_proc_mode);
    console.log("获取的处理模式为b");

    that.setData({
      article_id: cur_item,  
      proc_mode: cur_proc_mode
    })
  
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})