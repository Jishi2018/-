// aboutUS.js

var app = getApp();

// 获取LeanCloud对象
const AV = require('../../libs/av-weapp.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    //animationRotate: {}
    suggestion: ""
  },
  getCfg: function () {
    var that = this;

    var query = new AV.Query('Config');
    query.get('5adfe6689f545433342b4936').then(function (cfg) {
      // 成功获得实例
      console.log("tst");
      app.globalData.suggestion = cfg.get('suggestion');
      app.globalData.blackboard = cfg.get('blackboard');
      app.globalData.share_max = cfg.get('share_max');
      app.globalData.marker_mode = cfg.get('marker_mode');
      app.globalData.marker_max = cfg.get('marker_max_num');
      app.globalData.req_title_max = cfg.get('req_title_max');
      //app.globalData.req_content_max = cfg.get('req_content_max');
      app.globalData.share_content_max = cfg.get('share_content_max');
      app.globalData.blackuser = cfg.get('blackuser');

      app.globalData.share_perpage = cfg.get('share_perpage');
      app.globalData.kankan_perpage = cfg.get('kankan_perpage');
      app.globalData.kankan_max_down = cfg.get('kankan_max_down');
      app.globalData.longitude_offset = cfg.get('longitude_offset');
      app.globalData.latitude_offset = cfg.get('latitude_offset');

      app.globalData.scale_mode = cfg.get('scale_mode');

      //判断当前用户是否在黑名单内，如果在黑名单内所有的功能都屏蔽

    }).catch(function (error) {
      // 异常处理
      wx.showToast({
        title: '系统提示:网络错误',
        icon: 'warn',
        duration: 1500,
      })

    });

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  
    this.setData({
      suggestion: app.globalData.suggestion,
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

    this.getCfg();
  
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