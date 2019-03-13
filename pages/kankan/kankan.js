// pages/kankan/kankan.js
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
var MAP_HEIGHT_SCALA = 1; // 高度占总高度比例
var MAP_WIDTH_SCALA = 1; // 宽度占总宽度比例

var CENTER_CONTROL_ID = 1; // 中心控件ID
var centerControl = { id: CENTER_CONTROL_ID, }; // 中心控件
var CENTER_CONTROL_RES = '/res/selected.png'; // 中心控件图标

//地图布局一个控件，用于上传图片，而主页面只用于查看自身提的需求是否又被响应。下面通过一个控件提示是否提需求
var KANKAN_CONTROL_ID = 2; // 中心控件ID
var kankanControl = { id: KANKAN_CONTROL_ID, }; // 中心控件
var KANKAN_CONTROL_RES = '/images/ic_add.png'; // 中心控件图标

//如果响应的就是亮色，如果没有响应是
//var KANKAN_ACK_RES = '/images/like-red.png'; 
var KANKAN_ACK_RES = '/res/collection.png';
var KANKAN_NOACK_RES = '/images/ico-dizhi.png';

var SERVICE_RES = '/res/marker_sprite.png';
var SERVICE_ACK_RES = '/res/marker_sprite.png';

//切换标志，需求和服务标签
var REQ_TAB_RES = '/res/xuqiu.png';
var REQ_TAB_SEL_RES = '/res/fuwu.png';
var req_switch_cnt =0;// 偶数表示有； 奇数表示过滤
var req_markers = [];

var SER_TAB_RES = '/res/fuwu.png';
var SER_TAB_SEL_RES = '/res/fuwu.png';
var ser_switch_cnt = 0;// 偶数表示有； 奇数表示过滤
var ser_markers = [];

var LOCATION_TYPE = 'gcj02'; // 定位类型，gcj02 返回可用于地图的坐标，wgs84 返回 gps 坐标
var DEFAULT_SCALA = 12; // 默认缩放，范围5-18
//var DEFAULT_SCALA = 5; // 默认缩放，范围5-18

var location = {}; // 定位坐标
var LOCATION_MARKER_ID = 0; // 定位点ID
var locationMarker = { id: LOCATION_MARKER_ID }; // 定位标记
var LOCATION_MARKER_RES = '/res/location.png'; // 定位标记图标

var SELECTED_MARKER_ID = 1; // 选取点ID
var selectedMarker = { id: SELECTED_MARKER_ID, }; // 选取标记

var selected_marker; // Haiwei: 记录当前选中的marker ，传递到其它页面信息处理
var selected_marker_id = -1; // 记录已经提交的marker id,做删除使用

// 添加收藏对话框
var collectTitle; // 标题
var collectType; // 类型
var collectContent; // 内容

var COLLECTION_MARKER_RES = '/res/collection.png'; // 收藏标记图标

var search; // 搜索框文本

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

var cur_index;//Haiwei: 下载一批响应信息后，定位现在是第几个
var cur_down_cnt; //Haiwei: 当前点击按钮能够下载最大数目
var perpage = 8;
var last_down_num =0;//Haiwei: 避免网络带宽，如果第二次查询数目和上一次一样，就不用下载了，同时给出提示
var flag_not_change =0;//Haiwei 0 表示有刷新，1表示没有刷新
var flag_last_finish =0;//Haiwei: 1 表示上一次已经完成，需要从服务器重新
var last_index=0;//Haiwei:分享的图片显示，可以采用简单算法，记录上次下载位置，从上次下载位置继续下载
var kankan_max_down =128;

var m_finish_cnt =0;
var index_max;
var wait_down_over =0;

//Haiwei: 考虑该小程序就是定制拍摄需求，故描述需要详细，给150
var req_title_max =150 ;
//var req_content_max =50;

var isPass = 0 ; // 表示是否逻辑正常走过，没有走过，onshow 再执行下
var isOnloadPass = 0;//没有使用：为避免onshow 和onload 同时发起查表反而导致拥塞，这里等onload 完成才执行ons



//如果成功提示，交互感不好，可以onshow 执行两次后再
var onshow_cnt =  0;

Page({
  data: {
    //cur_user:"",
    scrolltop: null, //滚动位置
    servicelist: [], //服务列表
    page: 0,//分页
    imageUrl: "/res/logo.jpeg",   //预览图像信息
    downUrl:'',//服务器单个url
    downGrpUrl:[],// 服务器一批列表
    collectModalHidden: true, // 添加收藏对话框隐藏
    collectionModalHidden: true, // 收藏信息对话框隐藏
    mapHidden:false,
    value: '' ,// 输入框清空
    showModel:false
 
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
        //that.addCenterControl(); // 添加中心控件
         
        that.showCollection();
        that.showServiceMarker();
        that.addKankanControl();
        that.addReqControl();
        //that.addSerControl();
    
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
        that.showPrompt('地理位置权限没有允许，请参考"我的"页面关注我们的最后小结提供的方法解决');
       
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
  onControltap: function (e) {
    var that =this;

    if (app.globalData.blackuser == "blackblack") {
      //当前用户在黑名单里面，不能有任何操作
      console.log("当前系统升级，请稍后再使用");
      that.showPrompt('当前系统升级，请稍后再使用');
      return;
    }

    //黑名单功能
    if (app.globalData.isBlack == 1) {
      //当前用户在黑名单里面，不能有任何操作
      console.log("you are forbiddden");
      that.showPrompt('识别你进入黑名单，需要解锁');
      return;
    }

    //地图添加控件
    console.log(" 已点击控件");
    console.log(e.controlId);
    //TBD: 后面左上角添加一个控件可以选择需求还是服务
    if (req_switch_cnt == 0) {
      that.pushCollectionMarker();
    } else {
      that.pushServiceMarker();
    }

    //地图的控件可以控制添加需求，添加图片服务，添加视频服务
    if (e.controlId == 0) {
      //响应控件

      if(req_switch_cnt == 0)
      {
        //需求
        that.onCollectTap();
      }else
      {
        //服务
        //添加支持图片和视频方式：
        //Hawiwei: 增加图片和视频选择方式
        wx.showActionSheet({
          itemList: ['新建位置-图片', '新建位置-视频','选定位置-图片','选定位置-视频'],
          success: function (res) {
            console.log(res.tapIndex)
            if (res.tapIndex == 0) {
              //切换到上传
              //Haiwei: 这里同一个js 处理不同页面的处理逻辑，根据传参来区分
              wx.navigateTo({
                url: '../k_service_img/k_service_img?marker=' + JSON.stringify(1),
              })

            } else if (res.tapIndex == 1) {
              //切换到上传视频，这里和踩踩响应视频可以共用一个页面，根据是否待信息来区分（设固定1 表示分享页面过来的）
              
              wx.navigateTo({
                url: '../k_service_video/k_service_video?marker=' + JSON.stringify(1),
              })
            } else if (res.tapIndex == 2)
            {
              if (selected_marker_id == -1) 
              {
                that.showPrompt('请先选择位置标记，再继续发布信息');
                return;
              }
            
              wx.navigateTo({
                url: '../k_service_img/k_service_img?marker=' + JSON.stringify(selected_marker),
                //url: '../w_service/w_service?marker=' + JSON.stringify(marker),
              })

            } else if (res.tapIndex == 3)
            {
              if (selected_marker_id == -1) {
                that.showPrompt('请先选择位置标记，再继续发布信息');
                return;
              }

              wx.navigateTo({
                url: '../k_service_video/k_service_video?marker=' + JSON.stringify(selected_marker),
              })

            }
          },
          fail: function (res) {
            console.log(res.errMsg)
          }
        })
      }
        
    } else if (e.controlId == 1)
    {
      //切换页面需要选中重新归零
      selected_marker_id = -1;
      if(req_switch_cnt == 0)
      {
        //过滤
        that.addReqSelControl();
        req_switch_cnt = 1;
        that.pushServiceMarker();
      
      } else if (req_switch_cnt == 1)
      {
        that.addReqControl();
        req_switch_cnt = 0;
        that.pushCollectionMarker();

      }
     
    } else if (e.controlId == 2)
    {
      //暂时没有用这个控件
      if(ser_switch_cnt == 0)
      {
        that.addSerSelControl();
        ser_switch_cnt = 1;
        if(req_switch_cnt ==  0)
        {
          that.setData({
            markers: req_markers,
          });

        }else
        {
          that.setData({
            markers: [locationMarker, selectedMarker],
          });
        }
        
      } else if (ser_switch_cnt == 1)
      {
        that.addSerControl();
        ser_switch_cnt = 0;
        if(req_switch_cnt == 0)
        {
          that.setData({
            markers: req_markers.concat(ser_markers),
          });

        }else
        {
          that.setData({
            markers:ser_markers,
          });

        }
       

      }
      

    }
  },
  // 添加地图中心控件
  addKankanControl: function () {
    centerControl = {
      id: 0,
      iconPath: KANKAN_CONTROL_RES,
      position: {
        left: mapWidth / 2 - 25, //控件大小50*50
        top: mapHeight*7/8 ,//top: mapHeight * 28 / 32,
        width: 50,//width: mapWidth * 0.15,
        height: 50//height: mapWidth * 0.15
      }, // 根据地图宽高和图片尺寸计算位置
      clickable: true
    }
    // 前面控件不加载，后面赋值会出错。这里定位查看需求功能，就不用当前位置信息。id 就用0
    controls[0] = centerControl;
    this.setData({
      controls: controls,
    })
  }, 
  // 添加需求标签控件
  addReqControl: function () {
    centerControl = {
      id: 1,
      iconPath: REQ_TAB_RES,
      position: {
        left: mapWidth / 2 -25, //控件大小50*50
        top: 10,//top: mapHeight * 28 / 32,
        width: 50,//width: mapWidth * 0.15,
        height: 25//height: mapWidth * 0.15
      }, // 根据地图宽高和图片尺寸计算位置
      clickable: true
    }
    // 前面控件不加载，后面赋值会出错。这里定位查看需求功能，就不用当前位置信息。id 就用0
    controls[1] = centerControl;
    this.setData({
      controls: controls,
    })
  },
  // 添加需求标签控件
  addReqSelControl: function () {
    centerControl = {
      id: 1,
      iconPath: REQ_TAB_SEL_RES,
      position: {
        left: mapWidth / 2 - 25, //控件大小50*50
        top: 10,//top: mapHeight * 28 / 32,
        width: 50,//width: mapWidth * 0.15,
        height: 25//height: mapWidth * 0.15
      }, // 根据地图宽高和图片尺寸计算位置
      clickable: true
    }
    // 前面控件不加载，后面赋值会出错。这里定位查看需求功能，就不用当前位置信息。id 就用0
    controls[1] = centerControl;
    this.setData({
      controls: controls,
    })
  },
  // 添加服务标签控件
  addSerSelControl: function () {
    centerControl = {
      id: 2,
      iconPath: SER_TAB_SEL_RES,
      position: {
        left: mapWidth / 2 + 75, //控件大小50*50
        top: 10,//top: mapHeight * 28 / 32,
        width: 50,//width: mapWidth * 0.15,
        height: 50//height: mapWidth * 0.15
      }, // 根据地图宽高和图片尺寸计算位置
      clickable: true
    }
    // 前面控件不加载，后面赋值会出错。这里定位查看需求功能，就不用当前位置信息。id 就用0
    controls[2] = centerControl;
    this.setData({
      controls: controls,
    })
  },
  // 添加服务标签控件
  addSerControl: function () {
    centerControl = {
      id: 2,
      iconPath: SER_TAB_RES,
      position: {
        left: mapWidth / 2 +75, //控件大小50*50
        top: 10,//top: mapHeight * 28 / 32,
        width: 50,//width: mapWidth * 0.15,
        height: 50//height: mapWidth * 0.15
      }, // 根据地图宽高和图片尺寸计算位置
      clickable: true
    }
    // 前面控件不加载，后面赋值会出错。这里定位查看需求功能，就不用当前位置信息。id 就用0
    controls[2] = centerControl;
    this.setData({
      controls: controls,
    })
  },
  // 加载服务标记，可以对服务标记基线添加服务（有点像地理微博了）
  showServiceMarker: function () {
    var that = this;
    if (getApp().globalData.userInfo == null) {
      return;
    }
    console.log(getApp().globalData.userInfo);
    var cur_user = getApp().globalData.userInfo.nickName;
    console.log("query b");

    if (cur_user == null) {
      return;
    }

    //查询服务表项  
    var req_table = "Service";
   
    var query_author = new AV.Query(req_table);
    query_author.equalTo('author', cur_user);
    //判断根节点信息：这里信息复用，如果是0，就表示根节点。如果objectID 就是子节点，存放父节点信息
    var query_root = new AV.Query(req_table);
    query_root.equalTo('isRoot', '0');

    var query = new AV.Query(req_table);
    query = AV.Query.and(query_author, query_root);

  
    query.find()
      .then(function (data) {
        // 查询成功
        console.log("query success");
        that.addServiceMarker(data);
      }).catch(function (error) {
        // 查询失败
        console.log("query fail");
        console.error('Failed to save in LeanCloud:' + error.message);
        //that.showPrompt('加载收藏失败');
      });
  },
  // 加载收藏标记: 用户提交需求管理是比较基本的功能，需要完善
  showCollection: function () {
    var that = this;
    if (getApp().globalData.userInfo == null)
    {
      return;
    }
    console.log(getApp().globalData.userInfo);
    var cur_user = getApp().globalData.userInfo.nickName;
    console.log("query b");

    if(cur_user == null)
    {
      return;
    }
    //Haiwei: 根据当前位置纬度信息，查询对应的表格
    if (app.globalData.scale_mode == 0) {
      var req_table = "Collection";

    } else {
      //TBD:　按照不同表格，后期采用遍历的方式, 不然其它位置信息看不到
      var index = Math.floor(curLocationLatitude);
      //console.log(index)；
      var req_table = "Collection" + index;
    }

    var query = new AV.Query(req_table);
    query.equalTo('userid', cur_user);
  
    query.find()
      .then(function (data) {
        // 查询成功
        console.log("query success");
        that.addCollectionMarker(data);
      }).catch(function (error) {
        // 查询失败
        console.log("query fail");
        console.error('Failed to save in LeanCloud:' + error.message);
        //that.showPrompt('加载收藏失败');
      });
  },
  // 地图非标记点点击事件
  onMapTap: function (e) {
    //因为看看主页面主要定位是查看需求部分，不用于选择地理位置，则这里关闭选择定位部分
    if(0)
    {
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
          // 选取完成
        }
      })
      
    }
    
  },

  // 标记点点击事件
  onMarkerTap: function (e) {
    // 定位标记
    //console.log(this.data.markers);
    if (0) {
      //前期marker的前两个id ，一个是当前，一个是选择的位置
      wx.showToast({
        title: '当前定位',
        icon: 'success',
      });
    } else if (0) {
      // 选取标记
      wx.showToast({
        title: '选取位置',
        icon: 'success',
      });
    } else {
      // 第一版本设计的时候，是点击marker ，通过modal 控件的方式显示提的需求
      // 第二版本根据标记的颜色（响应的表示另一个颜色），这样可以选中看其响应的详细信息，待添加
      selected_marker_id = e.markerId
      // 收藏标记
      selected_marker = this.data.markers[e.markerId];
      
      console.log(e.markerId);
     

      var collection = {
        title: selected_marker.title,
        type: selected_marker.type,
        content: selected_marker.content,
      };
       
      if (selected_marker.tap == 0)
      {
        //需求标签处理
         //V2.0 基线版本响应的颜色直接跳转到页面可以看响应情况，如果没有响应的可以保留以前设计，这里不弹出控件，直接在图片上面显示文字就可以
        if (selected_marker.iconPath == KANKAN_ACK_RES) {
           console.log("have a look");

           // 第二版本处理：切换到别人响应的页面
           wx.navigateTo({
             url: '../kankan_ack/kankan_ack?marker=' + JSON.stringify(selected_marker),
             //url: '../response/response',
           });

         }

      } else if (selected_marker.tap == 1)
      {
        //服务标签处理
        console.log("服务标签处理");
        //并发点击就继续发布，允许查看
        if(0)
        {
          //这里看看，可以不用看自己的发布的，在踩踩留有口子就可以了。这里主要用于是否在原有地址标签是否继续发布

          wx.showActionSheet({
            itemList: ['当前位置继续发布图片服务', '当前位置继续发布视频服务'],
            success: function (res) {
              console.log(res.tapIndex)
              if (res.tapIndex == 0) {
                //切换到上传页面
                //Haiwei: 切换页面，如果是数组，需要用JSON 先转换成字符串
                
                //对于标签下基线发布的，
                wx.navigateTo({
                  url: '../k_service_img/k_service_img?marker=' + JSON.stringify(selected_marker),
                  //url: '../w_service/w_service?marker=' + JSON.stringify(marker),
                })

              } else if (res.tapIndex == 1) {
                //切换到上传视频，这里和踩踩响应视频可以共用一个页面，根据是否待信息来区分（设固定1 表示分享页面过来的）
                
                wx.navigateTo({
                  url: '../k_service_video/k_service_video?marker=' + JSON.stringify(selected_marker),
                })

              }
            },
            fail: function (res) {
              console.log(res.errMsg)
            }
          })

        }
        
      }
      
    }
  },
  // 第一版本： 看看按钮回调函数，这里可以作为第二个
  onCollectTap: function () {

    if (app.globalData.blackuser == "blackblack") {
      //当前用户在黑名单里面，不能有任何操作
      console.log("当前系统升级，请稍后再使用");
      this.showPrompt('当前系统升级，请稍后再使用');
      return;
    }

    //黑名单功能
    if (app.globalData.isBlack == 1) {
      //当前用户在黑名单里面，不能有任何操作
      console.log("you are forbiddden");
      this.showPrompt('识别你进入黑名单，需要解锁');
      return;
    }
   
    if (!mapCtx) {
      this.showPrompt('还未定位成功，网络故障或者地理权限没有允许');
      //Haiwei: 添加定位
      this.getLocation(); // 定位
      return;
    }
    if (0)
    {
      //第一版本通过弹出对话框处理，不方便用户描述文字，第二版本修改通过页面方式。 
      this.setData({
        //Haiwei: 设置
        collectModalHidden: false,
        mapHidden: true
      });
    }
    

    // 第二版本处理：切换到详细提交文字页面
    wx.navigateTo({
      url: '../kankan_commit/kankan_commit',
     // url: '../response/response',
    });
   
    //Haiwei: 当前版本提前需求就用标题就可以，不用再写内容，下面不用
  
  },
  
  // 点击取消添加收藏事件
  onCancelCollectTap: function () {
    //隐藏添加收藏对话框
    this.setData({
      collectModalHidden: true,
      mapHidden:false,
      value: '', // 清空输入框内容
    });
  },

  // 将收藏点添加到标记中
  addServiceMarker: function (colFromCloud) {
    for (var i = 0; i < colFromCloud.length; ++i) {
      if(0)
      {
        //需要判断，如果支付了，其它颜色
        var ack_icon = KANKAN_NOACK_RES;
        //前期如果用户多次响应，发现ack 异步设置会紊乱，如果不是0，都可以读取

        //if (colFromCloud[i].get('ack') > 0 )
        if (colFromCloud[i].get('ack') != 0) {
          ack_icon = KANKAN_ACK_RES;
        }
      }else
      {
        var ack_icon = SERVICE_RES;
      }
     
      // 这里服务和需求标记是分开的
      ser_markers.push({
        id: ser_markers.length,
        title: colFromCloud[i].get('content'),
        iconPath: ack_icon,
        latitude: colFromCloud[i].get('latitude'),
        longitude: colFromCloud[i].get('longitude'),
        width: mapWidth * 0.1,
        height: mapWidth * 0.1,
        type: colFromCloud[i].get('type'),
        content: colFromCloud[i].get('content'),
        tap:1,//表示服务标签
        objectId: colFromCloud[i].get('objectId')  //服务标签可能继续添加，这里添加objectid作为父节点
      });
    }
    //读成功重置
      

 
    
  },
  pushServiceMarker: function () {
    this.setData({
      markers: ser_markers,
    });
   
    console.log(" ser markers set");
    //console.log(this.data.markers);

  },
  // 将收藏点添加到标记中
  addCollectionMarker: function (colFromCloud) {
    for (var i = 0; i < colFromCloud.length; ++i) {
      //需要判断，如果没有响应就是红色，如果有响应就是另一个颜色
      var ack_icon = KANKAN_NOACK_RES;
      //前期如果用户多次响应，发现ack 异步设置会紊乱，如果不是0，都可以读取

      //if (colFromCloud[i].get('ack') > 0 )
      if (colFromCloud[i].get('ack') != 0)
      {
        ack_icon = KANKAN_ACK_RES;
      }      


      // 添加标记
      req_markers.push({
        id: req_markers.length,
        title: colFromCloud[i].get('title'),
        iconPath: ack_icon,
        latitude: colFromCloud[i].get('latitude'),
        longitude: colFromCloud[i].get('longitude'),
        width: mapWidth * 0.1,
        height: mapWidth * 0.1,
        type: colFromCloud[i].get('type'),
        content: colFromCloud[i].get('content'),
        tap:0,//需求标签
        author: colFromCloud[i].get('userid')
      });
    }
   // req_markers = markers;
    isPass = 1;
  

    if(req_switch_cnt == 0)
    {
      this.pushCollectionMarker();
    }
   
  },
  pushCollectionMarker: function () {
    this.setData({
      markers: req_markers,
    });
    console.log(" req markers set");
    //console.log(this.data.markers)
    

  },
  // 清空收藏标记
  clearCollectionMarker: function () {
    console.log("clearCollectionMarker");
    markers = [
      locationMarker,
      selectedMarker,
    ];
    this.setData({
      markers: markers,
    });
  },
  //end: 列表功能】
  //----看看和踩踩功能合一,这里添加踩踩的代码（响应刷新和查看刷新)
  //---end
  getCfg: function () {
    var that = this;

    var query = new AV.Query('Config');
    query.get('6dfdfdffdfdfdffdfdf89f54543').then(function (cfg) {
   // query.notEqualTo('scale_mode',8);
   // query.find().then(function (cfg) {
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
      //老版本wx.getUserInfo暂关闭
      //that.getUserInfo();
      
    }).catch(function (error) {
      // 异常处理
      wx.showToast({
        title: '系统提示:网络错误',
        icon: 'warn',
        duration: 1500,
      })
      console.log(" config search error ");

      //that.getCfg();

    });
  
  },
  login_wx: function () {
    var that =this;
    // 登录
    wx.login({
      success: res => {
        //app.globalData.code = res.code
        //取出本地存储用户信息，解决需要每次进入小程序弹框获取用户信息
        app.globalData.userInfo = wx.getStorageSync('userInfo')
        //wx.getuserinfo接口不再支持
        wx.getSetting({
          success: (res) => {
            //判断用户已经授权。不需要弹框

            if (!res.authSetting['scope.userInfo']) {
              //没有授权
              that.setData({
                showModel: true
              })
              console.log("get nickname A");


            } else {//有授权
              console.log("get nickname C");
              console.log(app.globalData.userInfo);
              that.setData({
                showModel: false
              })

              if (0) {
                wx.showLoading({
                  title: '加载中...'
                })

              }

              that.getOP(app.globalData.userInfo)
            }
          },
          fail: function () {
            wx.showToast({
              title: '系统提示:网络错误',
              icon: 'warn',
              duration: 1500,
            })
          }
        })
      },
      fail: function () {
        wx.showToast({
          title: '系统提示:网络错误',
          icon: 'warn',
          duration: 1500,
        })
      }
    })

    //console.log(userInfo);

    console.log("eee");
      // todo 就是 id 为 57328ca079bc44005c2472d0 的 Todo 对象实例


      //判断当前用户是否在黑名单内，如果在黑名单内所有的功能都屏蔽


  },

  preLoad: function() {
    var that = this;
    //如果权限没有，该功能无法功能
    if(app.globalData.userInfo) {
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
    that.clearCollectionMarker();
    cur_index = 0;
    last_index = 0;
    m_finish_cnt = 0;
    req_title_max = app.globalData.req_title_max;
    //req_content_max = app.globalData.req_content_max;
    perpage = app.globalData.kankan_perpage;
    kankan_max_down = app.globalData.kankan_max_down;

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
        that.setData({
          mapHeight: mapHeight + 'px',
          mapWidth: mapWidth + 'px'
        })
      }
    });

  },
  getGuanggao: function () {
    var that = this;
    //为了避免频繁的交互提示，这里图像列表到最后后，可以通过插入广告图片来告知结束
    //https://leancloud.cn/docs/leanstorage_guide-js.html#hash-1971670686
    var guanggao_query = new AV.Query('Share');
    var cur_user = getApp().globalData.userInfo.nickName;
    //query.startsWith('content','广告');
    console.log(cur_user);
    //query.equalTo('content', '广告');
    //guanggao_query.equalTo('author', cur_user);
    guanggao_query.equalTo('content', '[广告]');

    guanggao_query.find()
      .then(function (data) {
        //**： bug ，紧跟着添加打印信息都会执行。且不匹配后面访问不执行
        console.log(data[0].get('content'));
        console.log(data[0].get('url'));
        console.log("get guanggaao");
        wx.downloadFile({
          url: data[0].get('url'),
          type: 'image',
          success: function (res) {
            // 这里是异步的，故局部变量值完全不定，需要检
            console.log("get guangguang suce");

            var filePath = res.tempFilePath;
            getApp().globalData.guanggao_url = filePath;
            console.log(getApp().globalData.guanggao_url);
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
    //


  },
  //获取用户信息新接口
  agreeGetUser:function (e) {
    //设置用户信息本地存储
    try {
      wx.setStorageSync('userInfo', e.detail.userInfo)
    } catch (e) {
      wx.showToast({
        title: '系统提示:网络错误',
        icon: 'warn',
        duration: 1500,
      })
    }
    wx.showLoading({
      title: '加载中...'
    })
    let that = this
    that.setData({
      showModel: false
    })
    //
    //app.globalData.userInfo = e.detail.userInfo;
   

    that.getOP(e.detail.userInfo)
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

    var req_id = app.globalData.userInfo.nickName;

    //这里已经定义了一个表，故先查询再覆盖。
    var avatarUrl_query = new AV.Query('avatarUrl');

    avatarUrl_query.equalTo('userid', req_id);

    avatarUrl_query.descending("updatedAt");
    avatarUrl_query.find()
      .then(function (info) {
        console.log("mask");
        //第一个覆盖
        console.log(app.globalData.userInfo.avatarUrl);
        info[0].set('url', app.globalData.userInfo.avatarUrl);
        console.log("save avatarUrl success old");
        info[0].save();

      }).catch(function (error) {
        console.log("need to add ");
        var avatarUrl = AV.Object.extend('avatarUrl');
        var col = new avatarUrl();
        console.log("bbb");
        var req_id = getApp().globalData.userInfo.nickName;
        col.set('userid', req_id);  // 用户既可以是需求提出者，也可以是响应者
        console.log(app.globalData.userInfo.avatarUrl);
        //col.set('content', "太古里音乐喷泉");
        col.set('url', app.globalData.userInfo.avatarUrl);
        //Haiwei: 后面可以把提交图片的位置信息也带上，已经传过来，暂不存。
        //console.log(_this.data.uploadUrl);
        console.log("fff");

        col.save().then(function (success) {
          console.log("save avatarUrl success new ");
          
          //wx.hideLoading();
          //另一个表存储成功提示，这里不提示
          //that.showPrompt('上传成功');
          //end

        }, function (error) {
          // 添加失败
          //wx.hideLoading();
          console.error('Failed to save in LeanCloud:' + error.message);
          // _this.showPrompt('添加失败');
          //that.showPrompt('上传失败，可能网络异常，稍后重试');
        });


      });
    //end
  },
  getOP: function (res) {//提交用户信息 获取用户id
    let that = this
    let userInfo = res
    wx.hideLoading();
    app.globalData.userInfo = userInfo;
    console.log(app.globalData.userInfo);
    console.log("get nickname B");
    //这里是程序的入口，将用户头像信息存放，方便其它位置查表使用
    that.saveUserAvatarUrl();
    //
    console.log(app.globalData.userInfo);
    //异步处理成功后，才执行后面
    that.getGuanggao();
    that.preLoad();

    that.getLocation(); // 定位
    that.isCurUserIsblack();
   

  },
  isCurUserIsblack:function() {
    var that = this;
    //if (app.globalData.blackuser != "blackblack") {
    if (1) {
      console.log("isCurUserIsblack");
      var black_bquery = new AV.Query('blackid');
      console.log("CCC");
      console.log(app.globalData.userInfo.nickName);
      //下面测试，多几下异常
      //query.equalTo('name', app.globalData.userInfo.nickName);
      black_bquery.equalTo('name', app.globalData.userInfo.nickName);
      black_bquery.find()
        .then(function (data) {
          var blackname = data[0].get('name');
          console.log(blackname);

          //当前用户在黑名单内，屏蔽其所有功能
          app.globalData.isBlack = 1;

          console.log("FDDD");

        }).catch(function (error) {
          app.globalData.isBlack = 0;
          console.log(" no curquery black response");
          // 查询失败
          //console.error('Failed to save in LeanCloud:' + error.message);
          //that.showPrompt('加载失败');
        });


    }

  },
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    var that = this;
    isPass = 0;
    onshow_cnt = 0;
    
    req_switch_cnt = 0;
    ser_switch_cnt = 0;
    req_markers = [];
    ser_markers = [];

    that.getCfg();
    that.login_wx();

    isOnloadPass = 1;
  
  },
  onReady: function () {
    console.log("onReady");
    // 页面渲染完成
    //this.getLocation(); // 定位
    //this.showCollection(); // 显示收藏点
  },
  onShow: function () {

    var that = this;

    wx.getSetting({
      success: (res) => {
        if (!res.authSetting["scope.userInfo"] || !res.authSetting["scope.userLocation"]) {

          //that.showPrompt('小程序功能依赖用户昵称和地理位置信息，如果初次登录权限没有允许，则不能正常使用。请参考"我的"页面关注我们的最后小结提供的方法解决');
    
        }
      }
    })

    //这里增加交互性，及时显示用户自身提交的需求，这里用户有提交就调用一次
  
    if (app.globalData.isReqAdd == true)
    {
        that.showCollection();
        app.globalData.isReqAdd = false;
    }
    //
    if (app.globalData.isSerAdd == true) {
      //用户有提交的操作，重新读取marker. 异步可能第一次返回将
      //console.log(" 重新读取service");
      that.showServiceMarker();
      app.globalData.isSerAdd = false;
      //这里考虑发布

    }


    if (isPass == 0)
    {
      if (onshow_cnt >= 1)
      {
        //onLoad 没有成功,才执行，如果同时执行，反而会拥塞
        that.getCfg();
        that.showCollection();
        that.showServiceMarker();

        // 页面显示
        req_title_max = app.globalData.req_title_max;
        //req_content_max = app.globalData.req_content_max;
        perpage = app.globalData.kankan_perpage;
        kankan_max_down = app.globalData.kankan_max_down;
      }
      
      console.log("onShow");
      onshow_cnt++;
      if (onshow_cnt >= 2)
      {
        that.showPrompt('该页面如果没有加载标记，则网络暂时有些拥塞，请稍安勿躁到其它页面先看看再返回');
      }
      
      //如果网络拥塞，提示下
     
    //这里用户提交需求后会回到主页面，会调用onShow ，这会导致提示信息干扰
    //this.getResponseFromServer();

    }
    //我的页面删除时，触发刷新，不然逻辑会出现紊乱
    if (app.globalData.isSerUpdateKankan ==  true)
    {
      console.log("删除发布设置标志后响应");
      //这里删除完全影响逻辑，添加新需求标签或者新发布标签，如果没及时看到，逻辑还不会出错。如果删除补鞥呢及时，则处理逻辑会紊乱。
      //下面因为查询需要异步，故可能切换回看不到，点击下又可以了
      ser_markers = [];
      that.showServiceMarker();
      that.pushServiceMarker();
      app.globalData.isSerUpdateKankan = false;

    }
    if (app.globalData.isReqUpdateKankan == true)
    {
      req_markers = [];
      that.showCollection();
      that.pushCollectionMarker();
      app.globalData.isReqUpdateKankan =false;
    }

    if (req_switch_cnt == 0) {
      that.pushCollectionMarker();
    } else {
      that.pushServiceMarker();
    }
    
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
          wx.openSetting ({
            success: (res) => { 

              if(0)
              {
                //调用获取用户信息接口
                wx.getUserInfo({
                  success: function (res) {
                    app.globalData.userInfo = res.userInfo
                    //Haiwei：
                    console.log(app.globalData.userInfo.nickName);
                    //异步处理成功后，才执行后面
                    that.getGuanggao();
                    that.preLoad();

                    that.getLocation(); // 定位
                    //end
                    //typeof cb == "function" && cb(that.globalData.userInfo)
                  }
                })

              }else
              {
                that.setData({
                  showModel: true
                })
              }
              
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
    var that = this;
    if (0) {
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
              that.getGuanggao();
              that.preLoad();
              
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