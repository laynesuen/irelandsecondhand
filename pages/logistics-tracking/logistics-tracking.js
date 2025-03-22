const app = getApp();
const logisticsApi = require('../../utils/api/logistics');
const locationUtil = require('../../utils/location');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    orderId: '',
    orderInfo: null,
    logisticsInfo: null,
    trackingHistory: [],
    mapInfo: {
      latitude: 53.349805, // 爱尔兰都柏林默认位置
      longitude: -6.260310,
      scale: 11,
      markers: [],
      polyline: []
    },
    isLoading: true,
    trackingNumber: '',
    carrier: '',
    showTrackingForm: false,
    permissionDenied: false,
    deliveryProgress: 0 // 0-100的进度值
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.orderId) {
      this.setData({
        orderId: options.orderId
      });
      this.loadLogisticsInfo(options.orderId);
    } else {
      wx.showToast({
        title: '缺少订单ID',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 获取地图上下文
    this.mapContext = wx.createMapContext('logisticsMap');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 检查位置权限
    this.checkLocationPermission();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.refreshLogisticsInfo();
    wx.stopPullDownRefresh();
  },

  /**
   * 加载物流信息
   */
  async loadLogisticsInfo(orderId) {
    try {
      this.setData({ isLoading: true });
      
      // 获取物流状态
      const statusRes = await logisticsApi.getLogisticsStatus(orderId);
      
      if (statusRes.success) {
        this.setData({
          logisticsInfo: statusRes.data
        });
        
        // 设置快递单号和快递公司
        if (statusRes.data.trackingNumber && statusRes.data.carrier) {
          this.setData({
            trackingNumber: statusRes.data.trackingNumber,
            carrier: statusRes.data.carrier
          });
        }
        
        // 获取物流轨迹
        const trackRes = await logisticsApi.getLogisticsTrack(orderId);
        if (trackRes.success) {
          this.setData({
            trackingHistory: trackRes.data.tracks || []
          });
          
          // 更新地图
          this.updateMapWithTrackingData(trackRes.data.tracks);
          
          // 计算配送进度
          this.calculateDeliveryProgress(trackRes.data.tracks);
        }
      }
      
      this.setData({ isLoading: false });
    } catch (error) {
      console.error('加载物流信息失败', error);
      this.setData({ 
        isLoading: false 
      });
      wx.showToast({
        title: '加载物流信息失败',
        icon: 'none'
      });
    }
  },
  
  /**
   * 刷新物流信息
   */
  async refreshLogisticsInfo() {
    try {
      // 同步物流信息
      const syncRes = await logisticsApi.syncLogistics(this.data.orderId);
      if (syncRes.success) {
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        });
        
        // 重新加载物流信息
        this.loadLogisticsInfo(this.data.orderId);
      } else {
        wx.showToast({
          title: syncRes.message || '同步失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('刷新物流信息失败', error);
      wx.showToast({
        title: '刷新失败，请稍后重试',
        icon: 'none'
      });
    }
  },
  
  /**
   * 更新快递单号
   */
  async updateTrackingInfo() {
    try {
      const { orderId, trackingNumber, carrier } = this.data;
      
      if (!trackingNumber || !carrier) {
        wx.showToast({
          title: '请输入快递单号和快递公司',
          icon: 'none'
        });
        return;
      }
      
      const res = await logisticsApi.updateTrackingNumber(orderId, trackingNumber, carrier);
      if (res.success) {
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        });
        
        this.setData({
          showTrackingForm: false
        });
        
        // 重新加载物流信息
        this.loadLogisticsInfo(orderId);
      } else {
        wx.showToast({
          title: res.message || '更新失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('更新快递单号失败', error);
      wx.showToast({
        title: '更新失败，请稍后重试',
        icon: 'none'
      });
    }
  },
  
  /**
   * 切换显示快递单号输入表单
   */
  toggleTrackingForm() {
    this.setData({
      showTrackingForm: !this.data.showTrackingForm
    });
  },
  
  /**
   * 使用轨迹数据更新地图
   */
  updateMapWithTrackingData(trackingData) {
    if (!trackingData || trackingData.length === 0) return;
    
    try {
      // 提取所有有坐标的轨迹点
      const trackPoints = trackingData.filter(item => 
        item.coordinates && item.coordinates.latitude && item.coordinates.longitude
      );
      
      if (trackPoints.length === 0) return;
      
      // 排序轨迹点（按时间从旧到新）
      trackPoints.sort((a, b) => new Date(a.time) - new Date(b.time));
      
      // 提取坐标用于绘制路线
      const points = trackPoints.map(item => ({
        latitude: item.coordinates.latitude,
        longitude: item.coordinates.longitude
      }));
      
      // 设置起点和终点
      const startPoint = points[0];
      const currentPoint = points[points.length - 1];
      
      // 创建标记点
      const markers = [
        {
          id: 1,
          latitude: startPoint.latitude,
          longitude: startPoint.longitude,
          title: '起点',
          iconPath: '/images/icons/start_marker.png',
          width: 30,
          height: 30,
          callout: {
            content: '发货地',
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
          latitude: currentPoint.latitude,
          longitude: currentPoint.longitude,
          title: '当前位置',
          iconPath: '/images/icons/location_marker.png',
          width: 30,
          height: 30,
          callout: {
            content: '当前位置',
            color: '#000000',
            fontSize: 14,
            borderRadius: 4,
            padding: 8,
            display: 'BYCLICK',
            textAlign: 'center'
          }
        }
      ];
      
      // 如果有目的地坐标，添加目的地标记
      if (this.data.logisticsInfo && this.data.logisticsInfo.destination) {
        markers.push({
          id: 3,
          latitude: this.data.logisticsInfo.destination.latitude,
          longitude: this.data.logisticsInfo.destination.longitude,
          title: '目的地',
          iconPath: '/images/icons/end_marker.png',
          width: 30,
          height: 30,
          callout: {
            content: '目的地',
            color: '#000000',
            fontSize: 14,
            borderRadius: 4,
            padding: 8,
            display: 'BYCLICK',
            textAlign: 'center'
          }
        });
      }
      
      // 创建路线
      const polyline = [{
        points: points,
        color: '#0080ff',
        width: 5,
        dottedLine: false,
        arrowLine: true
      }];
      
      // 计算中心点（当前位置）
      const center = {
        latitude: currentPoint.latitude,
        longitude: currentPoint.longitude
      };
      
      // 更新地图信息
      this.setData({
        mapInfo: {
          latitude: center.latitude,
          longitude: center.longitude,
          scale: 11,
          markers: markers,
          polyline: polyline
        }
      });
    } catch (error) {
      console.error('更新地图数据失败', error);
    }
  },
  
  /**
   * 计算配送进度
   */
  calculateDeliveryProgress(trackingData) {
    if (!trackingData || trackingData.length === 0 || !this.data.logisticsInfo) return;
    
    // 这里可以根据物流状态或者时间来计算进度
    // 简单示例：根据当前时间和预计送达时间计算
    try {
      const { estimatedArrival, shippingTime } = this.data.logisticsInfo;
      
      if (!estimatedArrival || !shippingTime) return;
      
      const startTime = new Date(shippingTime).getTime();
      const endTime = new Date(estimatedArrival).getTime();
      const currentTime = new Date().getTime();
      
      if (currentTime >= endTime) {
        // 已到达预计送达时间
        this.setData({ deliveryProgress: 100 });
      } else if (currentTime <= startTime) {
        // 尚未开始配送
        this.setData({ deliveryProgress: 0 });
      } else {
        // 计算进度百分比
        const totalDuration = endTime - startTime;
        const passedDuration = currentTime - startTime;
        const progress = Math.floor((passedDuration / totalDuration) * 100);
        
        this.setData({ deliveryProgress: Math.min(progress, 99) });
      }
    } catch (error) {
      console.error('计算配送进度失败', error);
    }
  },
  
  /**
   * 检查位置权限
   */
  async checkLocationPermission() {
    try {
      const authorized = await locationUtil.requestLocationPermission();
      this.setData({
        permissionDenied: !authorized
      });
    } catch (error) {
      console.error('获取位置权限失败:', error);
      this.setData({
        permissionDenied: true
      });
    }
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
   * 在导航应用中打开
   */
  openInMapApp() {
    const { mapInfo } = this.data;
    const currentMarker = mapInfo.markers.find(m => m.id === 2);
    
    if (!currentMarker) {
      wx.showToast({
        title: '无法获取当前位置',
        icon: 'none'
      });
      return;
    }
    
    wx.openLocation({
      latitude: currentMarker.latitude,
      longitude: currentMarker.longitude,
      name: '物流当前位置',
      address: this.data.logisticsInfo.currentLocation || '正在运输中',
      scale: 16
    });
  },
  
  /**
   * 查看物流详情或复制单号
   */
  copyTrackingNumber() {
    const { trackingNumber } = this.data;
    if (!trackingNumber) {
      wx.showToast({
        title: '暂无物流单号',
        icon: 'none'
      });
      return;
    }
    
    wx.setClipboardData({
      data: trackingNumber,
      success: () => {
        wx.showToast({
          title: '复制成功',
          icon: 'success'
        });
      }
    });
  },
  
  /**
   * 回到订单详情页
   */
  goBackToOrderDetail() {
    wx.navigateBack();
  }
}) 