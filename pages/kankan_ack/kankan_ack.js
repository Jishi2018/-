// pages/kankan_ack/kankan_ack.js
// pages/kankan/kankan.js
// 获取应用实例
var app = getApp();

// 获取LeanCloud对象
const AV = require('../../libs/av-weapp.js');

var cur_index;//Haiwei: 下载一批响应信息后，定位现在是第几个
var cur_down_cnt; //Haiwei: 当前点击按钮能够下载最大数目
var perpage = 8;
var last_down_num = 0;//Haiwei: 避免网络带宽，如果第二次查询数目和上一次一样，就不用下载了，同时给出提示
var flag_not_change = 0;//Haiwei 0 表示有刷新，1表示没有刷新
var flag_last_finish = 0;//Haiwei: 1 表示上一次已经完成，需要从服务器重新
var last_index = 0;//Haiwei:分享的图片显示，可以采用简单算法，记录上次下载位置，从上次下载位置继续下载
var kankan_max_down = 128;

var m_finish_cnt = 0;
var index_max;
var wait_down_over = 0;

//Haiwei: 考虑该小程序就是定制拍摄需求，故描述需要详细，给150
var req_title_max = 150;
//var req_content_max =50;
var cur_marker;

var  guanggao_cnt = 0;
var newlist = [];
Page({
  data: {
    //cur_user:"",
    scrolltop: null, //滚动位置
    servicelist: [], //服务列表
    page: 0,//分页
    imageUrl: "/res/logo.jpeg",   //预览图像信息
    downUrl: '',//服务器单个url
    downGrpUrl: [],// 服务器一批列表
    req_content:'',
    pay2GrpUrl:[],
    isHave2:false
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
    const newResonselist = [];

    //Haiwei:
    if (colFromCloud.length == last_index) {
      //that.showPrompt('更新已到最后，请稍后刷新');
      console.log("s0");
      flag_not_change = 1;
      //that.showPrompt('当前到最后，请稍后点击收收刷新');
      //that.putGuanggao();
      return;
    }
    if (colFromCloud.length < last_index) {
      //如果图片数据小，重新下载
      console.log("s3");
      flag_not_change = 0;
      last_index = 0;
      return;
    }

    //目前算法中，是保证新提交的图片，用户可以看到。以前差异的图片就可以不看
    if (colFromCloud.length > last_index) {
      console.log("s1");
      flag_not_change = 0;
      //Haiwei: 数组清零
      that.setData({
        downGrpUrl: [],
        servicelist: []
      })
      //算法分两级，第一级预取起始偏移，last_index 是全量偏移
      cur_index = 0;
      m_finish_cnt = 0;

    }

    // 设定
    cur_down_cnt = colFromCloud.length - last_index;


    if (cur_down_cnt > kankan_max_down) {
      cur_down_cnt = kankan_max_down;
    }
    console.log("s4");

    for (var i = 0; i < cur_down_cnt; ++i) {
      //下面两种方式都能够获取到
      //var createdAt = colFromCloud[last_index].createdAt;
      var createdAt = colFromCloud[last_index].getCreatedAt();
      //console.log(createdAt);
      
      createdAt = createdAt.toLocaleString();

      var isVideo = false;
      var isPhoto = false;
      if (colFromCloud[last_index].get('type') == "photo" )
      {
        isPhoto = true;
        if (colFromCloud[last_index].get('imageNum') > 1)
        {
          //var url = JSON.parse(colFromCloud[last_index].get('url'));
          //这里暂转换数组
          var url = JSON.parse(colFromCloud[last_index].get('url'));
          
          newResonselist.push({
            "content": colFromCloud[last_index].get('content'),
            "respondid": colFromCloud[last_index].get('respondid'),
            "url": url,
            "createdAt": createdAt.substring(0, 19),
            "wx_url": null,
            "isVideo": isVideo,
            "isPhoto": 2,
            "objectId": colFromCloud[last_index].get('objectId'),
          })

        }else
        {
          newResonselist.push({
            "content": colFromCloud[last_index].get('content'),
            "respondid": colFromCloud[last_index].get('respondid'),
            "url": colFromCloud[last_index].get('url'),
            "createdAt": createdAt.substring(0, 19),
            "wx_url": null,
            "isVideo": isVideo,
            "isPhoto": 1,
            "objectId": colFromCloud[last_index].get('objectId'),
          })

        }
       


      } else if(colFromCloud[last_index].get('type') == "video")
      {
        isVideo = true;
        //视频只上传一份
        //createdAt = createdAt.toLocaleTimeString();
        //createdAt = createdAt.toString();
        //console.log(createdAt);
        newResonselist.push({
          "content": colFromCloud[last_index].get('content'),
          "respondid": colFromCloud[last_index].get('respondid'),
          "url": colFromCloud[last_index].get('url'),
          "createdAt": createdAt.substring(0, 19),
          "wx_url": null,
          "isVideo": isVideo,
          "isPhoto": 0,
          "objectId": colFromCloud[last_index].get('objectId'),
        })

      }
      
      last_index++;
    }

    that.setData({
      downGrpUrl: that.data.downGrpUrl.concat(newResonselist)
    })
    //console.log("getDownloadUrl end");
    //下面数组长度已调试通过
    if (0) {
      console.log("555");
      console.log(that.data.downGrpUrl.length);
      for (var i = 0; i < that.data.downGrpUrl.length; ++i) {
        console.log(that.data.downGrpUrl[i].url);
        console.log(that.data.downGrpUrl[i].content);
        console.log(that.data.downGrpUrl[i].respondid);
      }
      console.log("666");
    }

    /* Haiwei 下面单个读取功能已经调通，
    //如果learcloud 设置，文件选择https 域，上传图像就是https ，这里不用拼接
    //var geturl = colFromCloud[0].get('url');
    //geturl.substring(4);
    
    this.setData({
     // downUrl: "https" + geturl.substring(4),
      downUrl: colFromCloud[0].get('url'),
    });
    */
  },

  //Haiwei: 【添加滚动显示响应者信息列表
  //考虑，打开小程序，缺省读取后，后面就不读取更新(这里设计有两种： 一种下拉后重新读取；），这里提供按钮再读取，下拉显示上次剩余的，可以下载很多
  // 这里相关逻辑保持和分享页面一致，只是通过设置不同阈值，保证分享可以动态刷新。而看看尽量保证有以前的（本来就少量）。 以前的回传功能其实就需要了，
  onGetResponseTap: function () {
    var that = this;
    //整个应用关闭功能
    if (app.globalData.blackuser == "blackblack") {
      //当前用户在黑名单里面，不能有任何操作
      console.log("all are forbidden");
      return;
    }

    //黑名单功能
    if (app.globalData.isBlack == 1) {
      //当前用户在黑名单里面，不能有任何操作
      console.log("you are forbidden");
      return;
    }
    //一次按钮，下载最新一次。有多少下载多少，有个最大上限
    //this.getResponseFromServer();

    that.downServiceImg();
  },
  // 查询服务器，获取响应当前用户的信息
  getResponseFromServer: function () {
    var that = this;
    //Haiwei: 假设前面标记已经响应（客户，这里就读取响应图像）
     //https://leancloud.cn/docs/leanstorage_guide-js.html#hash1079143744
    //字符串比较用equalTo 失效，这里有包含
    
    // 添加条件后，开始查询,根据nickname ，这里并非唯一，可能重复，暂时这样处理
    var cur_user = getApp().globalData.userInfo.nickName;
    var cur_title = cur_marker.title;
    console.log(cur_user);
    console.log(cur_title);

    var user_query = new AV.Query('Respond');

    //这里查找，前期是根据提交的作者，目前nickname 可能重复不唯一（open id 唯一，暂没有解决），这里是否可以地理位置（用户可以查询设置的位置可能重复性也存在）

    if(0)
    {
      //前期根据当前用户查找，因为入口都是自己
      user_query.equalTo('reqid', cur_user);

    }else
    {
      //标签携带了当前是哪个作者，这里kankan_ack 就很干净了
      cur_user = cur_marker.author;
      user_query.equalTo('reqid', cur_user);
    }
  

    var title_query = new AV.Query('Respond');
   
    title_query.equalTo('title', cur_title);
    //title_query.startsWith('title', cur_marker.title);
   
    var query = AV.Query.and(user_query, title_query);
    query.descending('createdAt');
    query.find()
      .then(function (data) {
        console.log(" have very response");
       
        // 获取查询结果写会本地
        that.getDownloadUrl(data);

        //Haiwei: 点击更新刷新，查询是少不了，只是如果没有
        if (flag_not_change) {
          //that.showPrompt('当前已到最后，请稍后刷新');
          console.log(" flag not change");
          that.putGuanggao()
          return;
        }
        //注意考虑异步，这里只有得到准确url 才能够调用download,wx.donwloadFile 不能够放在外面处理
        that.downServiceImg();

      }).catch(function (error) {
        console.log(" no response");
        // 查询失败
        console.error('Failed to save in LeanCloud:' + error.message);
        //that.showPrompt('加载收藏失败');
      });
    //

  },
  getDownImg: function (id) {
    var that = this;
    console.log("down " + id);

    that.data.downGrpUrl[m_finish_cnt].wx_url = that.data.downGrpUrl[id].url;
    //tst
    console.log(that.data.downGrpUrl[m_finish_cnt].wx_url);
    //end
    console.log("success download " + m_finish_cnt);
    m_finish_cnt++;

    //Haiwei: 按照先后顺序，应该下提交的下载先down下来，这里最后一次调用刷新就可以
    var flag = m_finish_cnt - index_max;
    //
    if (flag == 0) {
      console.log("777");
      that.fetchServiceData();
      //that.showPrompt(' 图片已到最后，请稍后再刷新');
      //that.putGuanggao();
      wait_down_over = 0;//设置下载空闲
    } else {
      that.getDownImg(m_finish_cnt);

    }

    
    

  },
  downServiceImg: function () { // 上面函数获取响应者信息后，就根据一定数目（因为每次微信同时只能10 个下载任务）进行下载
    var that = this;
    if (0) {
      //等到获取黑名单成功
      console.log("fff");
      return;
    }
    //console.log("CCC");

    //Haiwei: TBD: 这里需要添加一个逻辑，就是如果上一次下载没有完成，这个暂不处理
    // 这里万一后台下载任务多，没有执行丢弃，会形成死锁
    if (1) {
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

    if (that.data.downGrpUrl.length < index_max) {
      index_max = that.data.downGrpUrl.length;
    }
    wait_down_over = 1;
    that.getDownImg(cur_index);


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

    //考虑异步，这里采用递归的方式处理
     newlist = [];
    _this.getPay2Info(page);
   
    
  },
  putGuanggao: function () {
    let _this = this;
    const guanggaolist = [];
  
    //按照异步，有可能后面才下载成功。 这里如果没有下载成功就不处理
    console.log("putGuanggao");
    if (app.globalData.guanggao_url == null)
    {
      return;
    }
    if (guanggao_cnt > 0)
    {
      // 有一次就可以了
      return;
    }
    console.log("putGuanggao");
    guanggaolist.push({
      "id": 1,
      "name": '【广告】',
      "city": '极视',
      "createdAt": '',
      "imgurl": app.globalData.guanggao_url,
      "isHave2": false,
      "isVideo": false,
      "isPhoto": 1,
      "pay2Url": null
    })

    //

    setTimeout(() => {
      _this.setData({
        servicelist: _this.data.servicelist.concat(guanggaolist)
      })
    }, 1500)
    guanggao_cnt = guanggao_cnt + 1;

  },
  deleteRespond: function (id_offset) {
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

    var req_table = "Respond";

    //这里用于删除单个，根也在里面。这里仅仅删除单个。如果删除了主题，其它也应该删除，否则会成为冗余数据。
    //和myRelease 删除不一样，查表就是按照作者查询的，删除一定是删除和作者匹配的。这里有两个入口调用,故需要根据作者来匹配

    //特权函数处理：如果作者是Haiwei 可以删除任何（不能让其看到）

    if (cur_user == 'Haiwei') {
      //特权用户，可以删除所有,避免非法上传。通过前端都可以删除
      console.log(" 特权用户操作");
    } else {
      if (cur_user != m_item.respondid) {
        //不是当前发布作者，不能删除
        that.showPrompt('非发布作者不能删除');
        return;
      }
    }

    //这里先查询再删除，而不是根据objectId 直接删除

    //分享页面查询share 
    console.log(m_item);

    var query = new AV.Query(req_table);
    query.equalTo('objectId', m_item.objectId);


    query.find()
      .then(function (data) {
        // 查询成功
        console.log("query success");

        var maxItemNum = data.length;
        var cur = 0;
        that.deleteRespondItem(data, cur, maxItemNum);

      }).catch(function (error) {
        // 查询失败
        console.log("query fail");
        console.error('Failed to save in LeanCloud:' + error.message);
        //that.showPrompt('加载收藏失败');
      });
  },
  deleteRespondItem: function (data, cur, maxItemNum) {
    var that = this;

    if (cur == maxItemNum) {
      //下面有刷新，就不需要提示 
      //that.showPrompt('删除成功');
      // 发布关联的都删除完了，才提示。本来后台可以删除，但不确定是否有效

      //待确认效果
      that.setData({
        servicelist: [],
        downGrpUrl:[]
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
      console.log("deleteRespondItem  删除成功 ");
      //这里只删除Connection 数据，不删除其它用户响应的。后续后台定期清除
      //that.showPrompt('删除成功');(多个不打印)     
      cur = cur + 1;
      that.deleteRespondItem(data, cur, maxItemNum);
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
          console.log(" kankan ack  删除处理");
          that.deleteRespond(id);
        }
      },
      fail: function (res) {
        console.log(res.errMsg)
      }
    })

  },
  payforyou: function (e) {
    //根据亮色，如果有显示，说明对方提供二维码url ，这里函数只是预览二维码图片，计算放在前面处理
    var that = this;
    console.log(" pay for you");
    console.log(e);
    //var current = e.currentTarget.dataset.src;
    var id = e.currentTarget.dataset.id;

    console.log(e.currentTarget.dataset.id);
    console.log(e.target.dataset.id);

    if (that.data.servicelist[id].pay2Url == null)
    {
      that.showPrompt('灰色¥ 图案表示对方无偿服务');

    }else
    {
      var url = that.data.servicelist[id].pay2Url;
      wx.previewImage({
        // current: current,
        urls: url.split(','),
        //urls: that.data.pay2Url.split(',')
        // 需要预览的图片http链接  使用split把字符串转数组。不然会报错  
      })

    }
    

  },
  getPay2Info: function (id) {
    //根据亮色，如果有显示，说明对方提供二维码url ，这里函数只是预览二维码图片，计算放在前面处理
    let _this = this;
    const paylist = [];
   
    var isFind = false;
    var isHave2 = false;
    var pay2Url = null;


    console.log("page id =" + id);

    if(id >= index_max)
    {
      //跳出递归，这个处理存在问题
      setTimeout(() => {
        _this.setData({
          servicelist: _this.data.servicelist.concat(newlist)
        })
      }, 1500)
      //Haiwei: 目前算法是先从服务器查询一批（暂设置128)，然后分批下载图片（服务器有同步下载任务限制，下载完后就继续从服务器）
      if (flag_last_finish) {
        _this.getResponseFromServer();
      }
      
       return;
    }
    
    var respond_id = _this.data.downGrpUrl[id].respondid;
    console.log(respond_id);

    //首先检查这个用户是否前面已经解析，有就不需要查询
    for (var m = 0; m < _this.data.pay2GrpUrl.length; m++ )
    {
       if (_this.data.pay2GrpUrl[m].name == respond_id)
       {
         //找到就
         isFind = true;
         pay2Url = _this.data.pay2GrpUrl[m].payurl;
         isHave2 = true;
         break;
       }
    }

    // 前面找到
    if(isFind == true)
    {
      //console.log(_this.data.downLocalUrl[i]);
     

      newlist.push({
        "id": id + 1,
        "name": _this.data.downGrpUrl[id].content,
        "city": _this.data.downGrpUrl[id].respondid,
        "createdAt": _this.data.downGrpUrl[id].createdAt,
        "imgurl": _this.data.downGrpUrl[id].wx_url,
        "isVideo": _this.data.downGrpUrl[id].isVideo,
        "isPhoto": _this.data.downGrpUrl[id].isPhoto,
        "isHave2": isHave2,
        "pay2Url": pay2Url,
        "objectId": _this.data.downGrpUrl[id].objectId,
      })
      cur_index++;
      _this.getPay2Info(id + 1);

    }else
    {
      //如果没有找到，需要查找
      console.log("重新二维表查找");

      var query_pay = new AV.Query('Respond2');
      console.log(respond_id);
      query_pay.equalTo('respondid', respond_id);
      console.log("重新二维表查找 2");
      query_pay.find()
        .then(function (data) {
          //后台有,对象取数据需要用get函数，不能像数组直接取
          var url = data[0].get('url');
          
          console.log("二维码表找到");
          paylist.push({
            "name": respond_id,
            "payurl": url
          })

          setTimeout(() => {
            _this.setData({
              pay2GrpUrl: _this.data.pay2GrpUrl.concat(paylist)
            })
          }, 1500)

          isHave2 = true;
          pay2Url = url;

          //console.log(_this.data.downLocalUrl[i]);
          newlist.push({
            "id": id + 1,
            "name": _this.data.downGrpUrl[id].content,
            "city": _this.data.downGrpUrl[id].respondid,
            "createdAt": _this.data.downGrpUrl[id].createdAt,
            "imgurl": _this.data.downGrpUrl[id].wx_url,
            "isVideo": _this.data.downGrpUrl[id].isVideo,
            "isPhoto": _this.data.downGrpUrl[id].isPhoto,
            "isHave2": isHave2,
            "pay2Url": pay2Url,
            "objectId": _this.data.downGrpUrl[id].objectId,
          })
          cur_index++;
          _this.getPay2Info(id + 1);
         }).catch(function (error) {
           //TBD: 担心程序卡在erro ，或者走不下去，就会导致图片循环取逻辑出现问题

           console.log("getPay2Info 查询失败");
           isHave2 = false;
           pay2Url = null;

           //console.log(_this.data.downLocalUrl[i]);
           newlist.push({
             "id": id + 1,
             "name": _this.data.downGrpUrl[id].content,
             "city": _this.data.downGrpUrl[id].respondid,
             "createdAt": _this.data.downGrpUrl[id].createdAt,
             "imgurl": _this.data.downGrpUrl[id].wx_url,
             "isVideo": _this.data.downGrpUrl[id].isVideo,
             "isPhoto": _this.data.downGrpUrl[id].isPhoto,
             "isHave2": isHave2,
             "pay2Url": pay2Url,
             "objectId": _this.data.downGrpUrl[id].objectId,
           })
           cur_index++;
           _this.getPay2Info(id + 1);
        });

    }
  },
  payfor: function (e) {
    //这个函数主要是通过用户点击触发，如果没有用户给收款二维码，就会导致交互感不强。最好在读取图像的时候就遍历获取信息（二维码url),通过明暗提示
    var that = this;
    console.log(" pay for you");
    console.log(e);
    //var current = e.currentTarget.dataset.src;
    var id = e.currentTarget.dataset.id;

    console.log(e.currentTarget.dataset.id);
    console.log(e.target.dataset.id);
    // 根据该图像的作者，从后台寻找二维码进行展示

    var respond_id = that.data.downGrpUrl[id].respondid;
    console.log(respond_id);

    var query_pay = new AV.Query('Respond2');
    query_pay.equalTo('respondid', respond_id);

    query_pay.find()
      .then(function (data) {
        //后台有,对象取数据需要用get函数，不能像数组直接取
        var url= data[0].get('url');    

        if(1)
        {
          //下面是直接预览图片，但预览模式长按没有识别二维码，这里看用画布是否可以
          console.log(" have pay ");
          console.log(url);

          wx.previewImage({
            // current: current,
            urls: url.split(','),
            //urls: that.data.pay2Url.split(',')
            // 需要预览的图片http链接  使用split把字符串转数组。不然会报错  
          })

        }else
        {
          //调到画布模式
          wx.navigateTo({
           // url: '../kankan_ack/kankan_ack?marker=' + JSON.stringify(marker),
            url: '../response_detail/response_detail?url='+ url,
          });
        }
        
    
      }).catch(function (error){
        //后台没有
        that.showPrompt('无需打赏');

      });
    
  },
  onItemClick: function (e) {
    var p;
    var grplist = [];
    console.log(" kankan onItemClick");
    console.log(e);
    
    //参考：https://www.cnblogs.com/novice007/p/8143989.html
    var current = e.currentTarget.dataset.src;
  
    var farther_id = e.currentTarget.id;
    var current_id = e.target.id;
    console.log(farther_id);
    console.log(current_id);
    for (p = 0; p < this.data.servicelist[farther_id].imgurl.length; p++) {
      grplist = grplist.concat(this.data.servicelist[farther_id].imgurl[p].url);
    }
    console.log(grplist);


    wx.previewImage({
      current: current,
      //urls: this.data.servicelist[farther_id].imgurl[current_id].url.split(','),
      //current: e.currentTarget.dataset.currentimg,
       urls: grplist,
      // 需要预览的图片http链接  使用split把字符串转数组。不然会报错  
    })

  },
  preMultiViewImg: function (e) {
    //下面是单张图片的预览
    console.log(" kankan preMultiViewImg");
    console.log(e);
  
    
    //该功能只是测试，用到顶层的绑定函数处理
    return;
    //end

  },
  previewImg: function (e) {
    //下面是单张图片的预览
    console.log(" kankan previewImage");
    console.log(e);
    var current = e.currentTarget.dataset.src;
    var id = e.currentTarget.dataset.id;

    console.log(e.currentTarget.dataset.id);
    console.log(e.target.dataset.id);


    wx.previewImage({
      current: current,
      urls: this.data.servicelist[id].imgurl.split(','),
      //current: e.currentTarget.dataset.currentimg,
      //urls: this.data.servicelist,
      // 需要预览的图片http链接  使用split把字符串转数组。不然会报错  
    })
    console.log("kankan previewImage end");
  },
  scrollHandle: function (e) { //滚动事件
    console.log("scrollHandle");
    this.setData({
      scrolltop: e.detail.scrollTop
    })
    this.downServiceImg();

  },
  goToTop: function () { //回到顶部
    this.setData({
      scrolltop: 0
    })
  },
  onReachBottom: function (e) { //滚动事件
    console.log("tst onReachBottom ");
    this.downServiceImg();

  },
  loadmore: function () { //滚动加载
    //this.getResponseFromServer();
    console.log("loadmore");
    this.downServiceImg();
  },
  onPullDownRefresh: function () { ////下拉刷新: WXML 不指定就可以自动调用（应该是新版本不指定，缺省名字匹配就调用）
    if (0) {
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
  //end: 列表功能】
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    var that = this; 
    if (options == null || options.marker == null) {
      that.showPrompt('标记信息失效');
      return;
    }
    cur_marker = JSON.parse(options.marker);
    console.log(cur_marker);
    this.setData({
      //这里顶部显示部分提示信息
      req_content: cur_marker.title.substring(0, 12)
    })

    //前期版本通过提示控件表示是否刷新到最后，这个影响交互，可以通过到最后的一个广告来暗示
  
    
    //end
    
    cur_index = 0;
    last_index = 0;
    m_finish_cnt = 0;
    req_title_max = app.globalData.req_title_max;
    //req_content_max = app.globalData.req_content_max;
    perpage = app.globalData.kankan_perpage;
    kankan_max_down = app.globalData.kankan_max_down;

    guanggao_cnt = 0;
   
    //下载

    //Haiwei: 缺省也加载响应者的信息，如果没有可以用缺省的风景画面，每天更新也可以
    this.getResponseFromServer();
    //this.downServiceImg();
  },
  onReady: function () {
    // 页面渲染完成
 
  },
  onShow: function () {
    // 页面显示
    req_title_max = app.globalData.req_title_max;
    //req_content_max = app.globalData.req_content_max;
    perpage = app.globalData.kankan_perpage;
    kankan_max_down = app.globalData.kankan_max_down;
    //console.log("ttt");
    //这里用户提交需求后会回到主页面，会调用onShow ，这会导致提示信息干扰
    //this.getResponseFromServer();
  },
  onHide: function () {
    // 页面隐藏
  },
  onUnload: function () {
    // 页面关闭
  }
})