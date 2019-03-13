/**
 * banner数据
 */ 
function getBannerData(){
  var arr = ['../../res/bigworld/beiying.jpg', '../../res/bigworld/bycicle.jpg', '../../res/bigworld/mountain.jpg']
    return arr
}

/*
 * 对外暴露接口
 */ 
module.exports = {
  getBannerData : getBannerData  
}