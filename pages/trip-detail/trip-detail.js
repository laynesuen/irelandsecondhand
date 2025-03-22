// pages/trip-detail/trip-detail.js
const app = getApp();
const { requestLocationPermission, convertAddressToLocation, calculateRouteDistance } = require('../../utils/location');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    tripId: '',
    trip: null,
    isLoading: true,
    isPublisher: false,
    mapInfo: {
      latitude: 53.349805, // 爱尔兰都柏林默认位置
      longitude: -6.260310,
      scale: 11,
      markers: [],
      polyline: []
    },
    refreshingLocation: false,
    permissionDenied: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    // 获取参数并加载行程数据
    const tripId = options.id;
    if (!tripId) {
      wx.showToast({
        title: '缺少行程ID',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({
      tripId: tripId
    });

    // 加载行程数据
    await this.loadTripData(tripId);
    
    // 请求位置权限
    this.checkLocationPermission();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 获取地图上下文
    this.mapContext = wx.createMapContext('routeMap');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  /**
   * 查询行程数据
   */
  async loadTripData(tripId) {
    try {
      this.setData({ isLoading: true });
      
      // 向服务器请求行程详情数据
      // 这里使用模拟数据
      const tripData = this.getMockTripData(tripId);
      
      const userInfo = app.globalData.userInfo || {};
      const isPublisher = tripData.publisherId === userInfo.id;
      
      this.setData({
        trip: tripData,
        isPublisher: isPublisher,
        isLoading: false
      });
      
      // 初始化地图数据
      await this.initMapData(tripData);
      
    } catch (error) {
      console.error('加载行程数据失败:', error);
      this.setData({ isLoading: false });
      wx.showToast({
        title: '加载行程数据失败',
        icon: 'none'
      });
    }
  },
  
  /**
   * 获取模拟行程数据
   */
  getMockTripData(tripId) {
    // 模拟数据
    return {
      id: tripId || 'trip123456',
      publisherId: 'user12345',
      status: 'active',
      statusText: '正在进行',
      fromLocation: '都柏林城市大学',
      fromAddress: 'Dublin City University, Collins Ave Ext, Whitehall, Dublin 9',
      fromCoordinates: {
        latitude: 53.3861,
        longitude: -6.2573
      },
      toLocation: '都柏林机场',
      toAddress: 'Dublin Airport, County Dublin',
      toCoordinates: {
        latitude: 53.4264,
        longitude: -6.2499
      },
      departureTime: '2024-04-01 14:30',
      estimatedArrivalTime: '2024-04-01 15:00',
      contactInfo: '+353 89 123 4567',
      availableWeight: '10kg',
      acceptableItems: ['电子产品', '文件', '服装', '食品'],
      progress: 1,
      startTime: '2024-04-01 14:30',
      midwayTime: '',
      arrivalTime: ''
    };
  },
  
  /**
   * 初始化地图数据
   */
  async initMapData(tripData) {
    try {
      // 如果有坐标信息，直接使用
      if (tripData.fromCoordinates && tripData.toCoordinates) {
        this.updateMapWithCoordinates(
          tripData.fromCoordinates, 
          tripData.toCoordinates,
          tripData.fromLocation,
          tripData.toLocation
        );
        return;
      }
      
      // 否则尝试从地址获取坐标
      const fromCoords = await convertAddressToLocation(tripData.fromAddress);
      const toCoords = await convertAddressToLocation(tripData.toAddress);
      
      // 更新行程数据中的坐标
      const updatedTrip = {
        ...this.data.trip,
        fromCoordinates: fromCoords,
        toCoordinates: toCoords
      };
      
      this.setData({ trip: updatedTrip });
      
      // 更新地图
      this.updateMapWithCoordinates(
        fromCoords, 
        toCoords,
        tripData.fromLocation,
        tripData.toLocation
      );
      
    } catch (error) {
      console.error('初始化地图数据失败:', error);
      wx.showToast({
        title: '无法加载地图数据',
        icon: 'none'
      });
    }
  },
  
  /**
   * 使用坐标更新地图
   */
  updateMapWithCoordinates(fromCoords, toCoords, fromName, toName) {
    if (!fromCoords || !toCoords) {
      console.error('缺少必要坐标信息');
      return;
    }
    
    // 计算中心点和缩放级别
    const centerLat = (fromCoords.latitude + toCoords.latitude) / 2;
    const centerLng = (fromCoords.longitude + toCoords.longitude) / 2;
    
    // 计算两点之间距离
    const distance = calculateRouteDistance(
      fromCoords.latitude, fromCoords.longitude,
      toCoords.latitude, toCoords.longitude
    );
    
    // 根据距离确定缩放级别
    let scale = 14;
    if (distance > 10) scale = 12;
    if (distance > 20) scale = 11;
    if (distance > 50) scale = 10;
    if (distance > 100) scale = 9;
    if (distance > 200) scale = 8;
    
    // 设置标记点
    const markers = [
      {
        id: 1,
        latitude: fromCoords.latitude,
        longitude: fromCoords.longitude,
        title: fromName || '起点',
        iconPath: '/images/icons/start_marker.png',
        width: 30,
        height: 30,
        callout: {
          content: fromName || '起点',
          color: '#000000',
          fontSize: 14,
          borderRadius: 4,
          padding: 8,
          display: 'BYCLICK',
          textAlign: 'center'
        }
      },
      {
        id: 2,
        latitude: toCoords.latitude,
        longitude: toCoords.longitude,
        title: toName || '终点',
        iconPath: '/images/icons/end_marker.png',
        width: 30,
        height: 30,
        callout: {
          content: toName || '终点',
          color: '#000000',
          fontSize: 14,
          borderRadius: 4,
          padding: 8,
          display: 'BYCLICK',
          textAlign: 'center'
        }
      }
    ];
    
    // 设置路线
    const polyline = [{
      points: [
        {
          latitude: fromCoords.latitude,
          longitude: fromCoords.longitude
        },
        {
          latitude: toCoords.latitude,
          longitude: toCoords.longitude
        }
      ],
      color: '#3cc51f',
      width: 4,
      dottedLine: false,
      arrowLine: true
    }];
    
    this.setData({
      mapInfo: {
        latitude: centerLat,
        longitude: centerLng,
        scale: scale,
        markers: markers,
        polyline: polyline
      }
    });
  },
  
  /**
   * 检查位置权限
   */
  async checkLocationPermission() {
    try {
      const authorized = await requestLocationPermission();
      this.setData({
        permissionDenied: !authorized
      });
      
      if (authorized) {
        this.getCurrentLocation();
      }
    } catch (error) {
      console.error('获取位置权限失败:', error);
      this.setData({
        permissionDenied: true
      });
    }
  },
  
  /**
   * 获取当前位置
   */
  getCurrentLocation() {
    this.setData({ refreshingLocation: true });
    
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        const { latitude, longitude } = res;
        
        // 更新标记点
        const markers = [...this.data.mapInfo.markers];
        const userMarker = markers.find(m => m.id === 3);
        
        if (userMarker) {
          userMarker.latitude = latitude;
          userMarker.longitude = longitude;
        } else {
          markers.push({
            id: 3,
            latitude: latitude,
            longitude: longitude,
            title: '当前位置',
            iconPath: '/images/icons/current_location.png',
            width: 24,
            height: 24,
            zIndex: 99
          });
        }
        
        this.setData({
          'mapInfo.markers': markers,
          refreshingLocation: false
        });
      },
      fail: (err) => {
        console.error('获取当前位置失败:', err);
        this.setData({
          refreshingLocation: false,
          permissionDenied: true
        });
      }
    });
  },
  
  /**
   * 放大地图
   */
  zoomIn() {
    const { scale } = this.data.mapInfo;
    if (scale < 20) {
      this.setData({
        'mapInfo.scale': scale + 1
      });
    }
  },
  
  /**
   * 缩小地图
   */
  zoomOut() {
    const { scale } = this.data.mapInfo;
    if (scale > 3) {
      this.setData({
        'mapInfo.scale': scale - 1
      });
    }
  },
  
  /**
   * 标记点点击事件
   */
  onMarkerTap(e) {
    const markerId = e.markerId;
    const marker = this.data.mapInfo.markers.find(m => m.id === markerId);
    
    if (marker) {
      this.mapContext.moveToLocation({
        latitude: marker.latitude,
        longitude: marker.longitude,
        success: () => {
          // 在地图上移动到标记点
        }
      });
    }
  },
  
  /**
   * 地图区域改变事件
   */
  onRegionChange(e) {
    // 可以在这里处理地图视野变化事件
  },
  
  /**
   * 在地图应用中打开
   */
  openInMapApp() {
    const { fromCoordinates, toCoordinates } = this.data.trip;
    
    if (!fromCoordinates || !toCoordinates) {
      wx.showToast({
        title: '无法获取位置信息',
        icon: 'none'
      });
      return;
    }
    
    wx.openLocation({
      latitude: toCoordinates.latitude,
      longitude: toCoordinates.longitude,
      name: this.data.trip.toLocation,
      address: this.data.trip.toAddress,
      scale: 16
    });
  },
  
  /**
   * 联系发布者
   */
  contactCarrier() {
    const tripId = this.data.tripId;
    const publisherId = this.data.trip.publisherId;
    
    wx.navigateTo({
      url: `/pages/chat/chat?targetId=${publisherId}&postType=trip&postId=${tripId}`
    });
  },
  
  /**
   * 预约捎带
   */
  orderService() {
    wx.navigateTo({
      url: `/pages/order/order?tripId=${this.data.tripId}`
    });
  },
  
  /**
   * 取消行程
   */
  cancelTrip() {
    wx.showModal({
      title: '取消行程',
      content: '确定要取消该行程吗？该操作不可撤销。',
      success: (res) => {
        if (res.confirm) {
          // 调用取消行程的API
          wx.showLoading({
            title: '正在取消...',
          });
          
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
              title: '行程已取消',
              icon: 'success'
            });
            
            // 更新状态
            this.setData({
              'trip.status': 'cancelled',
              'trip.statusText': '已取消'
            });
          }, 1000);
        }
      }
    });
  }
})