// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 返回健康检查结果
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: cloud.DYNAMIC_CURRENT_ENV,
      version: '1.0.0'
    }
  } catch (error) {
    console.error('健康检查失败:', error)
    return {
      status: 'error',
      error: error.message
    }
  }
} 