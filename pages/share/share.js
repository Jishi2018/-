import util from './../../utils/util.js';
// Haiwei: 获取LeanCloud对象
const AV = require('../../libs/av-weapp.js');
var app = getApp();
//Haiwei: 存放选取marker的信息
var cur_marker;
//
var multiImageUrl=[];
//Haiwei:
var content_max = 50;
Page({
  data: {
    showfootertab: 0,  //底部标签页索引
    uploadimgs:[], //上传图片列表
    editable: false,//是否可编辑
    index:0,//Haiwei:上传图片的index 记录
    uploadUrl: '',//Haiwei:响应者上传图像记录变量
    response_info:''//Haiwei:响应写的信息
  },
  // 显示对话框
  showPrompt: function (content) {
    wx.showModal({
      title: '提示',
      content: content,
      showCancel: false,
    });
  },
  onLoad:function() {
    //cur_marker = JSON.parse(options.marker);
    
    this.setData({
      uploadimgs:[]
    })
    content_max = app.globalData.share_content_max;
    //console.log(this.data.cur_marker.latitude);
    //this.fetchQuestions();
  },
  chooseImage:function() {
    let _this = this;
    //Haiwei: 规定一次只能上传9张
    if (_this.data.uploadimgs.length > 6) {
      _this.showPrompt('图片数目超过6张');
      return;
    }
    wx.showActionSheet({
      itemList: ['从相册中选择', '拍照'],
      itemColor: "#f7982a",
      success: function(res) {
        if (!res.cancel) {
          if(res.tapIndex == 0){
            _this.chooseWxImage('album')
          }else if(res.tapIndex == 1){
            _this.chooseWxImage('camera')
          }
        }
      }
    })
  },
  chooseWxImage:function(type){
    let _this = this;
    
    wx.chooseImage({
      sizeType: ['original', 'compressed'],
      sourceType: [type],
      success: function (res) {
        _this.setData({
          uploadimgs: _this.data.uploadimgs.concat(res.tempFilePaths)
        })
      }
    })
  },
  editImage:function(){
    console.log("editImage event");
    this.setData({
      editable: !this.data.editable
    })
  },
  deleteImg:function(e){
    console.log("deleteImg event");
    console.log(e.currentTarget.dataset.index);
    var index = e.currentTarget.dataset.index;
    var imgs = this.data.uploadimgs
    // Array.prototype.remove = function(i){
    //   const l = this.length;
    //   if(l==1){
    //     return []
    //   }else if(i>1){
    //     return [].concat(this.splice(0,i),this.splice(i+1,l-1))
    //   }
    // }
    //Haiwei:看一些资料，删除不能用remove,这里用splice　命令
    imgs.splice(index,1);
    this.setData({
      //Haiwei: 下面编译的时候，提示没有remvove 功能，这里用splice 命令
      uploadimgs:imgs
      //uploadimgs: imgs.remove(e.currentTarget.dataset.index)
    })
  },
  respondSubmit:function(){
    let _this = this;
    var that = this;
    //添加的几张图片和文字描述发送的服务器器
    if (_this.data.response_info.length > content_max) {
      that.showPrompt('文字数目超过' + content_max);
      return;
    }
    if (_this.data.uploadimgs.length == 0) {
      _this.showPrompt('图片没有提交');
      return;
    }
    //提示上载中
    wx.showLoading({
      title: '上载中...'
    })
    console.log("a");
    if(1)
    {
     //清零操作： 
     multiImageUrl = [];
     _this.data.index = 0;

     if(0)
     {
       // 下面逻辑处理会混乱，这里采用递归的方式
       for (var i in _this.data.uploadimgs) {
         //console.log(i + "-----" + _this.data.uploadimgs[i]);
         //Haiwei: 这里函数调用，获取外面的信息，采用data 里面过渡来处理
         _this.data.index = i;
         _this.uploadServer();
       }

     }else
     {
       _this.uploadServer();
     }
    }
    console.log("b");
    wx.hideLoading();
    //Haiwei: 调试中，这里提交就退出，可能没有上载成功，这里需要上载成功再返回主页面
    if(1)
    {
      wx.switchTab({
        url: '../fenxiang/fenxiang'
      })
    }
  
    console.log("c");
  },
  bindTextAreaBlur: function (e) {//Haiwei: 添加获取文本框信息
    var that =this;
    this.setData({
      response_info: e.detail.value
    })

    if (this.data.response_info.length > content_max) {
      that.showPrompt('文字数目超过' + content_max);
      return;
    }
  },
  
  uploadServer:function()   //Haiwei: 添加函数处理单个图片
  {
    const newlist = [];
    let _this = this;
    var that = this;
    //单个函数实现一个图片信息的上传
    var tempFilePath = _this.data.uploadimgs[_this.data.index];

    //Haiwei: 上传的文件和其它关联，这样方便查询
    //var user = new AV.User();
    //Haiwei: TBD: 后续filename 是否绑定提需求的名字，带着响应者名字，这样唯一性？
    var share_id = getApp().globalData.userInfo.nickName;

    var file_name = "Share_" + share_id;

    //

    console.log(file_name);
    var avFile = new AV.File(file_name, {
      blob: {
        uri: tempFilePath,
      },
    });
    console.log("A");

    avFile.save().then(function (avFile) {
      //console.log(avFile.url());
      that.setData({
        uploadUrl: avFile.url(),
      });
      //有效才存储：
      //wx.hideLoading();
      // Haiwei: 将响应者信息新生产结构体维护到第三方结构体
      
      newlist.push({
        "url": avFile.url()
      })
      multiImageUrl = multiImageUrl.concat(newlist);
      //Haiwei: 添加一userid信息，后续知道谁提的这个需求. 
      //响应需求也可以详细描述，保留和提需求规则一样。
     
   if (_this.data.index == (_this.data.uploadimgs.length - 1)) {
      var share = AV.Object.extend('Share');
      var col = new share();

	  col.set('author', share_id);  // 用户既可以是需求提出者，也可以是响应者
      col.set('content', _this.data.response_info);
	  
       //这里为了兼容以前，如果图片只有一个，就直接存放url 。（实际统一更好）
        if (_this.data.uploadimgs.length == 1)
        {
          col.set('url', _this.data.uploadUrl);

        }else
        {
          col.set('url', JSON.stringify(multiImageUrl)); 
        }

      col.set('imageNum', _this.data.uploadimgs.length);
      
      //图片上传指示
      col.set('type', "photo");
      
      col.save().then(function (success) {
        //wx.hideLoading();
        that.showPrompt('上传成功');
        
        //成功退出
        if(0)
        {
          wx.switchTab({
            url: '../fenxiang/fenxiang'
          })

        }
        

      }, function (error) {
        // 添加失败
        //wx.hideLoading();
        console.error('Failed to save in LeanCloud:' + error.message);
       // _this.showPrompt('添加失败');
        that.showPrompt('上传失败，可能网络异常，稍后重试');
      });
      //end
        return;
      }else
      {
        _this.data.index = _this.data.index +1;
        _this.uploadServer();

      }
    }, function (error) {
      console.error(error);
      //wx.hideLoading();
      that.showPrompt('上传失败，可能网络异常，稍后重试');
    });
    // console.log(avFile.__proto__.url());
    //console.log(avFile);

    //console.log(avFile.url());
    console.log("B");

  }
})
