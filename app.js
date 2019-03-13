//app.js


//初始化LeanCloud对象
const AV = require('./libs/av-weapp.js');
//下面LeanCloud 需要使用你自己申请的
AV.init({
  appId: 'xxxx',
  appKey: 'xxxx',
});
App({
  onLaunch: function () {
    var that = this
    if(0)
    {
      //调用API从本地缓存中获取数据
      var logs = wx.getStorageSync('logs') || []
      logs.unshift(Date.now())
      wx.setStorageSync('logs', logs)

    //that.getCfg();
    //console.log(that.globalData.share_max);

    }else
    {
      console.log("ceshi req new ver")
      const updateManager = wx.getUpdateManager()
      updateManager.onCheckForUpdate(function (res) {
        // 请求完新版本信息的回调
        console.log(res.hasUpdate);
        if (res.hasUpdate)
        {
          console.log("ceshi req new ver 1")
          updateManager.onUpdateReady(function () {
            wx.showModal({
              title: '更新提示',
              content: '新版本已经准备好，是否重启应用？',
              success: function (res) {
                if (res.confirm) {
                  // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                  console.log("重启应用")
                  updateManager.applyUpdate();
                }
              }
            })

          })

          console.log("ceshi req new ver 2")
          updateManager.onUpdateFailed(function () {
            // 新的版本下载失败
            wx.showModal({
              title: '更新提示',
              content: '新版本下载失败',
              showCancel: false
            })
          })

        }

      })
      
     
    }
    
  },
 
  getUserInfo:function(cb){
    var that = this
    if(this.globalData.userInfo){
      typeof cb == "function" && cb(this.globalData.userInfo)
    }else{
      //调用登录接口
      wx.login({
        success: function () {
          wx.getUserInfo({
            success: function (res) {
              that.globalData.userInfo = res.userInfo
              //Haiwei：
              console.log("get nickname");
              console.log(that.globalData.userInfo.nickName);
              //end
              typeof cb == "function" && cb(that.globalData.userInfo)
            }
          })
        }
      })
    }
  },
  globalData: {
    userInfo: null,
    blackboard: "中国之大，总想去看看！中国又小，总有些您曾经走过且还一直留恋的地方或者角落，您又想再去看看！ 您所想看的地方，也许有个她在那里，她的视角也许就是您所想看的...。此小程序主要提供基于地理位置的场景共享服务，倡导予人玫瑰，手有余香！",
    share_max: 128,//分享下载最大
    marker_mode: 1,
    marker_max: 64,
    req_title_max:12,
    req_content_max:50,
    share_content_max:50,
    blackuser:"黑名单",
    share_perpage:7,
    kankan_perpage:9,
    kankan_max_down:128,
    longitude_offset:0.1,
    latitude_offset:0.1,
    suggestion: "小程序开发还不完备，应用过程有相关问题请反馈，以便及时修正更好服务大家。另外，有好的建议和想法，非常欢迎来信互动。联系方式：haiweilion@163.com",
    isBlack:0, //判断当前用户是否是黑名单，如果是，提交需求和响应需求都功能屏蔽。0 表示当前不在黑名单内，1 表示在黑名单内
    scale_mode:0,//0 提交的需求和查找的需求都在一个表格；1 根据地理位置分布
    guanggao_url:null,// 在主页把广告下载存放，其它直接使用
    activity:null,
    user_mode:0 , //0 缺省是可以看到对方的用户nickname; 1 看不到 (咱没有放在配置项,咱没有使用)
    isSerUpdateKankan:false,//我的页面删除需求和发布，回到看看需要及时刷新，不然逻辑会存在问题
    isReqUpdateKankan:false,
    isSerUpdateCaicai:false,//我的页面删除需求和发布，回到看看需要及时刷新，不然逻辑会存在问题
    isReqUpdateCaicai:false,
    isSerAdd:false, // 发布主题时设置有效，方便针对性读取
    isReqAdd:false
  }
  
})

