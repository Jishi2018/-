// pages/fenxiang/fenxiang.js
// 获取应用实例
var app = getApp();

// 获取LeanCloud对象
const AV = require('../../libs/av-weapp.js');


var cur_index;//Haiwei: 下载一批响应信息后，定位现在是第几个
var cur_down_cnt; //Haiwei: 当前点击按钮能够下载最大数目
var perpage = 7;
var last_down_num =0;//Haiwei: 避免网络带宽，如果第二次查询数目和上一次一样，就不用下载了，同时给出提示
var flag_not_change =0;//Haiwei 0 表示有刷新，1表示没有刷新。 两次查询是否有差异，根据查询的length
var flag_last_finish =0;//Haiwei: 1 表示上一次已经完成，需要从服务器重新
var last_index=0;//Haiwei:分享的图片显示，可以采用简单算法，记录上次下载位置，从上次下载位置继续下载

var m_finish_cnt = 0;
var wait_down_over =0; //0 空闲，1 busuy. 这里下载比较耗时，这里可以等下载完毕再滚动刷新
var index_max =0;

var share_download_max = 128;
var blackuser= "黑名单";

var get_blackid_success = 0;

var guanggao_cnt = 0;

var isPass = 0; // 表示是否逻辑正常走过，没有走过，onshow 再执行下

//如果成功提示，交互感不好，可以onshow 执行两次后再
var onshow_cnt = 0;

//轮播图父节点和当前节点
var farther_id  ;
var current_id ;


Page({
  data: {
    cur_user:"Haiwei",
    scrolltop: null, //滚动位置
    servicelist: [], //服务列表
    page: 0,//分页
    imageUrl: "/res/logo.jpeg",   //预览图像信息
    downUrl:'',//服务器单个url
    downGrpUrl:[],// 服务器一批列表
    blackGrpid:[],
    lastX: 0,     //滑动开始x轴位置
    lastY: 0,     //滑动开始y轴位置
    text: "没有滑动",
    currentGesture: 0//标识手势
  },

  // 显示对话框
  showPrompt: function (content) {
    wx.showModal({
      title: '提示',
      content: content,
      showCancel: false,
    });
  },

  //将响应者提供的图片url 及其它信息读取出来写到本地后续使用（可能存在后台已经更新，数据无效，待确认解决方案）
  getDownloadUrl: function (colFromCloud) {
    var that = this;
    //TBD: 可能查询满足多个,这里可以读取多个
    //console.log("getDownloadUrl beg");
    //console.log(colFromCloud.length);
    const newResonselist =[];
    
    //Haiwei:
    if (colFromCloud.length == last_index) {
      //that.showPrompt('更新已到最后，请稍后刷新');
      console.log("s0");
      flag_not_change = 1;
      //that.showPrompt('当前到最后，请稍后上拉刷新');
      that.putGuanggao();
      return;
    }

    if (colFromCloud.length < last_index) {
      //如果图片数据小，重新下载
      console.log("s3");
      flag_not_change = 0;
      last_index=0;
      return;
    }
  
    //目前算法中，是保证新提交的图片，用户可以看到。以前差异的图片就可以不看
    if (colFromCloud.length > last_index)
    {
      console.log("s1");
      flag_not_change = 0;
      //Haiwei: 数组清零
      that.setData({
        downGrpUrl: [],
        servicelist: []
      })
      //算法分两级，第一级预取起始偏移，last_index 是全量偏移
      cur_index = 0;
      m_finish_cnt =0;
      //Haiwei:　注意按照现在算法
      //last_down_num = share_download_max;
    }
   
    // 设定
    cur_down_cnt = colFromCloud.length - last_index;
    
    if (cur_down_cnt > share_download_max)
    {
      cur_down_cnt = share_download_max;
    }
    console.log("s4");
   
   //
    for (var i = 0; i < cur_down_cnt; ++i) {
      //开始排除[广告] ，活动实际上也不用排查，分享里面有活动大家也能够看到 
      if(colFromCloud[last_index].get('content') == '[广告]')
      {
        last_index++;
        continue;
      }

      //判断到底视频还是图片
      var isVideo = false;
      //以前表设计里面没有type ，以前的图片应该缺省是true 才可以读取
      var isPhoto = true;
     
      if (colFromCloud[last_index].get('type') == "video") {
        isVideo = true;
        isPhoto = false;
        newResonselist.push({
          "content": colFromCloud[last_index].get('content'),
          "author": colFromCloud[last_index].get('author'),
          "url": colFromCloud[last_index].get('url'),
          "createdAt": colFromCloud[last_index].get('createdAt'),
          "wx_url": null,
          "isVideo": isVideo,//判断分析的是否是视频
          "isPhoto": 0,//判断分享的是否是图片
          "objectId": colFromCloud[last_index].get('objectId'),
          "comment_num": colFromCloud[last_index].get('comment_num')
        })
        
      } else if (colFromCloud[last_index].get('type') == "photo")
      {
        isPhoto =  true;
        isVideo = false;
        if (colFromCloud[last_index].get('imageNum') > 1) {
          //var url = JSON.parse(colFromCloud[last_index].get('url'));
          //这里暂转换数组
          var url = JSON.parse(colFromCloud[last_index].get('url'));
          newResonselist.push({
            "content": colFromCloud[last_index].get('content'),
            "author": colFromCloud[last_index].get('author'),
            "url": url,
            "createdAt": colFromCloud[last_index].get('createdAt'),
            "wx_url": null,
            "isVideo": isVideo,//判断分析的是否是视频
            "isPhoto": 2,//判断分享的是否是图片
            "objectId": colFromCloud[last_index].get('objectId'),
            "comment_num": colFromCloud[last_index].get('comment_num')
          })
        }else
        {
          newResonselist.push({
            "content": colFromCloud[last_index].get('content'),
            "author": colFromCloud[last_index].get('author'),
            "url": colFromCloud[last_index].get('url'),
            "createdAt": colFromCloud[last_index].get('createdAt'),
            "wx_url": null,
            "isVideo": isVideo,//判断分析的是否是视频
            "isPhoto": 1,//判断分享的是否是图片
            "objectId": colFromCloud[last_index].get('objectId'),
            "comment_num": colFromCloud[last_index].get('comment_num')
          })

        }


      }
     
      
      last_index++;
    }

      that.setData({
        downGrpUrl: that.data.downGrpUrl.concat(newResonselist)
      })
    //console.log("getDownloadUrl end");
    //下面数组长度已调试通过
    if(0)
    {
    console.log("555");
    console.log(that.data.downGrpUrl.length);
    for (var i = 0; i < that.data.downGrpUrl.length; ++i) {
      console.log(that.data.downGrpUrl[i].url);
      console.log(that.data.downGrpUrl[i].content);
      console.log(that.data.downGrpUrl[i].author);
      console.log(that.data.downGrpUrl[i].createdAt);
      console.log(that.data.downGrpUrl[i].wx_url);
    }
    console.log("666");
    }
  },
  onShareForUsTap:function(){

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

    //添加支持图片和视频方式：
    //Hawiwei: 增加图片和视频选择方式
    wx.showActionSheet({
      itemList: ['图片', '视频'],
      success: function (res) {
        console.log(res.tapIndex)
        if (res.tapIndex == 0) {
          //切换到上传页面
          //Haiwei: 切换页面，如果是数组，需要用JSON 先转换成字符串
          wx.navigateTo({
            url: '../share/share',
          })
        } else if (res.tapIndex == 1) {
          //切换到上传视频，这里和踩踩响应视频可以共用一个页面，根据是否待信息来区分（设固定1 表示分享页面过来的）
          wx.navigateTo({
            url: '../uploadview/uploadview?marker=' + JSON.stringify(1),
          })

        }
      },
      fail: function (res) {
        console.log(res.errMsg)
      }
    })

  },
  //Haiwei: 【添加滚动显示响应者信息列表
 
  // 查询服务器，获取响应当前用户的信息
  getResponseFromServer: function () {
    var that = this;

    if (get_blackid_success==0)
    {
      //等到获取黑名单成功
      return;
    }
  
  
    //Haiwei: 公共区，数据量比较大，就先排序，然后增量显示，前面已经显示的就不显示，每次都更新。
    var query = new AV.Query('Share');
    //TBD: 黑名单放后实现

    //query.ascending('createdAt');
    //query.descending('createdAt');

  
    //这里查找，前期是根据提交的作者，目前nickname 可能重复不唯一（open id 唯一，暂没有解决），这里是否可以地理位置（用户可以查询设置的位置可能重复性也存在）
    //Haiwei:简单提供黑名单功能（添加一个）
    //TBD: 读取黑名单表，遍历取里面用户
    console.log("WWW");
    //下面功能是已经分享的进行排除，按照现在程序定位，会清除昨天的，所以如果关闭黑名单使用，这个就不处理，可以提高性能。
    for (var i = 0; i < that.data.blackGrpid.length; ++i) 
    {
      var tmp_query = new AV.Query('Share');
      console.log(that.data.blackGrpid[i].name);
      tmp_query.notEqualTo('author', that.data.blackGrpid[i].name);
      query = AV.Query.and(query, tmp_query);
    }
    //var query = AV.Query.and(maxlongtitude_query, minlongtitude_query);
    console.log("XXX");
    query.descending('createdAt');

    //query.notEqualTo('author', blackuser);
   
    query.find()
      .then(function (data) {
        // 获取查询结果写会本地
        that.getDownloadUrl(data);
        console.log("yyy");
       //Haiwei: 点击更新刷新，查询是少不了，只是如果没有
        if (flag_not_change) {
          //that.showPrompt('当前到最后，请稍后拖动刷新');
          return;
        }
        //注意考虑异步，这里只有得到准确url 才能够调用download,wx.donwloadFile 不能够放在外面处理
        that.downServiceImg();
      }).catch(function (error) {
        console.log(" no response");
        // 查询失败
        //console.error('Failed to save in LeanCloud:' + error.message);
        //that.showPrompt('加载失败');
      });
    //

  },
  /**
     * 如果文件是图片，获取图片的缩略图URL。可以传入宽度、高度、质量、格式等参数。
     * @return {String} 缩略图URL
     * @param {Number} width 宽度，单位：像素
     * @param {Number} heigth 高度，单位：像素
     * @param {Number} quality 质量，1-100的数字，默认100
     * @param {Number} scaleToFit 是否将图片自适应大小。默认为true。
     * @param {String} fmt 格式，默认为png，也可以为jpeg,gif等格式。
     * 
     * 该函数修改本地函数进行调试
     */

  thumbnailURL_Haiwei: function(url,width, height, quality, scaleToFit, fmt) {
    //var url = this.attributes.url;
    if (!url) {
      throw new Error('Invalid url.');
    }
    if (!width || !height || width <= 0 || height <= 0) {
      throw new Error('Invalid width or height value.');
    }
    quality = quality || 100;
    scaleToFit = !scaleToFit ? true : scaleToFit;
    if (quality <= 0 || quality > 100) {
      throw new Error('Invalid quality value.');
    }
    fmt = fmt || 'png';
    var mode = scaleToFit ? 2 : 1;
    return url + '?imageView/' + mode + '/w/' + width + '/h/' + height + '/q/' + quality + '/format/' + fmt;
  },
  getDownThumbnailUrl: function (id) {
    //根据元数据管理结构体，反过来查找file ，获取缩略图url
    var that = this;
    that.data.downGrpUrl[m_finish_cnt].wx_url = that.data.downGrpUrl[id].url;
    m_finish_cnt++;

    //
    var flag = m_finish_cnt - index_max;
    //
    if (flag == 0) {
     
      that.fetchServiceData();
      //that.showPrompt(' 图片已到最后，请稍后再刷新');
      wait_down_over = 0;//设置下载空闲
    } else {
      that.getDownThumbnailUrl(m_finish_cnt);

    }

    
    if(0)
    {
      //缩略图已经调试成功，前期是调用下载接口，实际没有必要应该是这部分导致性能。这样就没有缩略图了
      var that = this;
      console.log("getDownThumbnailUrl " + id);

      var tmp_query = new AV.Query('_File');
      console.log(that.data.downGrpUrl[id].url);

      tmp_query.equalTo('url', that.data.downGrpUrl[id].url);
      console.log("Thumbnai download A");

      tmp_query.find()
        .then(function (data) {
          console.log("Thumbnai download  B ");

          var object_ulr = data[0].attributes.url;
          console.log(object_ulr);

          var tmp_url = that.thumbnailURL_Haiwei(object_ulr, 100, 200, 100, true, 'png');
          console.log(tmp_url);
          console.log("Thumbnai download " + m_finish_cnt);



          //that.data.downGrpUrl[m_finish_cnt].wx_url = tmp_url;
          that.data.downGrpUrl[m_finish_cnt].wx_url = object_ulr;

          //console.log(that.data.downGrpUrl[m_finish_cnt].wx_url);
          m_finish_cnt++;

          //Haiwei: 按照先后顺序，应该下提交的下载先down下来，这里最后一次调用刷新就可以
          var flag = m_finish_cnt - index_max;
          //
          if (flag == 0) {
            console.log("777");
            that.fetchServiceData();
            //that.showPrompt(' 图片已到最后，请稍后再刷新');
            wait_down_over = 0;//设置下载空闲
          } else {
            that.getDownThumbnailUrl(m_finish_cnt);

          }
        }).catch(function (error) {
          m_finish_cnt++;
          var flag = m_finish_cnt - index_max;
          //
          if (flag == 0) {
            console.log("err down " + m_finish_cnt);
            //that.fetchServiceData();
            //that.showPrompt(' 图片已到最后，请稍后再刷新');
            wait_down_over = 0;//设置下载空闲
          } else {
            that.getDownThumbnailUrl(m_finish_cnt);
          }
          console.log(err)

          // 查询失败
          //console.error('Failed to save in LeanCloud:' + error.message);
          that.showPrompt('网络查询失败');
        });

    }
    

  },
  getDownImg:function(id){
    //这个函数完全是下载
    var that = this;
    console.log("down " + id);
    wx.downloadFile({
      url: that.data.downGrpUrl[id].url,
      //url: 'https://dn-1icd2aqa.qbox.me/05e0f980965c285cd907',
      //url: 'https://dn-1ICd2AQa.qbox.me/ecb15dea2521208449a1',
      type: 'image',
      success: function (res) {
        // 这里是异步的，故局部变量值完全不定，需要检

        var filePath = res.tempFilePath;
        //console.log(filePath);
        //console.log(m_finish_cnt);
        that.data.downGrpUrl[m_finish_cnt].wx_url = filePath;
        console.log("success download " + m_finish_cnt);
        m_finish_cnt++;

        //Haiwei: 按照先后顺序，应该下提交的下载先down下来，这里最后一次调用刷新就可以
        var flag = m_finish_cnt - index_max;
        //
        if (flag == 0) {
          console.log("777");
          that.fetchServiceData();
          //that.showPrompt(' 图片已到最后，请稍后再刷新');
          wait_down_over = 0;//设置下载空闲
        }else
        {
          that.getDownImg(m_finish_cnt);

        }
      },
      fail: function (err) {
        m_finish_cnt++;
        var flag = m_finish_cnt - index_max;
        //
        if (flag == 0) {
          console.log("err down " + m_finish_cnt);
          //that.fetchServiceData();
          //that.showPrompt(' 图片已到最后，请稍后再刷新');
          wait_down_over = 0;//设置下载空闲
        }else
        {
          that.getDownImg(m_finish_cnt);
        }
        console.log(err)
      }
    })


  },
  //Haiwei: 这里只要滚动加载都会调用这个函数，而该函数有个下载，里面有个异步操作如果对m_finish_cnt 设置就会被滚动刷新重新覆盖设定值，导致逻辑失效。
  downServiceImg: function(){ // 上面函数获取响应者信息后，就根据一定数目（因为每次微信同时只能10 个下载任务）进行下载
    var that = this;
    if (0) {
      //等到获取黑名单成功
      console.log("fff");
      return;
    }
    //console.log("CCC");

     //Haiwei: TBD: 这里需要添加一个逻辑，就是如果上一次下载没有完成，这个暂不处理
     // 这里万一后台下载任务多，没有执行丢弃，会形成死锁
     if(1)
     {
       if (wait_down_over == 1) {
         //还在繁忙，等待
         console.log(" wait ");
         return;
       }
     }
  
    m_finish_cnt = cur_index;  //
 
    //最好下拉也保留上面，这样就还支持切换开始。如果是固定显示
    console.log(" downServiceImg ");
    console.log(cur_index);
    
    index_max = cur_index + perpage;

    //按照现在cur_index 是每片相对，一般上传图片比较多，这种逻辑一般不出现。
    //这种逻辑主要处理共享里面小图片情况
    if (that.data.downGrpUrl.length <= cur_index) {
      console.log("down");
      this.getResponseFromServer();
      return;
    }
    
    if(that.data.downGrpUrl.length < index_max)
    {
      index_max = that.data.downGrpUrl.length;
    }
    wait_down_over = 1;
    
    //Haiwei: 以前采用for 循环下载的时候，文字和图片不对应。就做成同步。发现商用模式下载速度还是很慢，这里修改并发模式
    //that.getDownImg(cur_index);  //下载
    that.getDownThumbnailUrl(cur_index);
    
    //下面是循环调用，但考虑异步后面会紊乱。可能先发起的后面才执行完
    if(0)
    {
      for (var i = cur_index; i < index_max; ++i) {
        console.log("down " + i);
        wx.downloadFile({
          url: that.data.downGrpUrl[i].url,
          //url: 'https://dn-1icd2aqa.qbox.me/05e0f980965c285cd907',
          //url: 'https://dn-1ICd2AQa.qbox.me/ecb15dea2521208449a1',
          type: 'image',
          success: function (res) {
            // 这里是异步的，故局部变量值完全不定，需要检

            var filePath = res.tempFilePath;
            //console.log(filePath);
            //console.log(m_finish_cnt);
            that.data.downGrpUrl[m_finish_cnt].wx_url = filePath;
            console.log("success download " + m_finish_cnt);
            m_finish_cnt++;

            //Haiwei: 按照先后顺序，应该下提交的下载先down下来，这里最后一次调用刷新就可以
            var flag = m_finish_cnt - index_max;
            //
            if (flag == 0) {
              console.log("777");
              that.fetchServiceData();
              //that.showPrompt(' 图片已到最后，请稍后再刷新');
              wait_down_over = 0;//设置下载空闲
            }
          },
          fail: function (err) {
            m_finish_cnt++;
            var flag = m_finish_cnt - index_max;
            //
            if (flag == 0) {
              console.log("err down " + m_finish_cnt);
              //that.fetchServiceData();
              //that.showPrompt(' 图片已到最后，请稍后再刷新');
              wait_down_over = 0;//设置下载空闲
            }
            console.log(err)
          }
        })
    }
}

  },
  fetchServiceData: function () {  //考虑异步，下载完后才展示
    let _this = this;
  
    wx.showToast({
      title: '加载中',
      icon: 'loading'
    })
    //
    index_max = cur_index + perpage;
    flag_last_finish = 0;

    if (_this.data.downGrpUrl.length < index_max) {
      index_max = _this.data.downGrpUrl.length;
      flag_last_finish = 1;//Haiwei: 已经下载完毕
    }

    //const perpage = 1;
    this.setData({
      page: cur_index
    })
    const page = this.data.page;

    //tst
    if (0) {
      console.log("555");
      for (var i = 0; i < this.data.downGrpUrl.length; ++i) {
        console.log(this.data.downGrpUrl[i].url);
        console.log(this.data.downGrpUrl[i].content);
        console.log(this.data.downGrpUrl[i].author);
        console.log(this.data.downGrpUrl[i].createdAt);
        console.log(this.data.downGrpUrl[i].wx_url);
      }
      console.log("666");
    }
    //end

    const newlist = [];
    for (var i = page; i < index_max; i++) {
      console.log("page id" + i);
      
      var createdAt_m = _this.data.downGrpUrl[i].createdAt;
      console.log("原始时间：" + createdAt_m);
     // var tmp = createdAt_m.toLocaleDateString();
     // console.log(tmp);
     // var tmp = createdAt_m.toLocaleString();
     // console.log(tmp);

     if(0)
     {
       console.log("测试：toLocalDateString：" + createdAt_m.toLocaleDateString());
       console.log("测试：toLocalString：" + createdAt_m.toLocaleString());
       console.log("测试：toString：" + createdAt_m.toString());
       console.log("测试：toISOString：" + createdAt_m.toISOString());
       console.log("测试：toGMTString：" + createdAt_m.toGMTString());
       console.log("测试：toJSON：" + createdAt_m.toJSON());

     }

     var createdAt = createdAt_m.toLocaleString();
     //Haiwei: 真正的下载成功，设置有效
     isPass =  1;
     
      newlist.push({
        "id": i + 1,
        "title": _this.data.downGrpUrl[i].content,
        "author": _this.data.downGrpUrl[i].author,
        "createdAt": createdAt.substring(0,19),
        "imgurl": _this.data.downGrpUrl[i].wx_url,
        "isVideo": _this.data.downGrpUrl[i].isVideo,
        "isPhoto": _this.data.downGrpUrl[i].isPhoto,
        "objectId": _this.data.downGrpUrl[i].objectId,
        "comment_num": _this.data.downGrpUrl[i].comment_num
      })
      cur_index++;
    }
    
    setTimeout(() => {
      _this.setData({
        servicelist: _this.data.servicelist.concat(newlist)
      })
    }, 1500)
　　
　　//Haiwei: 目前算法是先从服务器查询一批（暂设置128)，然后分批下载图片（服务器有同步下载任务限制，下载完后就继续从服务器）
    if (flag_last_finish)
    {
      this.getResponseFromServer();
    }

  },
  putGuanggao: function () {
    let _this = this;
    const newlist = [];

    //按照异步，有可能后面才下载成功。 这里如果没有下载成功就不处理
    console.log("putGuanggao");
    if (app.globalData.guanggao_url == null) {
      return;
    }
    if (guanggao_cnt > 0) {
      // 有一次就可以了
      return;
    }
    console.log("putGuanggao");

    //Haiwei: 

    newlist.push({
      "id": 1,
      "title": '【广告】',
      "author": '极视',
      "createdAt": '',
      "imgurl": app.globalData.guanggao_url,
      "isVideo": false,
      "isPhoto": 1,
      "objectId": "5a",
      "comment_num":0

    })

    setTimeout(() => {
      _this.setData({
        servicelist: _this.data.servicelist.concat(newlist)
      })
    }, 1500)
    guanggao_cnt = guanggao_cnt + 1;

    //Haiwei:将下载的存放本地缓存，性能优化
    if(0)
    {
      console.log("jishi storage");
      var jishi = JSON.stringify(_this.data.servicelist);
      wx.setStorageSync('jishi', jishi);
    }
    

  }, 
  onReachBottom: function (e) { //滚动事件
    console.log("tst onReachBottom ");
    this.downServiceImg();
   

  },
  scrollHandle: function (e) { //滚动事件
    console.log("tst scrollHandle ");
    this.setData({
      scrolltop: e.detail.scrollTop
    })

  
  },
  goToTop: function () { //回到顶部
    this.setData({
      scrolltop: 0
    })
  },
  loadmore: function () { //滚动加载
    //this.getResponseFromServer();
    this.downServiceImg();
  },
  onPullDownRefresh: function () { //下拉刷新: 这个函数是下面下拉自动会调用
    if (0) {
      //等到获取黑名单成功
      //console.log("CCC");
      //this.this.downServiceImg();
      return;
    }
    if(0)
    {
      // 这里暂不让其工作
        console.log("tst onPullDownRefresh");

        this.setData({
          page: 0,
          servicelist: []
        })
        this.getResponseFromServer();
        
        setTimeout(() => {
          wx.stopPullDownRefresh()
        }, 1000)

    }
  },
  //(预览模式不能够响应事件 滑动移动事件:bindtouchstart = "handletouchtart" bindtouchmove="handletouchmove" bindtouchend="handletouchend"
  // 预览模式可以左右滑动，是用法出错，urls 给数组就可以，已解决
  handletouchmove: function (event) {
    console.log("滑动");
    var currentX = event.touches[0].pageX
    var currentY = event.touches[0].pageY
    var tx = currentX - this.data.lastX
    var ty = currentY - this.data.lastY
    var text = ""
    //左右方向滑动
    if (Math.abs(tx) > Math.abs(ty)) {
      if (tx < 0)
      {
        console.log("向左滑动");

      }else if (tx > 0)
      {
        console.log("向右滑动");

      }
        
    }
    //上下方向滑动
    else {
      if (ty < 0)
        text = "向上滑动"
      else if (ty > 0)
        text = "向下滑动"
    }

    //将当前坐标进行保存以进行下一次计算
    this.data.lastX = currentX
    this.data.lastY = currentY
    this.setData({
      text: text,
    });
  },

  //滑动开始事件
  handletouchtart: function (event) {
    this.data.lastX = event.touches[0].pageX
    this.data.lastY = event.touches[0].pageY
  },
  //滑动结束事件
  handletouchend: function (event) {
    this.data.currentGesture = 0;
    this.setData({
      text: "没有滑动",
    });
  },
  onItemClick: function (e) {
    var p;
    var grplist = [];
    console.log(" kankan onItemClick");
    console.log(e);

    //参考：https://www.cnblogs.com/novice007/p/8143989.html
    var current = e.currentTarget.dataset.src;
    
    //var farther_id = e.currentTarget.id;
    //var current_id = e.target.id;

    farther_id = e.currentTarget.id;
    current_id = e.target.id;
    console.log(farther_id);
    console.log(current_id);

    console.log(this.data.servicelist[farther_id].imgurl[current_id].url);
   
    for (p = 0; p < this.data.servicelist[farther_id].imgurl.length; p++)
    {
      grplist = grplist.concat(this.data.servicelist[farther_id].imgurl[p].url);
    }
    console.log(grplist);
    

    if(1)
    {
      wx.previewImage({
        current: current,
        //urls: this.data.servicelist[farther_id].imgurl[current_id].url.split(','),
        //current: e.currentTarget.dataset.currentimg,
        urls: grplist,
        // 需要预览的图片http链接  使用split把字符串转数组。不然会报错  
      })
  
    }
   

  },
  preMultiViewImg: function (e) {
    //下面是单张图片的预览
    console.log(" kankan preMultiViewImg");
    console.log(e);
    var current = e.currentTarget.dataset.src;

    if (0) {
      wx.previewImage({
        current: current,
        urls: this.data.servicelist[farther_id].imgurl[current_id].url.split(','),
        //current: e.currentTarget.dataset.currentimg,
        //urls: this.data.servicelist,
        // 需要预览的图片http链接  使用split把字符串转数组。不然会报错  
      })

    }
   
    //该功能只是测试，用到顶层的绑定函数处理
    return;
    //end

  },
  previewImg: function (e) {
    console.log("previewImage");
    console.log(e);
    var current = e.currentTarget.dataset.src;
    var id = e.currentTarget.dataset.id;
    
    console.log(e.currentTarget.dataset.id);
    console.log(e.target.dataset.id);

    
    wx.previewImage({
      current:current,
      urls: this.data.servicelist[id].imgurl.split(','),
      //current: e.currentTarget.dataset.currentimg,
      //urls: this.data.servicelist,
      // 需要预览的图片http链接  使用split把字符串转数组。不然会报错  
    })
    console.log("previewImage end");
  },
  commentItem: function (e) {
    console.log("commentItem");
    console.log(e);
    var current = e.currentTarget.dataset.src;
    var id = e.currentTarget.dataset.id;

    console.log(e.currentTarget.dataset.id);
    console.log(e.target.dataset.id);

    console.log(this.data.servicelist[id].objectId);

    var cur_item_id = this.data.servicelist[id].objectId;

    //这里评论有分享页面也有主题页面，需要区分通过proc_mode 区分，proc_mode 等于0位分享页面，1为主题页面
    wx.navigateTo({
      //url: '../uploadview/uploadview?marker=' + JSON.stringify(1),
      url: '../comment/comment?item=' + JSON.stringify(cur_item_id) + '&proc_mode=' + 0,
    })

    if(0)
    {
      wx.navigateTo({
        //url: '../uploadview/uploadview?marker=' + JSON.stringify(1),
        url: '../comment/comment?item=' + JSON.stringify(cur_item_id),
      })

    }
   
  },
  deleteSubZan: function (cur_objectId) {

    var req_table = "SubZan";

    var query = new AV.Query(req_table);
    query.equalTo('objectId', cur_objectId);


    query.find()
      .then(function (data) {
        // 查询成功
        console.log("SubZan query success");

        data[0].destroy().then(function (success) {
          // 删除成功, 添加最新
          console.log(" deleteSubZan 删除成功 ");

        }).catch(function (error) {
          // 删除失败
          console.log(" deleteSubZan 删除失败 ");
        });


      }).catch(function (error) {
        // 查询失败
        console.log("deleteSubZan query fail");
        console.error('Failed to save in LeanCloud:' + error.message);
        //that.showPrompt('加载收藏失败');
      });

  },
  deleteZan: function (cur_objectId) {

    var req_table = "Zan";

    var query = new AV.Query(req_table);
    //每建立一个评论，就有一个点赞表记录。 评论的targetZan 存放就是点赞的objcetId,而commentObjId 存的是评论的objectIdd
    query.equalTo('objectId', cur_objectId);


    query.find()
      .then(function (data) {
        // 查询成功
        console.log("Zan query success");
        //这里一个评论一个

        data[0].destroy().then(function (success) {
          // 删除成功, 添加最新
          console.log(" Zan 删除成功 ");

        }).catch(function (error) {
          // 删除失败
          console.log(" Zan 删除失败 ");
        });


      }).catch(function (error) {
        // 查询失败
        console.log("Zan query fail");
        console.error('Failed to save in LeanCloud:' + error.message);
        //that.showPrompt('加载收藏失败');
      });

  },
  deleteWxCommentCount: function (cur_objectId) {

    var req_table = "WxCommentCount";

    var query = new AV.Query(req_table);
    query.equalTo('article_id', cur_objectId);

    query.find()
      .then(function (data) {
        // 查询成功
        console.log("WxCommentCount query success");

        data[0].destroy().then(function (success) {
          // 删除成功, 添加最新
          console.log(" WxCommentCount 删除成功 ");

        }).catch(function (error) {
          // 删除失败
          console.log(" WxCommentCount 删除失败 ");
        });


      }).catch(function (error) {
        // 查询失败
        console.log("WxCommentCount query fail");
        console.error('Failed to save in LeanCloud:' + error.message);
        //that.showPrompt('加载收藏失败');
      });

  },
  deleteWxSubCommentItem: function (data, cur, maxItemNum) {
    var that = this;

    if (cur == maxItemNum) {
      //后台删除，不用显示刷新
      return;
    }

    //TBD: 删除对应的点赞
  

    var tmp_zan = data[cur].get('targetZan');
    var tmp_zan_id = tmp_zan.toString();
    console.log("get tmp_zan_id");
    console.log(tmp_zan_id);
    that.deleteSubZan(tmp_zan_id);


    data[cur].destroy().then(function (success) {
      // 删除成功, 添加最新
      console.log("deleteWxSubCommentItem  删除成功 ");
      //这里只删除Connection 数据，不删除其它用户响应的。后续后台定期清除
      //that.showPrompt('删除成功');(多个不打印)     
      cur = cur + 1;
      that.deleteWxSubCommentItem(data, cur, maxItemNum);
    }).catch(function (error) {
      // 删除失败
      console.log("deleteWxSubCommentItem 删除失败 ");
      cur = cur + 1;

    });

  },
  deleteWxCommentItem: function (data, cur, maxItemNum) {
    var that = this;

    if (cur == maxItemNum) {
      //后台删除，不用显示刷新
      return;
    }

    //TBD: 删除对应的点赞
    var tmp_zan = data[cur].get('targetZan');
    var tmp_zan_id = tmp_zan.toString();
    console.log('targetZan id is ');
    console.log(tmp_zan_id);
    that.deleteZan(tmp_zan_id);

    
    data[cur].destroy().then(function (success) {
      // 删除成功, 添加最新
      console.log("deleteWxCommentItem  删除成功 ");
      //这里只删除Connection 数据，不删除其它用户响应的。后续后台定期清除
      //that.showPrompt('删除成功');(多个不打印)     
      cur = cur + 1;
      that.deleteWxCommentItem(data, cur, maxItemNum);
    }).catch(function (error) {
      // 删除失败
      console.log("deleteWxCommentItem 删除失败 ");
      cur = cur + 1;

    });

  },
  deleteWxSubComment: function (cur_objectId) {
    var that = this;

    var req_table = "WxSubComment";

    var query = new AV.Query(req_table);
    query.equalTo('article_id', cur_objectId);


    query.find()
      .then(function (data) {
        // 查询成功
        console.log("WxSubComment query success");
        //可能存在多个评论，需要递归删除
        var maxItemNum = data.length;
        var cur = 0;
        that.deleteWxSubCommentItem(data, cur, maxItemNum);


      }).catch(function (error) {
        // 查询失败
        console.log("WxSubComment query fail");
        console.error('Failed to save in LeanCloud:' + error.message);
        //that.showPrompt('加载收藏失败');
      });

  },
  deleteWxComment: function (cur_objectId) {
    var that = this;
  
    var req_table = "WxComment";

    var query = new AV.Query(req_table);
    query.equalTo('article_id', cur_objectId);


    query.find()
      .then(function (data) {
        // 查询成功
        console.log("WxComment query success");
        //可能存在多个评论，需要递归删除
        var maxItemNum = data.length;
        var cur = 0;
        that.deleteWxCommentItem(data, cur, maxItemNum);

       
      }).catch(function (error) {
        // 查询失败
        console.log("WxComment query fail");
        console.error('Failed to save in LeanCloud:' + error.message);
        //that.showPrompt('加载收藏失败');
      });

  },
  deleteShare: function (id_offset) {
    var that = this;
    console.log(id_offset);
    var m_item = that.data.servicelist[id_offset];

    if (getApp().globalData.userInfo == null) {
      return;
    }
    console.log(getApp().globalData.userInfo);
    var cur_user = getApp().globalData.userInfo.nickName;
    console.log("query b");

    if (cur_user == null) {
      return;
    }

    var req_table = "Share";

    //这里用于删除单个，根也在里面。这里仅仅删除单个。如果删除了主题，其它也应该删除，否则会成为冗余数据。
    //和myRelease 删除不一样，查表就是按照作者查询的，删除一定是删除和作者匹配的。这里有两个入口调用,故需要根据作者来匹配

    if (cur_user != m_item.author) {
        //不是当前发布作者，不能删除
        that.showPrompt('非发布作者不能删除');
        return;
      }

    //这里根据objectId ，删除评论部分
    that.deleteWxComment(m_item.objectId);
    that.deleteWxSubComment(m_item.objectId);
    that.deleteWxCommentCount(m_item.objectId);

    //分享页面查询share 
    var query = new AV.Query(req_table);
    query.equalTo('objectId', m_item.objectId);

  
    query.find()
      .then(function (data) {
        // 查询成功
        console.log("query success");

        var maxItemNum = data.length;
        var cur = 0;
        that.deleteShareItem(data, cur, maxItemNum);

      }).catch(function (error) {
        // 查询失败
        console.log("query fail");
        console.error('Failed to save in LeanCloud:' + error.message);
        //that.showPrompt('加载收藏失败');
      });
  },
  deleteShareItem: function (data, cur, maxItemNum) {
    var that = this;

    if (cur == maxItemNum) {
      //下面有刷新，就不需要提示 
      //that.showPrompt('删除成功');
      // 发布关联的都删除完了，才提示。本来后台可以删除，但不确定是否有效

　　　//待确认效果
      that.setData({
        servicelist: []
      })
      that.getResponseFromServer();

      return;
    }

    //
    //FILE 里面删除

    //按照现有逻辑响应响应可能是多个图片，url 就是数组
    var tmp_type = data[cur].get('type');

    if (tmp_type == 'video') {
      //视频就一个
      var delete_url = data[cur].get('url');
      //删除对应FILE
      that.deleteResMatchFile(delete_url);
    } else if (tmp_type == 'photo') {
      var tmp_num = data[cur].get('imageNum');
      if (tmp_num > 1) {
        var tmp_id;
        var tmp_url = JSON.parse(data[cur].get('url'));
        for (tmp_id = 0; tmp_id < tmp_url.length; tmp_id++) {
          var delete_url = tmp_url[tmp_id];
          //删除对应FILE
          that.deleteResMatchFile(delete_url);
        }

      } else if (tmp_num == 1) {
        var delete_url = data[cur].get('url');
        //删除对应FILE
        that.deleteResMatchFile(delete_url);
      }
    }

    data[cur].destroy().then(function (success) {
      // 删除成功, 添加最新
      console.log("deleteShareItem  删除成功 ");
      //这里只删除Connection 数据，不删除其它用户响应的。后续后台定期清除
      //that.showPrompt('删除成功');(多个不打印)     
      cur = cur + 1;
      that.deleteShareItem(data, cur, maxItemNum);
    }).catch(function (error) {
      // 删除失败
      console.log(" 删除失败 ");
      cur = cur + 1;

    });

  },
  deleteResMatchFile: function (delete_url) {
    var that = this;

    var file_query = new AV.Query('_File');

    //这里查找，前期是根据提交的作者，目前nickname 可能重复不唯一（open id 唯一，暂没有解决），这里是否可以地理位置（用户可以查询设置的位置可能重复性也存在）

    file_query.equalTo('url', delete_url);

    file_query.find()
      .then(function (delete_ret) {
        console.log(" deleteResMatchFile find ");
        //缺省_FILE 权限时不能通过函数删除，如果需要，在界面设置删除权限允许所有用户
        delete_ret[0].destroy().then(function (success) {
          // 删除成功, 添加最新
          console.log(" deleteResMatchFile 删除成功 ");
        }).catch(function (error) {
          // 删除失败
          console.log(" deleteResMatchFile 删除失败 ");
        });


      }).catch(function (error) {
        console.log(" deleteResMatchFile no find");
        // 查询失败
        console.error('Failed to save in LeanCloud:' + error.message);
        //that.showPrompt('加载收藏失败');
      });

  },
  deleteProc: function (e) {
    var that = this;
    var id = e.currentTarget.id;
    console.log(id);

    //删除前提供确认机制
    wx.showActionSheet({
      itemList: ['确定删除'],
      success: function (res) {
        console.log(res.tapIndex)
        if (res.tapIndex == 0) {
          console.log(" fengxiang 删除处理");
          that.deleteShare(id);
        }
      },
      fail: function (res) {
        console.log(res.errMsg)
      }
    })


  },
  //end: 列表功能】
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    var that = this;
  
    cur_index = 0;
    last_index = 0;
    m_finish_cnt = 0;

    get_blackid_success = 0;
    guanggao_cnt = 0;

    that.setData({
      blackGrpid: []
    })
    
    share_download_max = app.globalData.share_max;
    blackuser = app.globalData.blackuser;

    perpage = app.globalData.share_perpage;

    //这里维护一个表黑名单
    //console.log("get blackid");
    if (blackuser == "blackmode")
    {
      var query = new AV.Query('blackid');

      //这里查找，前期是根据提交的作者，目前nickname 可能重复不唯一（open id 唯一，暂没有解决），这里是否可以地理位置（用户可以查询设置的位置可能重复性也存在）
      //Haiwei:简单提供黑名单功能（添加一个）
      //TBD: 读取黑名单表，遍历取里面用户
      query.notEqualTo('name', blackuser);
      query.find()
        .then(function (data) {
          console.log("AAA");
          console.log(data.length);
          for (var i = 0; i < data.length; ++i) {
            that.data.blackGrpid.push({
              "name": data[i].get('name')
            })
            //console.log(that.data.blackGrpid[i].name);
          }
          get_blackid_success = 1;
          that.getResponseFromServer();
          console.log("BBB");

        }).catch(function (error) {
          console.log(" no black response");
          // 查询失败
          //console.error('Failed to save in LeanCloud:' + error.message);
          that.showPrompt('加载失败');
        });

    }else
    {
      get_blackid_success = 1;
      this.getResponseFromServer();

    }
    
    console.log("DDD");
    //Haiwei: 缺省也加载响应者的信息，如果没有可以用缺省的风景画面，每天更新也可以
    //this.getResponseFromServer();
    //this.downServiceImg();
  },
  onReady: function () {
    var that = this;
    console.log("加载数据");
    //Haiwei: 逻辑顺序有些问题，待调整
    if(0)
    {
      var searchData = wx.getStorageSync('jishi');

      that.setData({
        servicelist: JSON.parse(searchData)
      })
      console.log(that.data.servicelist);

    }
    
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
  onShow: function () {
    var that;
    that =this;

    that.setData({
      blackGrpid: []
    })
    //console.log(app.globalData.userInfo);
    
    //分享主页面不提示权限信息

    
    // 页面显示
    blackuser = app.globalData.blackuser;
    get_blackid_success = 0;
    
    //这里暂不在onShow 页面切换频繁读取
    //if (blackuser == "blackmode") {
    if (0) {
      var query = new AV.Query('blackid');

      //这里查找，前期是根据提交的作者，目前nickname 可能重复不唯一（open id 唯一，暂没有解决），这里是否可以地理位置（用户可以查询设置的位置可能重复性也存在）
      //Haiwei:简单提供黑名单功能（添加一个）
      //TBD: 读取黑名单表，遍历取里面用户
      query.notEqualTo('name', blackuser);
      query.find()
        .then(function (data) {
          console.log("AAA");
          console.log(data.length);
          //TBD:下面字符串没有找到合适方式，咱不用下面方法
          if (1)
          {
            for (var i = 0; i < data.length; ++i) {

              that.data.blackGrpid.push({
                "name": data[i].get('name')
              })
              console.log(that.data.blackGrpid[i].name);
              
            }

          }

          //判断当前是否在黑名单里面,
          if (1) {
            console.log(that.data.blackGrpid.length);
            var j = 0;
            for (var j ; j < that.data.blackGrpid.length; ++j) 
            {
              console.log("get blackid");
              console.log(j);
              //console.log(that.data.blackGrpid[j].name);
              var curid = that.data.blackGrpid[j].name;
              var sqlid = app.globalData.userInfo.nickName;
              console.log(curid);
              
              console.log(sqlid);
              //if (curid.equals(sqlid)) IDE 会阻塞，导致for 循环下面执行不了
              if (curid ==sqlid)
              {
                //当前用户在黑名单内，需要
                console.log("EEE");
                //当前用户在黑名单内，屏蔽其所有功能
                app.globalData.isBlack = 1;
                break;
              }else
              {
                console.log("EEF");

              }
              console.log("get blackid end");
              //if (that.data.blackGrpid[i].name==app.globalData.userInfo.nickname)  //这个会失效
             
            }

          }

          get_blackid_success = 1;
          that.getResponseFromServer();
          console.log("BBB");

        }).catch(function (error) {
          console.log(" no black response");
          // 查询失败
          //console.error('Failed to save in LeanCloud:' + error.message);
          //that.showPrompt('加载失败');
        });

        //判断当前用户是否在名单里面
        
        
        
      

    } else {
      get_blackid_success = 1;
      // 切换页面，如果非黑名单模式，可以不读取
      //this.getResponseFromServer();

    }

    //
    if (isPass == 0)
    {
      //
      console.log(" try again");

      //前期黑名单采用切换页面就读取，这个不应频率太高，节省性能，可以不处理

      onshow_cnt++;

      //这里避免，如果onload 读取卡住，当前使用阶段，功能就无法正常。
      if (onshow_cnt >= 2) {
        this.onLoad();
      }
    }

    
  },
  onHide: function () {
    // 页面隐藏
  },
  onUnload: function () {
    // 页面关闭
  }
})