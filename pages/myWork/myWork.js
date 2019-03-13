// myWork.js

var app = getApp();
// 获取LeanCloud对象
const AV = require('../../libs/av-weapp.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    works: [],
    modalHidden: true,

    viewid: 1,
    selectedId: null,
  },
  deleteResond: function (id_offset) {
    var that = this;
    console.log(id_offset);
    var m_item = that.data.works[id_offset];

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

    
    if (cur_user != m_item.respondid) {
        //不是当前发布作者，不能删除
        that.showPrompt('非发布作者不能删除');
        return;
      }
    //这里先查询再删除，而不是根据objectId 直接删除

    //分享页面查询share 

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
        works: []
      })
      that.fetchData();
     
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
          console.log(" mywork 予人玫瑰 删除处理");
          that.deleteResond(id);
        }
      },
      fail: function (res) {
        console.log(res.errMsg)
      }
    })

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    this.fetchData();

  },

  onPullDownRefresh: function () {
    this.setData({
      works: []
    })
    this.fetchData();
  },
  // 显示对话框
  showPrompt: function (content) {
    wx.showModal({
      title: '提示',
      content: content,
      showCancel: false,
    });
  },
  fetchData: function () {
    var that = this;

    //为方便提示用户，如果没有允许用户权限，功能无法使用，查看关注我们里面有解决方案
    if (getApp().globalData.userInfo == null) {
      // 可以按照主界面触发窗口允许，另外看看,onshow 需要刷新
      that.showPrompt("小程序初次登录时，你拒绝了用户信息权限，故功能无法正常使用。请参考“关于我们”最后小结提供的方法解决");
      return;
    }

    //Haiwei:
    if(1)
    {
  
      //Haiwei 这里只给出响应的内容，不再下载图片
  
      //Haiwei: 假设前面标记已经响应（客户，这里就读取响应图像）
      //https://leancloud.cn/docs/leanstorage_guide-js.html#hash1079143744
      //字符串比较用equalTo 失效，这里有包含

      // 添加条件后，开始查询,根据nickname ，这里并非唯一，可能重复，暂时这样处理
      var cur_user = getApp().globalData.userInfo.nickName;
      console.log("myWork get a")
      console.log(cur_user);
      console.log("myWork get b")
   
      var user_query = new AV.Query('Respond');

      wx.showLoading({
        title: '请稍候...',
        mask: true
      });

      //这里查找，前期是根据提交的作者，目前nickname 可能重复不唯一（open id 唯一，暂没有解决），这里是否可以地理位置（用户可以查询设置的位置可能重复性也存在）

      user_query.equalTo('respondid', cur_user);
      user_query.descending("updatedAt");
      user_query.find()
        .then(function (results) {
          console.log(" have  response");
          var tmp_data = [];
          console.log(results.length);
          if(results.length == 0)
          {
            console.log(" have  response len = 0");
            wx.hideLoading();
            that.showPrompt('您还没有予人玫瑰，请在踩踩页面多多响应');
            return;
          }
          var tmp_i;
          for (tmp_i = 0; tmp_i < results.length; tmp_i++) {
            
            var createdAt = results[tmp_i].get('createdAt').toLocaleString().substring(0, 19);
            // 添加标记
            tmp_data.push({
              reqid: results[tmp_i].get('reqid'),
              title: results[tmp_i].get('title'),
              createdAt: createdAt,
              respondid: results[tmp_i].get('respondid'),
              objectId: results[tmp_i].get('objectId'),
            });
          }

          that.setData({
            works: tmp_data,
          });

        }).catch(function (error) {
          console.log(" no response");
          // 查询失败
          console.error('Failed to save in LeanCloud:' + error.message);
          that.showPrompt('您还没有予人玫瑰，请在踩踩页面多多响应');
        });
    
      wx.hideLoading();

    }
    
  }


})