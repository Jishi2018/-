// myRelease.js
var proc_mode = 0;

var app = getApp();
// 获取LeanCloud对象
const AV = require('../../libs/av-weapp.js');
Page({

  data: {
    works: [],
    content: '',
    showModel: false
   
  },
  // 显示对话框
  showPrompt: function (content) {
    wx.showModal({
      title: '提示',
      content: content,
      showCancel: false,
    });
  },
  //获取用户信息新接口
  agreeGetUser: function (e) {
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
  getOP: function (res) {//提交用户信息 获取用户id
    let that = this
    let userInfo = res
    wx.hideLoading();
    app.globalData.userInfo = userInfo;
    


  },
  //获取当前用户发布的所有信息数据
  fetchData: function () {

    var that = this;

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
              if(app.globalData.userInfo ==null)
              {
                that.setData({
                  showModel: true
                })

              }
             
              console.log("my release  A");
              return;


            } else {//有授权
              console.log("my release  C");
              console.log(app.globalData.userInfo);
              that.setData({
                showModel: false
              })

              if (0) {
                wx.showLoading({
                  title: '加载中...'
                })

              }

              //that.getOP(app.globalData.userInfo)
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


    //为方便提示用户，如果没有允许用户权限，功能无法使用，查看关注我们里面有解决方案
    if (getApp().globalData.userInfo == null)
    {
      that.showPrompt("小程序初次登录时，你拒绝了用户信息权限，故功能无法正常使用。请参考“关于我们”最后小结提供的方法解决");
      return;
    }

    //Haiwei: 屏蔽从Bmob 读取
    if(1)
    {
      wx.showLoading({
        title: '请稍候...',
        mask: true
      });

      console.log(getApp().globalData.userInfo);
      var cur_user = getApp().globalData.userInfo.nickName;
      

      if (!cur_user) {
        return;
      }
      if(proc_mode == 0)
      {
        that.getReqInfo();

      }else if(proc_mode == 1)
      {
        that.getSerInfo();

      }

        wx.hideLoading();

    }
    
  },
  getReqInfo: function () {
    var that = this;
    var cur_user = getApp().globalData.userInfo.nickName;

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

    //特权操作
    if (cur_user =='Haiwei')
    {
      //特权用户，可以看到所有的，方便删除
    }else
    {
      query.equalTo('userid', cur_user);
    }
 
    query.descending("updatedAt");

    query.find()
      .then(function (results) {
        // 查询成功
        console.log("query success");
        if (results.length == 0) {
          that.showPrompt('您还没有提场景需求');
          return;
        }
        console.log(results[0].getCreatedAt().toISOString());
        //
        var tmp_data = [];
        //
        for (var i = 0; i < results.length; ++i) {
          //需要判断，如果没有响应就是红色，如果有响应就是另一个颜色

          var createdAt = results[i].get('createdAt').toLocaleString().substring(0, 19);

          var tmp_ack = 1;

          //前期测试发现，估计响应太多图片，异步设置ack 会导致紊乱（看到为null)，这里不是0就读取
          if (results[i].get('ack') == null) {
            tmp_ack = 1;

          } else {
            tmp_ack = results[i].get('ack');

          }


          // 添加标记
          tmp_data.push({
            ack: tmp_ack,
            title: results[i].get('title'),
            createdAt: createdAt,
            objectId: results[i].get('objectId'),
            author: results[i].get('userid')
          });
        }

        that.setData({
          works: tmp_data,
        });
        //end

      }).catch(function (error) {
        // 查询失败
        console.log("query fail");
        console.error('Failed to save in LeanCloud:' + error.message);
        that.showPrompt('加载收藏失败');
      });

  },
  getSerInfo: function () {
    var that = this;
    var cur_user = getApp().globalData.userInfo.nickName;
    //查询服务表项  
    var req_table = "Service";

    var query_author = new AV.Query(req_table);
    if(cur_user == 'Haiwei')
    {
      //特权用户
      console.log(" 特权用户获取ser");

    }else
    {
      query_author.equalTo('author', cur_user);

    }
  
     //判断根节点信息：这里信息复用，如果是0，就表示根节点。如果objectID 就是子节点，存放父节点信息
    var query_root = new AV.Query(req_table);
    query_root.equalTo('isRoot', '0');

    var query = new AV.Query(req_table);
    query = AV.Query.and(query_author, query_root);
    //按照最新时间排在上面
    query.descending("updatedAt");
    query.find()
      .then(function (results) {
        // 查询成功
        console.log("query success");
        if (results.length == 0)
        {
          that.showPrompt('您还没有发布主题');
          return;
        }
        var tmp_data = [];
        //
        for (var i = 0; i < results.length; ++i) {
          //需要判断，如果没有响应就是红色，如果有响应就是另一个颜色

          var createdAt = results[i].get('createdAt').toLocaleString().substring(0, 19);

          var tmp_ack = 1;

          // 添加标记
          tmp_data.push({
            ack: tmp_ack,
            title: results[i].get('content'),  
            createdAt: createdAt,
            objectId: results[i].get('objectId'), 
            author: results[i].get('author')
          });
        }

        that.setData({
          works: tmp_data,
        });
        

      }).catch(function (error) {
        // 查询失败
        console.log("query fail");
        console.error('Failed to save in LeanCloud:' + error.message);
        //that.showPrompt('加载收藏失败');
      });

  },

  bindGotoRespond: function (e) {
    console.log("go go respond");
    var that = this;
    var ack = 0;
  
    var id = e.currentTarget.id;
    console.log(id);

    if(proc_mode == 0)
    {

      //Haiwei: 这里需要通过get('关键字段得到')
      var m_item = that.data.works[id];
      ack = m_item.ack;

      if (ack > 0) {
        // 切换到
        console.log("go to ack");
        var marker = {
          author: m_item.author,
          title: m_item.title
        };


        // 第二版本处理：切换到别人响应的页面
        wx.navigateTo({
          url: '../kankan_ack/kankan_ack?marker=' + JSON.stringify(marker),
          //url: '../response/response',
        });
      }else
      {
        that.showPrompt('【】里数字为0，表明您的需求还在等待响应中。请查看其它有数字条目');

      }

    }else if(proc_mode ==1)
    {
      var m_item = that.data.works[id];
      ack = m_item.ack;

      var marker = {
        author: m_item.author,
        content:m_item.title,
        objectId: m_item.objectId,
      };

      //可以查看自己发布的主题
      wx.navigateTo({
        url: '../w_service/w_service?marker=' + JSON.stringify(marker),
        //url: '../response/response',
      })

    }

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
  deleteResItem: function (data, cur, maxItemNum) {
    var that = this;

    if (cur == maxItemNum) {
      
      return;
    }

    //
    //按照现有逻辑响应响应可能是多个图片，url 就是数组
    var tmp_type = data[cur].get('type');
    
    if (tmp_type == 'video')
    {
      //视频就一个
      var delete_url = data[cur].get('url');
      //删除对应FILE
      that.deleteResMatchFile(delete_url);
    } else if (tmp_type == 'photo')
    {
      var tmp_num = data[cur].get('imageNum');
      if (tmp_num > 1)
      {
        var tmp_id;
        var tmp_url = JSON.parse(data[cur].get('url'));
        for (tmp_id = 0; tmp_id < tmp_url.length; tmp_id++)
        {
          var delete_url = tmp_url[tmp_id];
          //删除对应FILE
          that.deleteResMatchFile(delete_url);
        }

      } else if (tmp_num == 1)
      {
        var delete_url = data[cur].get('url');
        //删除对应FILE
        that.deleteResMatchFile(delete_url);
      }
    }
    

    data[cur].destroy().then(function (success) {
      // 删除成功, 添加最新
      console.log("deleteResItem 删除成功 " + cur);
      //这里只删除Connection 数据，不删除其它用户响应的。后续后台定期清除
      //that.showPrompt('删除成功');(多个不打印)     
      cur = cur + 1;
      that.deleteResItem(data, cur, maxItemNum);
    }).catch(function (error) {
      // 删除失败
      console.log(" 删除失败 ");
      cur = cur + 1;

    });

  },
  deleteMatchResponse: function (data) {
    var that =this;

    var delete_req_id = data[0].get('userid');
    var delete_req_title =data[0].get('title');

    var user_query = new AV.Query('Respond');

    //这里查找，前期是根据提交的作者，目前nickname 可能重复不唯一（open id 唯一，暂没有解决），这里是否可以地理位置（用户可以查询设置的位置可能重复性也存在）

    user_query.equalTo('reqid', delete_req_id);

    var title_query = new AV.Query('Respond');

    title_query.equalTo('title', delete_req_title);
    //title_query.startsWith('title', cur_marker.title);

    var query = AV.Query.and(user_query, title_query);
    query.descending('createdAt');
    query.find()
      .then(function (delete_ret) {
        console.log(" deleteMatchResponse find response");

        var maxItemNum = delete_ret.length;
        var cur = 0;
        that.deleteResItem(delete_ret, cur, maxItemNum);

        

      }).catch(function (error) {
        console.log(" no response");
        // 查询失败
        console.error('Failed to save in LeanCloud:' + error.message);
        //that.showPrompt('加载收藏失败');
      });

  },
  // 加载收藏标记: 用户提交需求管理是比较基本的功能，需要完善
  deleteCollection: function (id_offset) {
    var that = this;
    console.log(id_offset);
    var m_item = that.data.works[id_offset];
    console.log(m_item.title);
    
    if (getApp().globalData.userInfo == null) {
      return;
    }
    console.log(getApp().globalData.userInfo);
    var cur_user = getApp().globalData.userInfo.nickName;
    console.log("query b");

    if (cur_user == null) {
      return;
    }
    //Haiwei: 根据当前位置纬度信息，查询对应的表格
    if (app.globalData.scale_mode == 0) {
      var req_table = "Collection";

    } else {
      //TBD:　按照不同表格，后期采用遍历的方式, 不然其它位置信息看不到
      var req_table = "Collection";
    }

    var user_query = new AV.Query(req_table);
    if (cur_user == 'Haiwei')
    {
      //特权删除

    }else
    {
      user_query.equalTo('userid', cur_user);
    }
    
  
    if(0)
    {
      var title_query = new AV.Query(req_table);
      console.log(m_item.title);
      title_query.equalTo('title', m_item.title);

      var query = AV.Query.and(user_query, title_query);

    }else{
      var objectId_query = new AV.Query(req_table);
      //因为是删除，是全面已经查询得到的信息，这里就根据objectId查询就可以了，应该效率更高些
      objectId_query.equalTo('objectId', m_item.objectId);

      var query = AV.Query.and(user_query, objectId_query);

    }


    // 如果根据时间，这里时间已经转换，不容易匹配。如果根据title ，是否太大，性能是瓶颈

    query.find()
      .then(function (data) {
        // 查询成功
        console.log("query success");
        var tmp_ack = data[0].get('ack');
        if (tmp_ack > 0) 
        {  
          that.deleteMatchResponse(data);
        }
        //如果有其它用户响应，就应该将响应的删除。这里如果找到多个只删除第一个（用户可以多次删除）。
        data[0].destroy().then(function (success) {
          // 删除成功, 添加最新
          console.log(" deleteCollection 删除成功 ");
          
          //这里删除connection 就提示，其它后台删除
          //that.showPrompt('删除成功');
          //需要重新刷新视图：
          that.setData({
            works: []
          })
          that.fetchData();

          //告知其它页面刷新
        
          return;
          

        }).catch(function (error) {
          // 删除失败
          console.log(" 删除失败 ");
         
        });

        
      }).catch(function (error) {
        // 查询失败
        console.log("query fail");
        console.error('Failed to save in LeanCloud:' + error.message);
        //that.showPrompt('加载收藏失败');
      });
  },
  deleteSer: function (id_offset) {
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
    
    var req_table = "Service";

    //删除主题： father 以及其相关的

    var root_query = new AV.Query(req_table);
    root_query.equalTo('objectId', m_item.objectId);

    var sub_query = new AV.Query(req_table);
    
    sub_query.equalTo('isRoot', m_item.objectId);

    var query = AV.Query.or(root_query, sub_query);

    query.find()
      .then(function (data) {
        // 查询成功
        console.log("query success");
        console.log(data);
        console.log(data.length);

        var maxItemNum = data.length;
        var cur = 0;
        that.deleteSerItem(data, cur, maxItemNum);
      
      }).catch(function (error) {
        // 查询失败
        console.log("query fail");
        console.error('Failed to save in LeanCloud:' + error.message);
        //that.showPrompt('加载收藏失败');
      });
  }, 
  deleteSerItem: function (data,cur,maxItemNum) {
    var that = this;

    if (cur == maxItemNum) {
      //下面有刷新，就不需要提示 
      //that.showPrompt('删除成功');
      // 发布关联的都删除完了，才提示。本来后台可以删除，但不确定是否有效

      //需要重新刷新视图：
      that.setData({
        works: []
      })
      that.fetchData();
      console.log("删除发布设置标志");
      //为避免删除后逻辑出现混乱，需要告知其它页面刷新 
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
    //tst
    console.log(data[cur]);

    //end
    data[cur].destroy().then(function (success) {
      // 删除成功, 添加最新
      console.log("deleteSerItem  删除成功 ");
      //这里只删除Connection 数据，不删除其它用户响应的。后续后台定期清除
      //that.showPrompt('删除成功');(多个不打印)     
      cur = cur + 1;
      that.deleteSerItem(data, cur, maxItemNum);
    }).catch(function (error) {
      // 删除失败
      console.log(" 删除失败 ");
      cur = cur + 1;

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
          console.log("删除处理");
          if(proc_mode == 0)
          {
            //这里只要有删除动作，就设刷新标志。前期部分不成功，就出现逻辑
            app.globalData.isReqUpdateKankan = true;
            app.globalData.isReqUpdateCaicai = true;
            that.deleteCollection(id);
          } else if (proc_mode == 1)
          {
            app.globalData.isSerUpdateKankan = true;
            app.globalData.isSerUpdateCaicai = true;
            that.deleteSer(id);
          }
          

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

    proc_mode = options.id;
    if (options.id == 0) {
      //场景
      console.log("step in my req");
      console.log(options.id);
     
    }else
    {
      //发布
      console.log("step in my ser");
      console.log(options.id);

    }
  
    this.fetchData();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.setData({
      works: []
    })
    this.fetchData();
  },
})