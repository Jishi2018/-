// pages/myAgree/myAgree.js
// 获取应用实例
var app = getApp();

// 获取LeanCloud对象
const AV = require('../../libs/av-weapp.js');

var isPass  = 0; //如果逻辑没有走到，就在onshow 再执行

Page({

  /**
   * 页面的初始数据
   */
  data: {
    blackboard: "中国有些大，总想去看看！中国又小，总有些您曾经走过且还一直留恋的地方或者角落，您又想再去看看！ 您所想看的地方，也许有个她在那里，您只需要在中国地图上提个拍摄需求，她可以帮您完成! 同样您当前周边有很多角落风景，也许是其它陌生朋友也非常希望喜欢的，您可以在地图上选定对应位置进行拍摄发布，其它朋友就可以在地图对应位置查看并欣赏！同时该小程序支持微信支付奖励功能，您帮助了别人，别人可以给您回报！",
    active_url: '/res/bigworld/beiying.jpg'
  
  },
  getActivity: function () {
    var that = this;
     
    if (app.globalData.activity ==null)
    {
      //为了避免频繁的交互提示，这里图像列表到最后后，可以通过插入广告图片来告知结束
      //https://leancloud.cn/docs/leanstorage_guide-js.html#hash-1971670686
      var activity_query = new AV.Query('Share');

      //var user_query = new AV.Query('Share');

      //guanggao_query.equalTo('author', cur_user);
      activity_query.startsWith('content', '[活动]');

      activity_query.find()
        .then(function (data) {

          //**： bug ，紧跟着添加打印信息都会执行。且不匹配后面访问不执行

          console.log(data[0].get('content'));
          console.log(data[0].get('url'));
          console.log("get activity");


          wx.downloadFile({
            url: data[0].get('url'),
            type: 'image',
            success: function (res) {
              // 这里是异步的，故局部变量值完全不定，需要检
              console.log("get activity success");

              var filePath = res.tempFilePath;
              app.globalData.activity = filePath;

              that.setData({
                blackboard: app.globalData.blackboard,
                active_url: filePath
              })

              isPass = 1;

            },
            fail: function (err) {
              console.log(err);
            }
          })

        }).catch(function (error) {
          console.log(" no response");
          // 查询失败
          //console.error('Failed to save in LeanCloud:' + error.message);
          //that.showPrompt('加载失败');
        });


    }else
    {
      that.setData({
        blackboard: app.globalData.blackboard,
        active_url: app.globalData.activity
      })

    }

    //
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    isPass = 0;
    this.getActivity();
    
  
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
    if(isPass == 0)
    {
      this.getActivity();
    }
  
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