Component({
  data: {
    selected: 0,
    color: "#999999",
    selectedColor: "#3cc51f",
    list: [{
      pagePath: "/pages/index/index",
      text: "首页",
      iconPath: "/images/tabbar/home.png",
      selectedIconPath: "/images/tabbar/home-active.png"
    }, {
      pagePath: "/pages/publish/publish",
      text: "发布",
      iconPath: "/images/tabbar/publish.png",
      selectedIconPath: "/images/tabbar/publish-active.png",
      isSpecial: true
    }, {
      pagePath: "/pages/chat-list/chat-list",
      text: "消息",
      iconPath: "/images/tabbar/message.png",
      selectedIconPath: "/images/tabbar/message-active.png"
    }, {
      pagePath: "/pages/profile/profile",
      text: "我的",
      iconPath: "/images/tabbar/profile.png",
      selectedIconPath: "/images/tabbar/profile-active.png"
    }]
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      wx.switchTab({
        url
      });
      this.setData({
        selected: data.index
      });
    }
  }
});