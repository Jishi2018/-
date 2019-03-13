
const AV = require('../../libs/av-weapp.js');
var app = getApp();
Page({
    data: {
        showVideo: true,
        videoSrc: "", //视屏地址
        titleText: "一个简单的视屏",
        userImgSrc: '../image/1.jpg',
        userName: "梦魇",
        heartImgSrc: "../image/heart.png",
        heartNumber: "1122",
        describeText: "nizianasdlasdkfsjdkfwjalsjdxnasdkjlaskdf"
    },
    //事件处理函数

    //跳转页面
    viewTap: function(e) {
        //获取分类Id
        var classid = e.target.id
            //跳转到列表
        wx.navigateTo({
            url: '../lists/lists?id=' + classid,
        })
    },
    onLoad: function () {
      var that = this;
      console.log('onLoad');

      var query = new AV.Query('Video');
      //var query = AV.Query.and(maxlongtitude_query, minlongtitude_query);
      console.log("XXX");
      query.descending('createdAt');

      //query.notEqualTo('author', blackuser);
      query.find()
        .then(function (data) {
          // 获取查询结果写会本地
          //console.log(data);
          that.setData({
            videoSrc: data[0].get('url')
          })
          console.log(that.data.videoSrc);
          
      
        }).catch(function (error) {
          console.log(" no response");
          
        });
      
      
    }

})