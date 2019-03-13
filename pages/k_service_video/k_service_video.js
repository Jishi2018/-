
// 获取应用实例
var app = getApp();

// 获取LeanCloud对象
const AV = require('../../libs/av-weapp.js');

var height; // 屏幕高度，在onLoad中获取
var width; // 屏幕宽度，在onLoad中获取

var mapCtx; // 地图上下文，用于获取或设置中心坐标，在定位成功后初始化

var mapHeight; // 地图控件高度，在onLoad获取页面高度后计算
var mapWidth; // 地图控件宽度，在onLoad获取页面宽度后计算
//var MAP_HEIGHT_SCALA = 0.87; // 高度占总高度比例
//Haiwei: 减小图形高度，添加上传图像按钮（已验证可以通过这个修改）
var MAP_HEIGHT_SCALA = 0.50; // 高度占总高度比例
var MAP_WIDTH_SCALA = 1; // 宽度占总宽度比例

var CENTER_CONTROL_ID = 0; // 中心控件ID
var centerControl = { id: CENTER_CONTROL_ID, }; // 中心控件
var CENTER_CONTROL_RES = '/res/selected.png'; // 中心控件图标

var LOCATION_TYPE = 'gcj02'; // 定位类型，gcj02 返回可用于地图的坐标，wgs84 返回 gps 坐标
var DEFAULT_SCALA = 18; // 默认缩放，范围5-18

var location = {}; // 定位坐标
var LOCATION_MARKER_ID = 0; // 定位点ID
var locationMarker = { id: LOCATION_MARKER_ID }; // 定位标记
var LOCATION_MARKER_RES = '/res/location.png'; // 定位标记图标

var SELECTED_MARKER_ID = 1; // 选取点ID
var selectedMarker = { id: SELECTED_MARKER_ID, }; // 选取标记

// 添加收藏对话框

var collectContent; // 内容


var COLLECTION_MARKER_RES = '/res/respond_marker.png'; // 收藏标记图标

var search; // 搜索框文本

var commit_max = 0; // 一次提交超过16个就退出。

var markers = [
  // 定位标记
  locationMarker,
  // 选取点ID
  selectedMarker,
]; // 地图标记

var controls = [
  // 中心控件
  centerControl,
]; // 地图控件



//Haiwei: 考虑该小程序就是定制拍摄需求，故描述需要详细，给150
var req_title_max = 150;
//var req_content_max =50;

var multiImageUrl = [];

var cur_marker;
var proc_mode = 0; //0 是新添加位置处理； 1是已有位置处理

Page({
  data: {
    collectModalHidden: true, // 添加收藏对话框隐藏
    collectionModalHidden: true, // 收藏信息对话框隐藏
    mapHidden: false,
    value: '',// 输入框清空
    commit_info: '',// 用户提交的文字信息
    showfootertab: 0,  //底部标签页索引
    uploadimgs: [], //上传图片列表
    editable: false,//是否可编辑
    index: 0,//Haiwei:上传图片的index 记录
    uploadUrl: '',//Haiwei:响应者上传图像记录变量
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
  },

  // 显示对话框
  showPrompt: function (content) {
    wx.showModal({
      title: '提示',
      content: content,
      showCancel: false,
    });
  },
  // 定位
  getLocation: function () {
    var that = this;
    // 开始定位
    wx.getLocation({
      type: LOCATION_TYPE, // 默认为 wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标
      success: function (res) {
        // 定位成功
        // 定位坐标
        location = {
          latitude: res.latitude,
          longitude: res.longitude,
        }
        // // 更新定位标记
        // locationMarker = {
        //   id: LOCATION_MARKER_ID,
        //   title: 'location',
        //   iconPath: LOCATION_MARKER_RES,
        //   latitude: res.latitude,
        //   longitude: res.longitude,
        //   width: 100,
        //   height: 100,
        // };
        // markers[LOCATION_MARKER_ID] = locationMarker;
        that.addCenterControl(); // 添加中心控件
        // 更新数据
        that.setData({
          position: location, // 定位坐标
          scala: DEFAULT_SCALA, // 缩放比例[5-18]
          markers: markers, // 标记点
        });
        mapCtx = wx.createMapContext('map');
      },
      fail: function () {
        // 定位失败
        that.showPrompt('地理位置权限没有允许，请在发现->小程序>删除该小程序后重新打开');

      },
      complete: function () {
        // 定位完成
      }
    })
  },

  // 添加地图中心控件
  addCenterControl: function () {
    centerControl = {
      id: CENTER_CONTROL_ID,
      iconPath: CENTER_CONTROL_RES,
      position: {
        left: mapWidth / 2 - 40 / 2,
        top: mapHeight / 2 - 40,
        width: mapWidth * 0.1,
        height: mapWidth * 0.1
      }, // 根据地图宽高和图片尺寸计算位置
      clickable: true
    }
    controls[CENTER_CONTROL_ID] = centerControl;
    this.setData({
      controls: controls,
    })
  },

  // 地图非标记点点击事件
  onMapTap: function (e) {
    var that = this;
    // 显示加载中
    wx.showToast({
      title: '加载选取工具',
      icon: 'loading',
      duration: 2000
    });
    // 跳转选取位置
    wx.chooseLocation({
      success: function (res) {
        // 选取成功
        var point = {
          latitude: res.latitude,
          longitude: res.longitude,
        };
        that.setData({
          position: point // 设置中心位置为选定点
        });
      },
      cancel: function () {
        // 选取取消
      },
      fail: function () {
        // 选取失败
        // that.showPrompt('选取失败');
      },
      complete: function () {
        // 调用地理控件选择完成后，上面选取point 刷新后，地图也会切换到这个点
        console.log("k_service_img select success");
      }
    })
  },

  // 标记点点击事件
  onMarkerTap: function (e) {
    // 定位标记
    if (e.markerId == LOCATION_MARKER_ID) {
      wx.showToast({
        title: '当前定位',
        icon: 'success',
      });
    } else if (e.markerId == SELECTED_MARKER_ID) {
      // 选取标记
      wx.showToast({
        title: '选取位置',
        icon: 'success',
      });
    } else {
      // 收藏标记
      var marker = markers[e.markerId];
      var collection = {
        title: marker.title,
        type: marker.type,
        content: marker.content,
      };
      // 弹出添加收藏对话框
      this.setData({
        collectionModalHidden: false,
        collection: collection
      });
    }
  },
  bindTextAreaBlur: function (e) {//Haiwei: 添加获取文本框信息
    this.setData({
      commit_info: e.detail.value
    })
    console.log(this.data.commit_info);
    if (this.data.commit_info.length > req_title_max) {
      this.showPrompt('文字数目超过' + req_title_max);
    }
  },
  //下面用下载接口，提示下载域没有提供，暂时功能不能正常。
  saveUserAvatarUrl: function () {
    //
    var that = this;
    //和相关人交流，用户头像的连接是固定的，这里可以存放连接，不需要存放文件

    if (app.globalData.userInfo == null) {
      return;
    }
    console.log("saveUserAvatarUrl beg");

    var req_id = getApp().globalData.userInfo.nickName;

    //这里已经定义了一个表，故先查询再覆盖。
    var avatarUrl_query = new AV.Query('avatarUrl');

    avatarUrl_query.equalTo('userid', req_id);

    avatarUrl_query.descending("updatedAt");
    avatarUrl_query.find()
      .then(function (info) {
        console.log("mask");
        //第一个覆盖
        info[0].set('url', app.globalData.userInfo.avatarUrl);

      }).catch(function (error) {
        console.log("need to add ");
        var avatarUrl = AV.Object.extend('avatarUrl');
        var col = new avatarUrl();
        console.log("bbb");
        var req_id = getApp().globalData.userInfo.nickName;
        col.set('userid', req_id);  // 用户既可以是需求提出者，也可以是响应者
        console.log("eee");
        //col.set('content', "太古里音乐喷泉");
        col.set('url', app.globalData.userInfo.avatarUrl);
        //Haiwei: 后面可以把提交图片的位置信息也带上，已经传过来，暂不存。
        //console.log(_this.data.uploadUrl);
        console.log("fff");

        col.save().then(function (success) {
          //wx.hideLoading();
          //另一个表存储成功提示，这里不提示
          //that.showPrompt('上传成功');
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
  // 清空收藏标记
  clearCollectionMarker: function () {
    markers = [
      locationMarker,
      selectedMarker,
    ];
    this.setData({
      markers: markers,
    });
  },
  //end: 列表功能】
  getCfg: function () {
    var that = this;

    var query = new AV.Query('Config');
    query.get('6dfdfdffdfdfdffdfdf89f54543').then(function (cfg) {
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

      //console.log(app.globalData.latitude_offset);
      // 下面是页面调用另一个app.js 的函数
      //app.getUserInfo();

      that.getUserInfo();

      //console.log(userInfo);

      console.log("eee");
      // todo 就是 id 为 57328ca079bc44005c2472d0 的 Todo 对象实例


      //判断当前用户是否在黑名单内，如果在黑名单内所有的功能都屏蔽

    }).catch(function (error) {
      // 异常处理

    });

  },
  preLoad: function () {
    var that = this;
    //如果权限没有，该功能无法功能
    if (app.globalData.userInfo == null) {
      //判断权限信息，如果没有
      wx.getSetting({
        success: (res) => {
          if (!res.authSetting["scope.userInfo"] || !res.authSetting["scope.userLocation"]) {
            that.openConfirm()
          }
        }
      })
    }

    //Haiwei:每次加载清空收藏标记
    //that.clearCollectionMarker();

    req_title_max = app.globalData.req_title_max;
    //req_content_max = app.globalData.req_content_max;


    //console.log("markers length");
    //console.log(markers.length);
    // 获取系统信息
    wx.getSystemInfo({
      success: function (res) {
        // 获取页面大小
        height = res.windowHeight;
        width = res.windowWidth;

        // 设置地图大小
        mapHeight = height * MAP_HEIGHT_SCALA;
        mapWidth = width * MAP_WIDTH_SCALA;
        console.log("kankan_commit get hight");
        console.log(mapHeight);

        that.setData({
          mapHeight: mapHeight + 'px',
          mapWidth: mapWidth + 'px'
        })
      }
    });

  },
  uploadfile: function () { //选择视频或者拍摄视频
    var _this = this;
    wx.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      camera: 'back',
      success: function (res) {
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
      fail: function (res) {
        console.log("视频上传失败");
        console.log(res);
        _this.showPrompt('添加视频失败，视频格式不对或者网络异常');
        
        
      }
    })

  },
  //重新选择视频
  againUploadBtn: function () {
    this.setData({
      videoSrc: "",
      condition: true,
      againBtn: false,
    })
  },
  ServiceViedoProc: function (center) {
    var that = this;

    //Haiwei: 这里上传采用leancloud 文件存储
    var share_id = getApp().globalData.userInfo.nickName;
    var file_name = "video_service_" + share_id;  //分享的视频和踩踩的视频前缀区分下

    var avFile = new AV.File(file_name, {
      blob: {
        uri: that.data.videoSrc,
      },
    });

    avFile.save().then(function (avFile) {
      console.log(avFile.url());
      var tmp_url = avFile.url();

      var share = AV.Object.extend('Service');
      var col = new share();
 
	  col.set('author', share_id);  // 用户既可以是需求提出者，也可以是响应者
      col.set('content', that.data.commit_info);
      col.set('url', tmp_url);
      //为了方便在share 表里面区分是视频还是图片，这里添加一个字段分析
      //视频imageNum 设置为0
      col.set('imageNum', 0);
      col.set('comment_num', 0);

      col.set('type', "video");
     
      //设置权限功能（可以完全免费，可以黑名单
      col.set('permission', 0);  //后续再上服务界面设置免费，有偿.0 免费，1 有偿。1 需要根据黑名单
      //设置白名单功能
      var baimingdan_tmp = [];
      col.set('baimingdan', JSON.stringify(baimingdan_tmp));

      if (proc_mode == 0) {
        // 新位置标签，应该是根节点
        col.set('isRoot', '0');
        //加载服务标签需要地理位置信息
        col.set('latitude', center.latitude);
        col.set('longitude', center.longitude);

      } else if (proc_mode == 1) {
        //
        col.set('isRoot', cur_marker.objectId);
        //加载服务标签需要地理位置信息
        col.set('latitude', cur_marker.latitude);
        col.set('longitude', cur_marker.longitude);
      }

      col.save().then(function (success) {
        //wx.hideLoading();
        that.showPrompt('上传成功');
        app.globalData.isSerAdd = true;
        if(proc_mode == 0)
        {
          markers.push({
            id: markers.length,
            title: _this.data.commit_info,
            iconPath: COLLECTION_MARKER_RES,
            latitude: center.latitude,
            longitude: center.longitude,
            width: mapWidth * 0.1,
            height: mapWidth * 0.1
          });
          that.setData({
            markers: markers,
          });

          that.setData({
            mapHidden: false,
          });
        }
  
      }, function (error) {
        // 添加失败
        //wx.hideLoading()
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
      url: '../kankan/kankan'
    })
    console.log("c");
  },
  //上传
  uploadBtn: function () {
    var that = this;
    collectContent = that.data.commit_info;

    // 输入校验
    if (!collectContent || collectContent.length == 0) {
      that.showPrompt('内容不能为空');
      return;
    }
    if (that.data.commit_info.length > req_title_max) {
      that.showPrompt('文字数目超过' + req_title_max);
      return;
    }

    if (!mapCtx) {
      that.showPrompt('还未定位成功');
      return;
    }

    if (that.data.videoSrc == "") {
      wx.showToast({
        title: '请上传视频',
        duration: 2000
      })
    } else {
      if(proc_mode == 0)
      {
        // 新建位置上传
        mapCtx.getCenterLocation({
          success: function (center) {
            // 以前响应文本框输入文字后，还点击了上传图片，时隙来的及，
            // 添加文本框获取的时候，如果执行这个确认，可能上面位置有效滞后导致后面执行不了。这里通过主动调用看是否可以。 代码放在下面
            //tst
            console.log("ceshi service video");
            //return;
            //end
            that.ServiceViedoProc(center);
          }
        })

      }else if(proc_mode == 1)
      {
        //已位置上传
        var center =0;
        that.ServiceViedoProc(center);

      }
    
    }
  },
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    var that = this;
    if (options.marker == 1) {
      console.log("新位置发起");
      proc_mode = 0;

      that.setData({
        mapHidden: false,
      })

    } else {
      console.log("继续发起");
      //为了方便查看用户头像，这里读取
      that.setData({
        mapHidden: true,
      })

      proc_mode = 1;


      cur_marker = JSON.parse(options.marker);
      console.log(cur_marker);
    }
    var that = this;
    commit_max = 0;
    //在主页面看看已经获取信息，这里不用重新在读取配置，再获取相关信息（getCfg,getUserInfo 函数保留，暂不用）
    that.preLoad();
    that.getLocation(); // 定位

  },
  onReady: function () {
    // 页面渲染完成
    //this.getLocation(); // 定位
    //this.showCollection(); // 显示收藏点
  },
  onShow: function () {
    // 页面显示
    req_title_max = app.globalData.req_title_max;
    //req_content_max = app.globalData.req_content_max;

    console.log("kankan service video onShow");
    //这里用户提交需求后会回到主页面，会调用onShow ，这会导致提示信息干扰
    //this.getResponseFromServer();
  },
  onHide: function () {
    // 页面隐藏
  },
  onUnload: function () {
    // 页面关闭
  },
  openConfirm: function () {
    //添加授权提示
    wx.showModal({
      content: '检测没有授权，需要登录、地理位置授权才能正常使用',
      confirmText: "确认",
      cancelText: "取消",
      success: function (res) {
        console.log(res);
        //点击“确认”时打开设置页面
        if (res.confirm) {
          console.log('用户点击确认')
          wx.openSetting({
            success: (res) => {
              //调用获取用户信息接口
              wx.getUserInfo({
                success: function (res) {
                  app.globalData.userInfo = res.userInfo
                  //Haiwei：
                  console.log(app.globalData.userInfo.nickName);
                  //end
                  //typeof cb == "function" && cb(that.globalData.userInfo)
                }
              })
              //调用获取地址信息



            }
          })
        } else {
          console.log('用户点击取消')
        }
      }
    });
  },
  getUserInfo: function (cb) {
    var that = this
    if (app.globalData.userInfo) {
      typeof cb == "function" && cb(app.globalData.userInfo)
    } else {
      //调用登录接口
      wx.login({
        success: function () {
          wx.getUserInfo({
            success: function (res) {
              app.globalData.userInfo = res.userInfo
              //Haiwei：
              console.log("get nickname");
              console.log(app.globalData.userInfo.nickName);
              //异步处理成功后，才执行后面
              that.preLoad();
              console.log("kankan_commit");
              that.getLocation(); // 定位


              //end
              //typeof cb == "function" && cb(app.globalData.userInfo)
            }
          })
        }
      })
    }
  }
})