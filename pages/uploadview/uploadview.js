//uploadview.js

// Haiwei: 获取LeanCloud对象
const AV = require('../../libs/av-weapp.js');
var app = getApp();

var cur_marker;
var content_max = 50;
var isPass = 0;
//踩踩响应视频和分享视频共用页面，但存储的表不一样，这里定义一个变量区分。0 为踩踩处理； 1 为分享处理


Page({
    data: {
        condition: true, //视频的显示判断
        icosrc: "../../images/plus_big.png",
        mode: 'scaleToFill',
        uploadText: "添加视频",
        videoSrc: "", //视频地址
        anonymous: true, //匿名
        titletext: "", //视频标题
        describe: "", //描述信息
        btnloading: false, //loading 图标 
        btntext: "确认提交",
        againBtn: false,
        response_info:'',
        reqcontent: '',//对哪个信息响应
        userurl: '', //用户头像链接
        page_from: true //踩踩响应视频和分享视频共用页面，但存储的表不一样，这里定义一个变量区分。0 为踩踩处理； 1 为分享处理

    },
    getUserAvatarUrl: function () {
      //
      var that = this;

     
      //和相关人交流，用户头像的连接是固定的，这里可以存放连接，不需要存放文件

      var req_id = cur_marker.reqid;

      //这里已经定义了一个表，故先查询再覆盖。
      var avatarUrl_query = new AV.Query('avatarUrl');

      avatarUrl_query.equalTo('userid', req_id);

      avatarUrl_query.descending("updatedAt");
      avatarUrl_query.find()
        .then(function (info) {
          console.log("get avatarUrl success");
          that.setData({
            userurl: info[0].get('url')
          })
          isPass = 1;
        }).catch(function (error) {
          //缺省也不处理
          isPass = 1;
          that.setData({
            userurl: "../../images/rank_on.png"
          })

        });

      //end
    },
    onShow: function () {

      var that = this;

      if ((isPass == 0) && (that.data.page_from ==true)) {
        that.getUserAvatarUrl();
      }
    },
    onLoad: function (options) {
      if (options.marker == 1)
      {
        console.log("分享页面发起");
     
        this.setData({
          page_from: false,
        })

      }else
      {
        console.log("踩踩页面发起");
        //为了方便查看用户头像，这里读取
        
        
        cur_marker = JSON.parse(options.marker);
        
        console.log(cur_marker);
        //Haiwei: 这里在前面考虑地图marker 控件显示标题可以显示用户名，需要将title 剥离下
        var total_title = cur_marker.title;
        var userIdLen = cur_marker.reqid.length;
        //在踩踩marker 用户名和title 间隔两个字符(: 和空格)，这里需要加2
        var title = cur_marker.title.slice(userIdLen + 2);
        //还原该信息
        cur_marker.title = title;
        console.log(cur_marker.title);
        this.getUserAvatarUrl();
        this.setData({
          //reqcontent: cur_marker.reqid + ": " + cur_marker.title,
          reqcontent: total_title,//后面优化将marer显示的标题添加了用户名，这里就不再添加了
          page_from:true
        })


      }
     
      content_max = app.globalData.share_content_max;
      //console.log(this.data.cur_marker.latitude);
      //this.fetchQuestions();
    },
    bindTextAreaBlur: function (e) {//Haiwei: 添加获取文本框信息
      this.setData({
        response_info: e.detail.value
      })
      if (this.data.response_info.length > content_max) {
        this.showPrompt('文字数目超过' + content_max);
      }
    },

    //视频标题
    titleInput: function(e) {
        this.setData({
            titletext: e.detail.value
        })
    },
    // 描述信息
    describeInput: function(e) {
        this.setData({
            describe: e.detail.value
        })
    },
    setRespondFlag: function () {
      // 当前标记响应，则表需要刷新，ack 递增

      if (app.globalData.scale_mode == 0) {
        var req_table = "Collection";

      } else {
        //TBD:　按照不同表格，后期采用遍历的方式, 不然其它位置信息看不到
        var index = Math.floor(curLocationLatitude);
        //console.log(index)；
        var req_table = "Collection" + index;
      }
      var cur_user = cur_marker.reqid;
      console.log(cur_user);

      var user_query = new AV.Query(req_table);
      user_query.equalTo('userid', cur_user);

      //https://leancloud.cn/docs/leanstorage_guide-js.html#hash1079143744
      //字符串比较用equalTo 失效，这里有包含
      //query.startsWith('reqid', 'nihao');

      var title_query = new AV.Query(req_table);
      console.log(cur_marker.title);
      //title_query.equalTo('title', cur_marker.title);
      title_query.equalTo('title', cur_marker.title);

      var latitude_query = new AV.Query(req_table);;
      latitude_query.equalTo('latitude', cur_marker.latitude);

      var longitude_query = new AV.Query(req_table);;
      longitude_query.equalTo('longitude', cur_marker.longitude);

      // 这里判断通过提交者、标题、地理位置 都统一才判断

      var collection_query = AV.Query.and(user_query, title_query, latitude_query, longitude_query);
      collection_query.find()
        .then(function (data) {
          console.log(" response have very response");
          var cur_ack = data[0].get('ack');
          cur_ack = cur_ack + 1;
          if (cur_ack > 128) {
            cur_ack = 128;
          }
          data[0].set('ack', cur_ack)
          //找到后修改标志(调试成功)
          data[0].save();


        }).catch(function (error) {
          console.log(" no response");
          // 查询失败
          console.error('Failed to save in LeanCloud:' + error.message);
          //that.showPrompt('加载收藏失败');
        });
      //
    }, 
    uploadfile: function() { //选择视频或者拍摄视频
        var _this = this;
        wx.chooseVideo({
            sourceType: ['album', 'camera'],
            maxDuration: 60,
            camera: 'back',
            success: function(res) {
                console.log(res);
                //判断视频大小---小于10M
                if (res.duration > 10240) {
                    wx.showToast({
                        title: '请上传小于10M的视频',
                        duration: 2000
                    })
                } else {
                    _this.setData({
                        videoSrc: res.tempFilePath,
                        condition: false,
                        againBtn: true,

                    })
                }
            },
            fail: function(res) {
                console.log("视频上传失败");
                console.log(res);
              _this.showPrompt('添加视频失败，视频格式不对或者网络异常');
              

            }
        })

    },
    //重新选择视频
    againUploadBtn: function() {
        this.setData({
            videoSrc: "",
            condition: true,
            againBtn: false,
        })
    },
    showPrompt: function (content) {
      wx.showModal({
        title: '提示',
        content: content,
        showCancel: false,
      });
    },
    fromCaicaiProc: function () {

      var that = this;

      //Haiwei: 这里上传采用leancloud 文件存储
      var respond_id = getApp().globalData.userInfo.nickName;
      var file_name = "video_" + respond_id;

      var avFile = new AV.File(file_name, {
        blob: {
          uri: that.data.videoSrc,
        },
      });

      //响应成功，就在表里面设置
      that.setRespondFlag();

      avFile.save().then(function (avFile) {
        console.log(avFile.url());
        var tmp_url = avFile.url();

        //这里视频的纪录还是通过Respond 表，用里面type 类型表示是图片还是视频
        console.log("aaa");
        var respond = AV.Object.extend('Respond');
        var col = new respond();
        console.log("bbb");
        col.set('respondid', respond_id);  // 用户既可以是需求提出者，也可以是响应者
        col.set('reqid', cur_marker.reqid); //提需求者
        console.log(cur_marker.reqid);
        col.set('title', cur_marker.title);  //这里只用标题，不用再分内容
        console.log("ccc");
        col.set('type', "video");
        console.log("ddd");
        console.log(that.data.response_info);
        //Haiwei: 这里将
        col.set('content', that.data.response_info);
        console.log("eee");
        //col.set('content', "太古里音乐喷泉");
        col.set('url', tmp_url);
        //Haiwei: 后面可以把提交图片的位置信息也带上，已经传过来，暂不存。
        //console.log(_this.data.uploadUrl);
        console.log("fff");

        col.save().then(function (success) {
          //wx.hideLoading();
          that.showPrompt('上传成功');
          //end

        }, function (error) {
          // 添加失败
          //wx.hideLoading();
          console.error('Failed to save in LeanCloud:' + error.message);
          // _this.showPrompt('添加失败');
          that.showPrompt('上传失败，可能网络异常，稍后重试');
        });

      }, function (error) {
        console.error(error);
        //wx.hideLoading();
        //this.showPrompt('上传失败，可能网络异常，稍后重试');
      });
      //end

      //这里不能对上传成功才推出，可能会挂死

      console.log("b");
      //Haiwei: 添加到主页面
      wx.switchTab({
        url: '../caicai/caicai'
      })
      console.log("c");
      
    },
    fromFengxiangProc: function () {
      var that = this;

      //Haiwei: 这里上传采用leancloud 文件存储
      var share_id = getApp().globalData.userInfo.nickName;
      var file_name = "video_share_" + share_id;  //分享的视频和踩踩的视频前缀区分下

      var avFile = new AV.File(file_name, {
        blob: {
          uri: that.data.videoSrc,
        },
      });

      
      avFile.save().then(function (avFile) {
        console.log(avFile.url());
        var tmp_url = avFile.url();

        var share = AV.Object.extend('Share');
        var col = new share();
	
		col.set('author', share_id);  // 用户既可以是需求提出者，也可以是响应者
        col.set('content', that.data.response_info);


        col.set('url', tmp_url);
        //为了方便在share 表里面区分是视频还是图片，这里添加一个字段分析
        col.set('type', "video");
        col.save().then(function (success) {
          //wx.hideLoading();
          that.showPrompt('上传成功');

        }, function (error) {
          // 添加失败
          //wx.hideLoading();
          console.error('Failed to save in LeanCloud:' + error.message);
          // _this.showPrompt('添加失败');
          that.showPrompt('上传失败，可能网络异常，稍后重试');
        });

      }, function (error) {
        console.error(error);
        //wx.hideLoading();
        //this.showPrompt('上传失败，可能网络异常，稍后重试');
      });
      //end

      //这里不能对上传成功才推出，可能会挂死

      console.log("b");
      //Haiwei: 添加到主页面
      wx.switchTab({
        url: '../fenxiang/fenxiang'
      })
      console.log("c");
    },

    //上传
    uploadBtn: function() {
      var that =this;
      if (that.data.response_info.length > content_max) {
        that.showPrompt('文字数目超过' + content_max);
        return;
      }

     if (that.data.videoSrc == "") {
            wx.showToast({
                title: '请上传视频',
                duration: 2000
            })
        } else {

       if (that.data.page_from == true)
       {
         //从踩踩页面发起
         that.fromCaicaiProc();

       } else if (that.data.page_from == false)
       {
         //分享页面发起
         that.fromFengxiangProc();
       }
             

        }

    


    }

   
})