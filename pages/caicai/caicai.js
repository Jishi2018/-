//Haiwei: 主要处理响应逻辑

// pages/map/map.js
// 获取应用实例
var app = getApp();
//Haiwei: 先用本地数据调试
var fileData = require('../../utils/data.js')

// 获取LeanCloud对象
const AV = require('../../libs/av-weapp.js');

//Haiwei: 添加地图大小控制相关信息， 下面信息在map1.js用到，这里调整图像大小在map2.wxss 设置
var height; // 屏幕高度，在onLoad中获取
var width; // 屏幕宽度，在onLoad中获取

var mapCtx; // 地图上下文，用于获取或设置中心坐标，在定位成功后初始化

var mapHeight; // 地图控件高度，在onLoad获取页面高度后计算
var mapWidth; // 地图控件宽度，在onLoad获取页面宽度后计算
//var MAP_HEIGHT_SCALA = 0.8; // 高度占总高度比例
//Haiwei: 减小图形高度，添加上传图像按钮（已验证可以通过这个修改）
var MAP_HEIGHT_SCALA = 1; // 高度占总高度比例
var MAP_WIDTH_SCALA = 1; // 宽度占总宽度比例

var curLocationLatitude    // 当前经度

var curLocationlongitude  //当前维度
//end

var LOCATION_TYPE = 'gcj02'; // 定位类型，gcj02 返回可用于地图的坐标，wgs84 返回 gps 坐标
//var DEFAULT_SCALA = 16; // 默认缩放，范围5-18
var DEFAULT_SCALA = 12; // 默认缩放，范围5-18
//var DEFAULT_SCALA = 9; // 默认缩放，范围5-18

var location = {}; // 定位坐标
var LOCATION_MARKER_ID = 0; // 定位点ID
var locationMarker = { id: LOCATION_MARKER_ID }; // 定位标记
var LOCATION_MARKER_RES = '/res/location.png'; // 定位标记图标

var selected; // 选取坐标
var SELECTED_MARKER_ID = 1; // 选取点ID
var selectedMarker = { id: SELECTED_MARKER_ID, }; // 选取标记
var SELECTED_MARKER_RES = '/res/selected.png'; // 选取标记图标

//切换标志，需求和服务标签
var REQ_TAB_RES = '/res/xuqiu.png';
var REQ_TAB_SEL_RES = '/res/fuwu.png';
var req_switch_cnt = 0;// 在看看页面0 表示看到自己需求
var req_markers = [];

var ser_markers = [];

// 添加收藏对话框
var collectTitle; // 标题
var collectType; // 类型
var collectContent; // 内容


var COLLECTION_MARKER_RES = '/res/ico-dizhi.png'; // 收藏标记图标
//var COLLECTION_MARKER_RES = '/res/collection.png'; // 收藏标记图标
var HAVE_RESPOND_MARKER_RES = '/res/respond_marker.png'; 

var search; //搜索框文本

var marker_mode = 1;
var longitude_offset = 0.1;
var latitude_offset = 0.1;


var selected_marker; // Haiwei: 记录当前选中的marker ，传递到其它页面信息处理
var selected_marker_id = -1; // 记录已经提交的marker id,做删除使用


//Haiwei: 缺省组件有些缺省成员信息，不用定义


//Haiwei : 添加地图中心控件
var CENTER_CONTROL_ID = 1; // 中心控件ID
var centerControl = { id: CENTER_CONTROL_ID, }; // 中心控件
var CAICAI_CONTROL_RES='../../images/xiangji1fill.png';
var controls = [
  // 中心控件
  centerControl,
]; // 地图控件

var isPass = 0;
var onshow_cnt =0;

//为了较为方便显示看看（包括其它用户）提交的需求和发布，这里用周期处理（3次切换到踩踩页面就刷新）
var timer_cnt = 0;

Page({
  data: {
    imgs:[],  //Haiwei: 定位存放图像的变量
    imageList:[],//Haiwei:预览
    uploadUrl:'', //响应者上传图像记录变量
    collectModalHidden: true, // 添加收藏对话框隐藏
    collectionModalHidden: true, // 收藏信息对话框隐藏
    mapHidden:false,
    value: '', // 输入框清空
    preInfo:''
  },

  // 显示对话框
  showPrompt: function (content) {
    wx.showModal({
      title: '提示',
      content: content,
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
        //Haiwei: 将当前位置信息记录,以便后面根据这个位置信息过滤（只让需求接近该位置才处理）
        curLocationLatitude = res.latitude
        curLocationlongitude = res.longitude
        console.log(curLocationLatitude, curLocationlongitude);

        //Haiwei: 
       
        that.addReqControl();
        that.showCollection();
        that.showServiceMarker();
        
        if(req_switch_cnt == 0)
        {
          //上面有block 后，机型尺寸不容易控制，就用button的点击事件
          that.addCaicaiControl();
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
        //若尚未选定点，则把当前定位作为选定点
        if (!selected) {
          selected = location;
        }
        //that.moveSelectedMarker(selected);
        // Haiwei:一些组件有些缺省
        that.setData({
          position: location, // 定位坐标
          scala: DEFAULT_SCALA, // 缩放比例[5-18]
          markers: req_markers, // 标记点
        });
        //不能再这里设置完成，有可能上面showcollection 异步根本没有执行成功
        //isPass = 1;
      },
      fail: function () {
        // 定位失败
        that.showPrompt('定位失败');
      },
      complete: function () {
        // 定位完成
      }
    })
  },
  // 加载收藏标记
  //Haiwei: 可以用在从服务器读取需求，这里只读取本地用户地址的信息
  showCollection: function () {
    var that = this;
  
    marker_mode = app.globalData.marker_mode;
    longitude_offset = app.globalData.longitude_offset;
    latitude_offset = app.globalData.latitude_offset;
    console.log("配置查看模式、longitude、latitude 幅度");
    console.log(marker_mode);
    console.log(longitude_offset);
    console.log(latitude_offset);
    //组合查询使用查看：https://leancloud.cn/docs/leanstorage_guide-js.html#hash988310881
   if(0)
   {
     var value = curLocationlongitude + 0.1;
     var maxlongtitude_query = new AV.Query('Collection');
     maxlongtitude_query.lessThan('longitude', value);

     var value = curLocationlongitude - 0.1;
     var minlongtitude_query = new AV.Query('Collection');
     minlongtitude_query.greaterThan('longitude', value);

     //var longtitude_query = AV.Query.and(maxlongtitude_query, minlongtitude_query);

     var value = curLocationLatitude + 0.1;
     var maxlatitude_query = new AV.Query('Collection');
     maxlatitude_query.lessThan('latitude', value);

     var value = curLocationLatitude - 0.1;
     var minlatitude_query = new AV.Query('Collection');
     minlatitude_query.greaterThan('latitude', value);

    //var latitude_query = AV.Query.and(maxlatitude_query, minlatitude_query);

    //var query = AV.Query.and(longtitude_query, latitude_query);
    //Haiwei: 组合查询成功，这里为提高调试性能，暂关闭多个条件
    //var query = AV.Query.and(maxlongtitude_query, minlongtitude_query, maxlatitude_query, minlatitude_query);
    //var query = AV.Query.and(maxlongtitude_query, minlongtitude_query);

   }else
   {
     //Haiwei: 根据当前位置纬度信息，查询对应的表格
     if (app.globalData.scale_mode == 0)
     {
       var req_table = "Collection";

     }else
     {
       var index = Math.floor(curLocationLatitude);
       //console.log(index)；
       var req_table = "Collection" + index;
     }
     
     
    //var latitude_query = AV.Query.and(maxlatitude_query, minlatitude_query);

    //var query = AV.Query.and(longtitude_query, latitude_query);
    //Haiwei: 组合查询成功，这里为提高调试性能，暂关闭多个条件
    //var query = AV.Query.and(maxlongtitude_query, minlongtitude_query, maxlatitude_query, minlatitude_query);
    //var query = AV.Query.and(maxlongtitude_query, minlongtitude_query);
     
   }
    
    if(marker_mode ==0)
    {
      //Haiwei: 待添加控制
      var query = new AV.Query(req_table);
    }else if(marker_mode == 1)
    {
      //性能优化，其它维度查询，在确定模式下操作
      var value = curLocationlongitude + longitude_offset;
      var maxlongtitude_query = new AV.Query(req_table);
      maxlongtitude_query.lessThan('longitude', value);

      var value = curLocationlongitude - longitude_offset;
      var minlongtitude_query = new AV.Query(req_table);
      minlongtitude_query.greaterThan('longitude', value);

      var query = AV.Query.and(maxlongtitude_query, minlongtitude_query);

    }else if(marker_mode ==2)
    {
      //console.log(req_table);
      var value = curLocationlongitude + longitude_offset;
      var maxlongtitude_query = new AV.Query(req_table);
      maxlongtitude_query.lessThan('longitude', value);

      var value = curLocationlongitude - longitude_offset;
      var minlongtitude_query = new AV.Query(req_table);
      minlongtitude_query.greaterThan('longitude', value);

      //var longtitude_query = AV.Query.and(maxlongtitude_query, minlongtitude_query);

      var value = curLocationLatitude + latitude_offset;
      var maxlatitude_query = new AV.Query(req_table);
      maxlatitude_query.lessThan('latitude', value);

      var value = curLocationLatitude - latitude_offset;
      var minlatitude_query = new AV.Query(req_table);
      minlatitude_query.greaterThan('latitude', value);

      var query = AV.Query.and(maxlongtitude_query, minlongtitude_query, maxlatitude_query, minlatitude_query);
    }
   
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


  // Haiwei:标记点点击事件，因为WXML 给定的数组，所以id 也是对应里面的选取的marker
  onMarkerTap: function (e) {
    var that =this;
    if(req_switch_cnt == 0)
    {
      console.log(e.markerId);
      // 收藏标记
      var marker = req_markers[e.markerId];
      //Haiwei: 记录当前marker，且将图标显示灰色
      selected_marker = req_markers[e.markerId];
      selected_marker_id = e.markerId;

      console.log("tst1");
      console.log(selected_marker_id);
      console.log(req_markers);
      //console.log(selected_marker);

      req_markers[e.markerId].iconPath = HAVE_RESPOND_MARKER_RES;

      //Haiwei: 选中了某个marker ，就将这个marker信息也带入，这样后面需要可以取信息
      var collection = {
        title: marker.title,
        type: marker.type,

      };

      //这里用户名和标题中间间隔两个字符
      var preText = marker.reqid + ": " + collection.title;
      console.log(preText);

      // 第二版本刷新文字，根据文字再提交
      that.setData({
        //markers: req_markers, //Haiwei: 这里添加设置，则图标的颜色就修改，表示已经查看
        collection: collection,
        preInfo: preText.substring(0, 20)
      });

    } else if (req_switch_cnt == 1)
    {
      //服务
      selected_marker_id = e.markerId;
      selected_marker = ser_markers[e.markerId];
      console.log("dangqian");

      if(0)
      {
        //考虑先查看信息再点击详细查看
        wx.navigateTo({
          url: '../w_service/w_service?marker=' + JSON.stringify(selected_marker),
          //url: '../response/response',
        })

      }
    
    }
    
  },
  onControltap: function (e) {
    var that = this;
    if (e.controlId == 0) {
        //
      if (req_switch_cnt == 0) {
        
        // 前面控件不加载，后面赋值会出错。这里定位查看需求功能，就不用当前位置信息。id 就用0
        //controls= []; 这种可以消除以前的控件，这里不用
        selected_marker_id = -1;

        that.addReqSelControl();
        req_switch_cnt = 1;
        that.pushServiceMarker();

      } else if (req_switch_cnt == 1) {
        selected_marker_id = -1;
        that.addReqControl();
        that.addCaicaiControl();
        req_switch_cnt = 0;
        that.pushReqMarker();

      }


    }else if(e.controlId == 1)
    {
      if (req_switch_cnt == 0)
      {
        this.onCollectionTapResponse();
      } else if (req_switch_cnt == 1)
      {
        this.onSerTap();

      }
      
    }
  },
  onSerTap: function () {
    if (selected_marker_id == -1) {
      this.showPrompt('请先选择位置标记，详细查看再点击此');
      return;
    }
    //整个应用关闭功能
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

    
    selected_marker = ser_markers[selected_marker_id];
    console.log("step in ser");
    console.log(selected_marker_id);
    console.log(selected_marker);

    wx.navigateTo({
      url: '../w_service/w_service?marker=' + JSON.stringify(selected_marker),
      //url: '../response/response',
    })

  },
  onCollectionTapResponse: function () {

    if (selected_marker_id == -1) {
      this.showPrompt('请先选择标记查看信息，再点击此处予人玫瑰');
      return;
    }
    //整个应用关闭功能
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

    //Haiwei: 删除已经提交的marker
    //req_markers.splice(selected_marker_id, 1);
    req_markers[selected_marker_id].iconPath = HAVE_RESPOND_MARKER_RES;

   
    console.log("tst");
    console.log(selected_marker);

    //Haiwei: 前面地图的marker 控件携带用户名

    //Hawiwei: 增加图片和视频选择方式
    wx.showActionSheet({
      itemList: ['图片', '视频'],
      success: function (res) {
        console.log(res.tapIndex)
        if (res.tapIndex == 0) {
          //切换到上传页面
          //Haiwei: 切换页面，如果是数组，需要用JSON 先转换成字符串
          wx.navigateTo({
            url: '../response/response?marker=' + JSON.stringify(selected_marker),
            //url: '../response/response',
          })
        } else if (res.tapIndex == 1) {
          //切换到上传视频
          wx.navigateTo({
            url: '../uploadview/uploadview?marker=' + JSON.stringify(selected_marker),
            //url: '../response/response',
          })

        }
      },
      fail: function (res) {
        console.log(res.errMsg)
      }
    })




  
  },
  //Haiwei: 收藏信息对话框，取消不响应； 确认就响应
  onCollectionTapCancle: function () {
    var that = this;
    console.log("cancle");
    req_markers[selected_marker_id].iconPath = HAVE_RESPOND_MARKER_RES;

    that.setData({
      markers: req_markers,//Haiwei: 这里添加设置，则图标的颜色就修改，表示已经查看
      collectionModalHidden: true,
      mapHidden: false,
    });
    
  },
  // 将选取点标记移至指定点
  moveSelectedMarker: function (point) {
    selectedMarker = {
      id: SELECTED_MARKER_ID,
      title: 'selected',
      iconPath: SELECTED_MARKER_RES,
      latitude: point.latitude,
      longitude: point.longitude,
      width: 40,
      height: 40
    };
    req_markers.push(selectedMarker);
    //markers[SELECTED_MARKER_ID] = selectedMarker;
    this.setData({
      markers: req_markers
    });
  },
  getUseravatarUrl: function (data,offset,num) {
    var that = this;
    //Haiwei: js 中间任何错误，程序编译也不告警，需要通过调试来解决
    //
    var user_avatarUrl = COLLECTION_MARKER_RES;
    var user_content = data[offset].get('userid') + ": " + data[offset].get('title');

    var avatarUrl_query = new AV.Query('avatarUrl');
    
    avatarUrl_query.equalTo('userid', data[offset].get('userid'));
   
    avatarUrl_query.descending("updatedAt");
    avatarUrl_query.find()
      .then(function (info) {
        // 查询成功
        console.log("query success");
        //可能很多，取多次
        user_avatarUrl =  info[0].get('url');

        req_markers.push({
          id: req_markers.length,
          //title: colFromCloud[i].get('title'),
          title: user_content,
          iconPath: user_avatarUrl,
          latitude: data[offset].get('latitude'),
          longitude: data[offset].get('longitude'),
          width: 40,
          height: 40,
          reqid: data[offset].get('userid'),
        });

        offset = offset+1;
        if (offset >= num)
        {
          //递归跳出
          that.setData({
            markers: req_markers,
          });
          //这里只有真正查询得到marker
          isPass = 1;

          return;
        }else
        {
          that.getUseravatarUrl(data, offset, num);
        }

        
      }).catch(function (error) {
        // 查询失败
        console.log("query fail");
        //console.error('Failed to save in LeanCloud:' + error.message);

        console.log("go on1");
        req_markers.push({
          id: req_markers.length,
          //title: colFromCloud[i].get('title'),
          title: user_content,
          iconPath: user_avatarUrl,
          latitude: data[offset].get('latitude'),
          longitude: data[offset].get('longitude'),
          width: 40,
          height: 40,
          reqid: data[offset].get('userid'),
        });

        console.log("go on2");
        offset = offset + 1;
        if (offset >= num) {
          console.log("go out");
          //递归跳出
          that.setData({
            markers: req_markers,
          });
          //这里只有真正查询得到marker
          isPass = 1;

          return;
        } else {
          console.log("go on");
          console.log(offset,num);
          that.getUseravatarUrl(data, offset, num);
        }


        //that.showPrompt('加载收藏失败');
      });

  },
  // 将收藏点添加到标记中
  addCollectionMarker: function (colFromCloud) {
    var that = this;
    //Haiwei: 这里控制markrer数目，超过128 就不显示，这里就会存在后面的maker 不响应，最好就是移位
    var marker_max_num = app.globalData.marker_max;
    console.log(marker_max_num);
    if (colFromCloud.length < marker_max_num )
    {
       marker_max_num = colFromCloud.length;
    }

    //根据配置
    if (0) 
    {
      //下面递归运行很慢，如果读一个，失败很高（这里返回失败，建立avatarUrl,如果建立了，验证快些
      // markerr 图片路径只能是本地路径，不能是ur。不起作用

      that.getUseravatarUrl(colFromCloud,0, marker_max_num);

    }else
    {
      for (var i = 0; i < marker_max_num; ++i) {
        //console.log("add marker");
        //console.log(colFromCloud[i].get('title'));
        // Haiwei:本来资料makers 特点信息，但用下面结构体(多reqid)也能够正常，这里？
        //这里为了让marker 可以显示用户：


        //获取用户头像
        //后续通过配置可选择

        var user_content = colFromCloud[i].get('userid') + ": " + colFromCloud[i].get('title');

        req_markers.push({
          id: req_markers.length,
          //title: colFromCloud[i].get('title'),
          title: user_content,
          iconPath: COLLECTION_MARKER_RES,
          latitude: colFromCloud[i].get('latitude'),
          longitude: colFromCloud[i].get('longitude'),
          width: 40,
          height: 40,
          reqid: colFromCloud[i].get('userid'),
        });

      }
      if (req_switch_cnt == 0) {
        this.pushReqMarker();
      }
      
      //这里只有真正查询得到marker
      isPass = 1;
    }

  },
  pushReqMarker: function () {
    this.setData({
      markers: req_markers,
    });
    console.log(" req markers set");
    //console.log(this.data.markers)


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
  // 将收藏点添加到标记中
  addServiceMarker: function (colFromCloud) {
    for (var i = 0; i < colFromCloud.length; ++i) {
      
      // 这里服务和需求标记是分开的
      ser_markers.push({
        id: ser_markers.length,
        title: colFromCloud[i].get('content'),
        iconPath: '/res/marker_sprite.png',
        latitude: colFromCloud[i].get('latitude'),
        longitude: colFromCloud[i].get('longitude'),
        width: mapWidth * 0.1,
        height: mapWidth * 0.1,
        type: colFromCloud[i].get('type'),
        content: colFromCloud[i].get('content'),
        tap: 1,//表示服务标签
        objectId: colFromCloud[i].get('objectId'),  //服务标签可能继续添加，这里添加objectid作为父节点
        author: colFromCloud[i].get('author')
      });
    }
 
  },
  pushServiceMarker: function () {
    this.setData({
      markers: ser_markers,
    });

    console.log(" ser markers set");
    //console.log(this.data.markers);

  },
  // 清空收藏标记
  clearCollectionMarker: function () {
    //Haiwei: 这里
    req_markers = [];
    this.setData({
      markers: req_markers,
    });
  },
  // 添加地图中心控件
  addCaicaiControl: function () {
  
    centerControl = {
      id: 1,
      iconPath: CAICAI_CONTROL_RES,
      position: {
        left: mapWidth/2 - 25, //控件大小50*50
        top: mapHeight*7/8 -50,//top: mapHeight * 28 / 32,
        width: 50,//width: mapWidth * 0.15,
        height: 50//height: mapWidth * 0.15
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
  addReqControl: function () {
    centerControl = {
      id: 0,
      iconPath: REQ_TAB_RES,
      position: {
        left: mapWidth / 2 - 25, //控件大小50*50
        top: 10,//top: mapHeight * 28 / 32,
        width: 50,//width: mapWidth * 0.15,
        height: 25//height: mapWidth * 0.15
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
  addReqSelControl: function () {
    centerControl = {
      id: 0,
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
    controls[0] = centerControl;
    this.setData({
      controls: controls,
    })
  },
  onLoad: function (options) {
    var that = this;
    req_switch_cnt = 0;
    
    req_markers = [];
    isPass = 0;
    onshow_cnt = 0;
    marker_mode = app.globalData.marker_mode;
    longitude_offset = app.globalData.longitude_offset;
    latitude_offset = app.globalData.latitude_offset;
    that.setData({
      preInfo: " 温馨提示：点标记查看信息再予人玫瑰",
    });

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
        
        console.log(that.data.mapHeight);
        console.log(that.data.mapWidth);
      }
    });

  },
  onReady: function () {
    // 页面渲染完成
    this.getLocation(); // 定位
    //Haiwei: 这里考虑异步逻辑，上面定位获取中心位置后，再执行下面（下面根据中心位置会判断是否失效）。
    //this.showCollection(); // 显示收藏点

   
  },
  onShow: function () {
    console.log("on show");
    marker_mode = app.globalData.marker_mode;
    longitude_offset = app.globalData.longitude_offset;
    latitude_offset = app.globalData.latitude_offset;

    // 页面显示: 这里程序有个问题，如果修改一个markers 就刷新，可能这个marker 删除，有些保持灰色，这个和渲染可能有关系
    this.setData({
      //markers: req_markers,
    });

    //踩踩页面不会产生新标签信息，只有外部删除时才需要刷新
    if (app.globalData.isSerUpdateCaicai == true) {
      ser_markers = [];
      this.showServiceMarker();
      app.globalData.isSerUpdateCaicai = false;

    }
    if (app.globalData.isReqUpdateCaicai == true) {
      req_markers = [];
      this.showCollection();
      app.globalData.isReqUpdateCaicai = false;
    }

    //用户在看看页面提交需求和发布内容，如何能够在踩踩能够较为及时显示，这种没有触发机制，其它用户操作无法触发
    timer_cnt++;
    if (timer_cnt == 3)
    {
      console.log(" timer update");
      if (req_switch_cnt == 0) {
        this.showCollection();
      } else if (req_switch_cnt == 1) {
        this.showServiceMarker();
      }
      timer_cnt = 0;
    }
    

    //踩踩功能是很重要的，如果加载网络不行，这样就根本打不开，所以需要需要添加提交机制 
    if(req_switch_cnt == 0)
    {
      this.pushReqMarker();

    }else if(req_switch_cnt == 1)
    {
      this.pushServiceMarker();
    }
    

    if(isPass == 0)
    {
      //下面这个操作是解决对方提需求后，可以尽快查看。但如果响应切换，以前灰色标记就有橙色
      console.log("reload collection ");
      //
      if (onshow_cnt >= 1)
      {
        this.showCollection();
        this.showServiceMarker();
      }
      
      onshow_cnt++;
      if (onshow_cnt >= 2) 
      {
        this.showPrompt('该页面如果没有加载标记，则网络暂时有些拥塞，请稍安勿躁到其它页面先看看再返回');
      }
     
    }
    console.log(isPass);
  },
  onHide: function () {
    // 页面隐藏
  },
  onUnload: function () {
    // 页面关闭
  }
})