/**
 * 请求位置权限
 * @returns {Promise<boolean>} 是否授权成功
 */
function requestLocationPermission() {
  return new Promise((resolve) => {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userLocation'] !== undefined && res.authSetting['scope.userLocation'] === false) {
          // 用户已拒绝授权，引导用户打开设置页面
          wx.showModal({
            title: '需要位置权限',
            content: '请在设置页面中允许访问您的位置信息',
            confirmText: '去设置',
            cancelText: '取消',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting({
                  success: (settingRes) => {
                    resolve(!!settingRes.authSetting['scope.userLocation']);
                  },
                  fail: () => {
                    resolve(false);
                  }
                });
              } else {
                resolve(false);
              }
            }
          });
        } else if (res.authSetting['scope.userLocation'] === undefined) {
          // 首次请求权限
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
              resolve(true);
            },
            fail: () => {
              resolve(false);
            }
          });
        } else {
          // 已经授权
          resolve(true);
        }
      },
      fail: () => {
        resolve(false);
      }
    });
  });
}

/**
 * 将地址转换为坐标
 * @param {string} address 地址文本
 * @returns {Promise<Object>} 位置坐标
 */
function convertAddressToLocation(address) {
  return new Promise((resolve, reject) => {
    // 真实环境中应当调用地图服务API进行地址解析
    // 这里使用模拟数据
    
    // 如果地址中包含特定关键词，则返回相应坐标
    if (!address) {
      reject(new Error('地址不能为空'));
      return;
    }
    
    // 根据地址关键词匹配坐标
    const mockLocations = {
      '都柏林城市大学': { latitude: 53.3861, longitude: -6.2573 },
      'dublin city university': { latitude: 53.3861, longitude: -6.2573 },
      '都柏林机场': { latitude: 53.4264, longitude: -6.2499 },
      'dublin airport': { latitude: 53.4264, longitude: -6.2499 },
      '都柏林三一学院': { latitude: 53.3439, longitude: -6.2546 },
      'trinity college dublin': { latitude: 53.3439, longitude: -6.2546 },
      '都柏林': { latitude: 53.349805, longitude: -6.260310 },
      'dublin': { latitude: 53.349805, longitude: -6.260310 },
      '北京': { latitude: 39.9042, longitude: 116.4074 },
      'beijing': { latitude: 39.9042, longitude: 116.4074 },
      '上海': { latitude: 31.2304, longitude: 121.4737 },
      'shanghai': { latitude: 31.2304, longitude: 121.4737 },
      '伦敦': { latitude: 51.5074, longitude: -0.1278 },
      'london': { latitude: 51.5074, longitude: -0.1278 },
      '东京': { latitude: 35.6762, longitude: 139.6503 },
      'tokyo': { latitude: 35.6762, longitude: 139.6503 },
      '巴黎': { latitude: 48.8566, longitude: 2.3522 },
      'paris': { latitude: 48.8566, longitude: 2.3522 },
      '纽约': { latitude: 40.7128, longitude: -74.0060 },
      'new york': { latitude: 40.7128, longitude: -74.0060 },
    };
    
    // 将地址转为小写进行匹配
    const lowerAddress = address.toLowerCase();
    
    // 遍历地址库进行匹配
    for (const [key, coords] of Object.entries(mockLocations)) {
      if (lowerAddress.includes(key.toLowerCase())) {
        // 添加少量随机偏移，模拟不同位置
        const randomLat = (Math.random() - 0.5) * 0.002;
        const randomLng = (Math.random() - 0.5) * 0.002;
        
        resolve({
          latitude: coords.latitude + randomLat,
          longitude: coords.longitude + randomLng
        });
        return;
      }
    }
    
    // 如果没有匹配到，则生成一个随机位置（以都柏林为中心）
    resolve({
      latitude: 53.349805 + (Math.random() - 0.5) * 0.05,
      longitude: -6.260310 + (Math.random() - 0.5) * 0.05
    });
  });
}

/**
 * 计算两个坐标点之间的距离（基于Haversine公式）
 * @param {number} lat1 起点纬度
 * @param {number} lng1 起点经度
 * @param {number} lat2 终点纬度
 * @param {number} lng2 终点经度
 * @returns {number} 距离，单位为公里
 */
function calculateRouteDistance(lat1, lng1, lat2, lng2) {
  const toRad = (value) => value * Math.PI / 180;
  
  const R = 6371; // 地球半径，单位公里
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // 距离，单位公里
  
  return distance;
}

/**
 * 获取两个坐标点之间的路线
 * @param {Object} from 起点坐标
 * @param {Object} to 终点坐标
 * @returns {Promise<Array>} 路线点集合
 */
function getRouteBetweenPoints(from, to) {
  return new Promise((resolve) => {
    // 在真实环境中，应当调用地图服务API获取路线规划
    // 这里使用直线模拟
    
    // 起点和终点
    const fromPoint = {
      latitude: from.latitude,
      longitude: from.longitude
    };
    
    const toPoint = {
      latitude: to.latitude,
      longitude: to.longitude
    };
    
    // 计算中间点，模拟曲线路线
    const points = [fromPoint];
    
    // 添加中间点（真实环境应该从路线API获取）
    const numPoints = 5; // 中间点数量
    for (let i = 1; i < numPoints; i++) {
      const ratio = i / numPoints;
      
      // 基本线性插值
      let lat = fromPoint.latitude + (toPoint.latitude - fromPoint.latitude) * ratio;
      let lng = fromPoint.longitude + (toPoint.longitude - fromPoint.longitude) * ratio;
      
      // 添加一些随机偏移使路线看起来更自然
      const randomLat = (Math.random() - 0.5) * 0.005;
      const randomLng = (Math.random() - 0.5) * 0.005;
      
      lat += randomLat;
      lng += randomLng;
      
      points.push({
        latitude: lat,
        longitude: lng
      });
    }
    
    points.push(toPoint);
    resolve(points);
  });
}

/**
 * 根据当前位置预估到达时间
 * @param {Object} currentLocation 当前位置
 * @param {Object} destination 目的地位置
 * @param {number} avgSpeed 平均速度，默认为40km/h
 * @returns {string} 预计到达时间
 */
function estimateArrivalTime(currentLocation, destination, avgSpeed = 40) {
  // 计算距离
  const distanceKm = calculateRouteDistance(
    currentLocation.latitude, currentLocation.longitude,
    destination.latitude, destination.longitude
  );
  
  // 计算时间（小时）
  const timeHours = distanceKm / avgSpeed;
  
  // 转换为分钟
  const totalMinutes = Math.round(timeHours * 60);
  
  // 获取当前时间
  const now = new Date();
  // 增加所需分钟数
  now.setMinutes(now.getMinutes() + totalMinutes);
  
  // 格式化时间
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

module.exports = {
  requestLocationPermission,
  convertAddressToLocation,
  calculateRouteDistance,
  getRouteBetweenPoints,
  estimateArrivalTime
}; 