// index.ts
// 获取应用实例
const app = getApp<IAppOption>()

Page({
  data: {},
  onLoad() {
    wx.showShareMenu({});
    wx.onBluetoothAdapterStateChange(checkBluetootEnable);
  },
  onShow() {
    checkBluetootEnable() && wx.authorize({
      scope: 'scope.bluetooth',
      success() {
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
      fail() {
        wx.showModal({
          title: '蓝牙授权失败',
          content: "请前往设置页面开启蓝牙授权",
          cancelText: "退出",
          success(res) {
            if (res.confirm) {
              wx.openSetting();
            } else if (res.cancel) {
              wx.exitMiniProgram()
            }
          }
        })
      },
    });
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

let modalVisible = false;

function checkBluetootEnable(): Boolean {
  if (!wx.getSystemSetting().bluetoothEnabled) {
    if (!modalVisible) {
      modalVisible = true;
      wx.showModal({
        title: "请打开蓝牙",
        content: "请前往系统设置中打开蓝牙开关",
        cancelText: "退出",
        success(res) {
          if (res.confirm) {
            !wx.getSystemSetting().bluetoothEnabled &&
              wx.openSystemBluetoothSetting();
          } else if (res.cancel) {
            wx.exitMiniProgram()
          }
          modalVisible = false;
        }
      });
    }
    return false;
  }
  return true;
}