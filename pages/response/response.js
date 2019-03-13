import util from './../../utils/util.js';
// Haiwei: 获取LeanCloud对象
const AV = require('../../libs/av-weapp.js');

var app = getApp();
//Haiwei: 存放选取marker的信息
var cur_marker;
var isPass = 0;

//
var multiImageUrl=[];


//Haiwei:
var content_max =50;
Page({
  data: {
    showtab: 0,  //顶部选项卡索引
    showtabtype: '', //选中类型
    showfootertab: 0,  //底部标签页索引
    tabnav: {},  //顶部选项卡数据
    questionsall: [],  //所有问题
    questions: [], //问题列表
    uploadimgs:[], //上传图片列表
    editable: false,//是否可编辑
    index:0,//Haiwei:上传图片的index 记录
    uploadUrl: '',//Haiwei:响应者上传图像记录变量
    response_info:'',//Haiwei:响应写的信息
    reqcontent:'',//对哪个信息响应
    userurl:'' //用户头像链接
  },
  //下面用下载接口，提示下载域没有提供，暂时功能不能正常。
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
        that.setData({
          userurl: "../../images/rank_on.png"
        })
        isPass = 1;

      });

    //end
  },
  onShow: function () {

    var that = this;

    if (isPass == 0) {
      this.getUserAvatarUrl();
    }
  },
  onLoad:function(options) {
    cur_marker = JSON.parse(options.marker);
    console.log(cur_marker);

    //Haiwei: 这里在前面考虑地图marker 控件显示标题可以显示用户名，需要将title 剥离下
    var userIdLen = cur_marker.reqid.length;
    //在踩踩marker 用户名和title 间隔两个字符(: 和空格)，这里需要加2
    var title = cur_marker.title.slice(userIdLen+2);
    //还原该信息
    cur_marker.title = title;
    console.log(cur_marker.title);


    //为了方便查看用户头像，这里读取
    this.getUserAvatarUrl();

    //Haiwei: 后面优化将marer显示的标题添加了用户名，这里就不再添加了
    this.setData({
      uploadimgs:[],
      reqcontent: cur_marker.reqid+": "+cur_marker.title
      //reqcontent: cur_marker.title
    })
    
    content_max = app.globalData.share_content_max;
    //console.log(this.data.cur_marker.latitude);
    //this.fetchQuestions();
  },
  chooseImage:function() {
    let _this = this;
    //Haiwei: 规定一次只能上传6张
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
  },// 显示对话框
  showPrompt: function (content) {
    wx.showModal({
      title: '提示',
      content: content,
      showCancel: false,
    });
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

    var query = AV.Query.and(user_query, title_query, latitude_query, longitude_query);
    query.find()
      .then(function (data) {
        console.log(" response have very response");
        var cur_ack = data[0].get('ack');
        cur_ack = cur_ack+1;
        if(cur_ack >128)
        {
          cur_ack =128;
        }
        data[0].set('ack',cur_ack)
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
  respondSubmit:function(){

    let _this = this;
    //添加的几张图片和文字描述发送的服务器器
    //Haiwei: 容错性，输入字节不能超过50
    if (_this.data.response_info.length > content_max)
    {
      this.showPrompt('文字数目超过' + content_max);
      return;
    }
    if (_this.data.uploadimgs.length == 0) {
      _this.showPrompt('图片没有提交');
      return;
    }
    
    console.log("a");
    if(1)
    {
      //响应图片可能多张，这里显示优化
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
   
    //响应后在表里面设置
    _this.setRespondFlag();
    //Haiwei: 添加到主页面
    wx.switchTab({
      url: '../caicai/caicai'
    })
    console.log("c");
  },
  bindTextAreaBlur: function (e) {//Haiwei: 添加获取文本框信息
    this.setData({
      response_info: e.detail.value
    })
    if (this.data.response_info.length > content_max)
    {
      this.showPrompt('文字数目超过' + content_max);
    }
  },
  uploadServer:function()   //Haiwei: 添加函数处理单个图片
  {
    const newlist = [];
    let _this = this;

    //单个函数实现一个图片信息的上传
    var tempFilePath = _this.data.uploadimgs[_this.data.index];

    //Haiwei: 上传的文件和其它关联，这样方便查询
    //var user = new AV.User();
    //Haiwei: TBD: 后续filename 是否绑定提需求的名字，带着响应者名字，这样唯一性？
    var respond_id = getApp().globalData.userInfo.nickName;  

    var file_name = "Respond_" + respond_id;
    console.log(file_name);
    var avFile = new AV.File(file_name, {
      blob: {
        uri: tempFilePath,
      },
    });
    console.log("Aa");

    avFile.save().then(function (avFile) {
      //console.log(avFile.url());
      _this.setData({
        uploadUrl: avFile.url(),
      });
      console.log("index1 = ");
     
      newlist.push({
        "url": avFile.url()
      })
      multiImageUrl = multiImageUrl.concat(newlist);
      console.log("index = ");
      console.log(multiImageUrl);
      console.log(_this.data.index);
      console.log(_this.data.uploadimgs.length);

      // 不能直接利用data.index,按照异步，前面for 循环执行很快，会导致多次调节成立

     
      if (_this.data.index == (_this.data.uploadimgs.length - 1)) {
        //最后一张

        //有效才存储：
        // Haiwei: 将响应者信息新生产结构体维护到第三方结构体
        //console.log("ddd");
        if (0) {
          //Haiwei: 根据地理位置建立分表
          var index = Math.floor(cur_marker.latitude);
          //console.log(index)；
          var respond_table = "Respond" + index;
          //console.log(req_table);
          var respond = AV.Object.extend(respond_table);
        } else {
          //因为需求者可以提很多位置需求，这里如果分表，就需要轮询各个表
          console.log("not ctreat");
          var respond = AV.Object.extend('Respond');
        }

        var col = new respond();
        //Haiwei: 添加一userid信息，后续知道谁提的这个需求. 
        //响应需求也可以详细描述，保留和提需求规则一样。


        col.set('respondid', respond_id);  // 用户既可以是需求提出者，也可以是响应者
        col.set('reqid', cur_marker.reqid); //提需求者
        console.log(cur_marker.reqid);

        col.set('title', cur_marker.title);  //这里只用标题，不用再分内容
        col.set('type', "photo");
        //Haiwei: 这里将
        col.set('content', _this.data.response_info);
        //col.set('content', "太古里音乐喷泉");

        col.set('imageNum', _this.data.uploadimgs.length);
        console.log("tst image num");
        console.log(JSON.stringify(multiImageUrl));
        
        //这里为了兼容以前，如果图片只有一个，就直接存放url 。（实际统一更好）
        if (_this.data.uploadimgs.length == 1)
        {
          col.set('url', _this.data.uploadUrl);

        }else
        {
          col.set('url', JSON.stringify(multiImageUrl)); 
        }
        
        //Haiwei: 后面可以把提交图片的位置信息也带上，已经传过来，暂不存。
        //console.log(_this.data.uploadUrl);
        //console.log("eee");

        //col.set('latitude', center.latitude);
        //col.set('longitude', center.longitude);
        //col.set('privacy', privacy);
        col.save().then(function (success) {
          //增加交互，响应成功
          _this.showPrompt('上传成功');

        }, function (error) {
          // 添加失败
          console.error('Failed to save in LeanCloud:' + error.message);
          _this.showPrompt('添加失败');
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
    });
    // console.log(avFile.__proto__.url());
    //console.log(avFile);

    //console.log(avFile.url());
    console.log("Bb");

  }
})
