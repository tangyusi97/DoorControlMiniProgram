// index.ts
// 获取应用实例
const app = getApp<IAppOption>()

Page({
  data: {
    disabled: {
      open: false,
      stop: false,
      close: false,
    }
  },
  onLoad() {
    wx.openBluetoothAdapter({
      mode: 'peripheral',
      success() {
        wx.createBLEPeripheralServer()
          .then(res => app.globalData.BLEPeripheralServer = res.server);
      },
      fail(res) {
        console.log(res);
        wx.showModal({
          title: '蓝牙初始化失败',
          content: res.errMsg,
          showCancel: false
        })
      },
    })
  },
  open() {
    controlling(app.globalData.BLEPeripheralServer, controlType.OPEN);
  },
  stop() {
    controlling(app.globalData.BLEPeripheralServer, controlType.STOP);
  },
  close() {
    controlling(app.globalData.BLEPeripheralServer, controlType.CLOSE);
  },
  cancel() {
    if (!app.globalData.BLEPeripheralServer) return;
    app.globalData.BLEPeripheralServer.stopAdvertising();
  }
})


enum controlType { OPEN, STOP, CLOSE };

const advertisingData: number[][] = [
  [0x6D, 0xB6, 0x43, 0x4F, 0x9E, 0x0F, 0x87, 0x91, 0x23, 0x6F, 0xCB, 0xCF, 0x65, 0xDA, 0x51, 0x3B],
  [0x6D, 0xB6, 0x43, 0x4F, 0x9E, 0x0F, 0x87, 0x91, 0x23, 0x6F, 0xCB, 0xCF, 0x65, 0xBA, 0x57, 0x58],
  [0x6D, 0xB6, 0x43, 0x4F, 0x9E, 0x0F, 0x87, 0x91, 0x23, 0x6F, 0xCB, 0xCF, 0x65, 0x7A, 0x5B, 0x9E],
]

function controlling(server: WechatMiniprogram.BLEPeripheralServer | undefined, type: controlType) {
  if (!server) return;
  server.startAdvertising({
    advertiseRequest: {
      manufacturerData: [{
        manufacturerId: "0xFFF0",
        manufacturerSpecificData: new Uint8Array(advertisingData[type])
      }],
    },
    powerLevel: 'high',
    fail(err) {
      wx.showModal({
        title: '蓝牙广播失败',
        content: err.errMsg,
        showCancel: false,
      })
    }
  });

}