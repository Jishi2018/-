// pages/appSYS/appSYS.js
// 获取应用实例
var app = getApp();

// 获取LeanCloud对象
const AV = require('../../libs/av-weapp.js');


var upload_cnt = 0;
Page({
  
  /**
   * 页面的初始数据
   */
  data: {
    upload2imgs: [] ,//上传的二维码
    uploadUrl: ''//Haiwei:响应者上传图像记录变量
  
  },
  // 显示对话框
  showPrompt: function (content) {
    wx.showModal({
      title: '提示',
      content: content,
      showCancel: false,
    });
  },
  choose2Image: function () {
    let _this = this;
    //Haiwei: 规定一次只能上传1张
    if (_this.data.upload2imgs.length > 1) {
      _this.showPrompt('您的微信收款二维码只能上传一张');
      return;
    }

    wx.showActionSheet({
      itemList: ['从相册中选择', '拍照'],
      itemColor: "#f7982a",
      success: function (res) {
        if (!res.cancel) {
          if (res.tapIndex == 0) {
            _this.chooseWx2Image('album')
          } else if (res.tapIndex == 1) {
            _this.chooseWx2Image('camera')
          }
        }
      }
    })
  },
  chooseWx2Image: function (type) {
    let _this = this;
    //Haiwei: 规定一次只能上传1张
    if (_this.data.upload2imgs.length > 1) {
      _this.showPrompt('您的微信收款二维码只能上传一张');
      return;
    }

    wx.chooseImage({
      sizeType: ['original', 'compressed'],
      sourceType: [type],
      success: function (res) {
        _this.setData({
          upload2imgs: _this.data.upload2imgs.concat(res.tempFilePaths)
        })
      }
    })
  },
  edit2Image: function () {
    console.log("editImage event");
    this.setData({
      editable: !this.data.editable
    })
  },
  delete2Img: function (e) {
    console.log("deleteImg event");
    console.log(e.currentTarget.dataset.index);
    var index = e.currentTarget.dataset.index;
    var imgs = this.data.upload2imgs
    // Array.prototype.remove = function(i){
    //   const l = this.length;
    //   if(l==1){
    //     return []
    //   }else if(i>1){
    //     return [].concat(this.splice(0,i),this.splice(i+1,l-1))
    //   }
    // }
    //Haiwei:看一些资料，删除不能用remove,这里用splice　命令
    imgs.splice(index, 1);
    this.setData({
      //Haiwei: 下面编译的时候，提示没有remvove 功能，这里用splice 命令
      upload2imgs: imgs
      //uploadimgs: imgs.remove(e.currentTarget.dataset.index)
    })
  },// 显示对话框
  //下面用下载接口，提示下载域没有提供，暂时功能不能正常。
  save2Url: function () {
    //
    var that = this;
    //和相关人交流，用户头像的连接是固定的，这里可以存放连接，不需要存放文件

    if (app.globalData.userInfo == null) {
      return;
    }
   
    var req_id = getApp().globalData.userInfo.nickName;

    //这里已经定义了一个表，故先查询再覆盖。
    var Respond2_query = new AV.Query('Respond2');

    Respond2_query.equalTo('respondid', req_id);

    Respond2_query.descending("updatedAt");
    Respond2_query.find()
      .then(function (info) {
        console.log("mask");
        //第一个覆盖
        info[0].set('url', that.data.upload2imgs[0]);

      }).catch(function (error) {
        console.log("need to add ");
        var respond2 = AV.Object.extend('Respond2');
        var col = new respond2();
        console.log("bbb");
        var req_id = getApp().globalData.userInfo.nickName;
        col.set('respondid', req_id);  // 用户既可以是需求提出者，也可以是响应者
        console.log("eee");
        //col.set('content', "太古里音乐喷泉");
        col.set('url', that.data.upload2imgs[0]);
        //Haiwei: 后面可以把提交图片的位置信息也带上，已经传过来，暂不存。
        //console.log(_this.data.uploadUrl);
        console.log("fff");

        col.save().then(function (success) {
          //wx.hideLoading();
          //另一个表存储成功提示，这里不提示
          that.showPrompt('上传成功');
          //end

        }, function (error) {
          // 添加失败
          //wx.hideLoading();
          console.error('Failed to save in LeanCloud:' + error.message);
          // _this.showPrompt('添加失败');
          that.showPrompt('上传失败，可能网络异常，稍后重试');
        });

      });

    //end
  },
  upload2: function () {
    //该函数是前面查找删除以前，在写入方法。 另一个是save2Url 找到后覆盖

    let _this = this;
    //单个函数实现一个图片信息的上传
    var tempFilePath = _this.data.upload2imgs[0];

    //Haiwei: 上传的文件和其它关联，这样方便查询
    //var user = new AV.User();
    //Haiwei: TBD: 后续filename 是否绑定提需求的名字，带着响应者名字，这样唯一性？
    var respond_id = getApp().globalData.userInfo.nickName;

    var file_name = "Respond2_" + respond_id;
    console.log(file_name);
    var avFile = new AV.File(file_name, {
      blob: {
        uri: tempFilePath,
      },
    });
    console.log("upload2 A2");

    avFile.save().then(function (avFile) {
      //console.log(avFile.url());
      _this.setData({
        uploadUrl: avFile.url(),
      });
      
      var respond2 = AV.Object.extend('Respond2');
      
      var col = new respond2();
      //这里上传二维码，可以只是昵称和二维码信息
      col.set('respondid', respond_id);  // 用户既可以是需求提出者，也可以是响应者
      col.set('url', _this.data.uploadUrl);
      
      col.save().then(function (success) {
        _this.showPrompt('您的微信收款二维码图片已上传成功');

      }, function (error) {
        // 添加失败
        console.error('Failed to save in LeanCloud:' + error.message);
        _this.showPrompt('添加失败');
      });
      //end

    }, function (error) {
      console.error(error);
    });
    
    console.log("upload2 B2");

  },
  upload2Server: function ()   //Haiwei: 添加函数处理单个图片
  {
    let _this = this;
  
    //判断二维码是否已经上传，如果上传就不处理，后台定时清除，会刷新。这里不用删除久的刷新新的
    //Haiwei: TBD: 后续filename 是否绑定提需求的名字，带着响应者名字，这样唯一性？
    var respond_id = getApp().globalData.userInfo.nickName;

    var query2 = new AV.Query('Respond2');
    query2.equalTo('respondid', respond_id);

    //按照最新时间
    query2.descending('createdAt');

    query2.find()
      .then(function (data) {
        //虽然有，刷新后台
        console.log(" have 2 ");
        data[0].destroy().then(function (success) {
          // 删除成功, 添加最新
          console.log(" 删除成功 ");
           _this.upload2();

        }).catch(function (error) {
          // 删除失败
          console.log(" 删除失败 ");
          _this.upload2();
        });

      }).catch(function (error) {
        console.log(" no have 2 ");
        //后台没有需要处理
        _this.upload2();
      });

  }, 
  respondSubmit: function () {

    let _this = this;
    //Haiwei: 容错性
    if (_this.data.upload2imgs.length == 0) {
      _this.showPrompt('您的微信收款二维码图片没有上传');
      return;
    }
    //Haiwei: 容错性
    if (_this.data.upload2imgs.length >1) {
      _this.showPrompt('您的微信收款二维码图片上传张数只能一张，请长按点击删除其它');
      return;
    }
    if (upload_cnt > 3)
    {
      _this.showPrompt('您的微信收款二维码图片上传次数超过3次，稍后再操作');
      return;
    }
    wx.showToast({
      title: '上载中',
      icon: 'uploading'
    })

    //上传二维码
    _this.upload2Server();

    upload_cnt++;
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  
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