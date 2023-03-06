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
    if (!checkBluetootEnable() || app.globalData.BLEPeripheralServer) return;
    wx.showLoading({ title: "正在初始化", mask: true });
    wx.authorize({
      scope: 'scope.bluetooth',
      success() {
        wx.openBluetoothAdapter({
          mode: 'peripheral',
          success() {
            wx.createBLEPeripheralServer()
              .then(res => app.globalData.BLEPeripheralServer = res.server)
              .then(() => wx.hideLoading());
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
    sendCMD(app.globalData.BLEPeripheralServer, controlType.OPEN);
  },
  stop() {
    sendCMD(app.globalData.BLEPeripheralServer, controlType.STOP);
  },
  close() {
    sendCMD(app.globalData.BLEPeripheralServer, controlType.CLOSE);
  },
  openAndClose() {
    sendCMD(app.globalData.BLEPeripheralServer, controlType.OPENCLOSE);
  },
  cancel() {
    if (!app.globalData.BLEPeripheralServer) return;
    app.globalData.BLEPeripheralServer.stopAdvertising();
  },
  enroll() {
    wx.showModal({
      title: "注册指纹",
      placeholderText: "请输入管理员密码",
      editable: true,
      success: res => {
        if (res.content == 'hkjmbzd') {
          sendCMD(app.globalData.BLEPeripheralServer, controlType.ENROLL);
          setTimeout(this.cancel, 800);
          return;
        }
        if (res.cancel) return;
        wx.showToast({ title: '密码错误', icon: 'error' });
      }
    });
  },
  config() {
    wx.showModal({
      title: "设置iBeacon参数",
      placeholderText: "请输入参数值：Enter,Debounce,Leave",
      editable: true,
      success: res => {
        if (res.content.length == 6) {
          const data: number[] = advertisingData[controlType.CONFIG];
          data[13] = parseInt(res.content.substr(0, 2));
          data[14] = parseInt(res.content.substr(2, 2));
          data[15] = parseInt(res.content.substr(4, 2));
          sendCMD(app.globalData.BLEPeripheralServer, controlType.CONFIG, data);
          setTimeout(this.cancel, 800);
          return;
        }
        if (res.cancel) return;
        wx.showToast({ title: '参数不合法', icon: 'error' });
      }
    });
  },
  download() {
    wx.setClipboardData({ data: 'https://gitee.com/tangyusi97/DoorControlAPK/releases/download/v1.1.0/door-control.apk' })
  }
})


enum controlType { OPEN, STOP, CLOSE, OPENCLOSE, ENROLL, CONFIG };

const advertisingData: number[][] = [
  [0x6D, 0xB6, 0x43, 0x4F, 0x9E, 0x0F, 0x87, 0x91, 0x23, 0x6F, 0xCB, 0xCF, 0x65, 0xDA, 0x51, 0x3B],
  [0x6D, 0xB6, 0x43, 0x4F, 0x9E, 0x0F, 0x87, 0x91, 0x23, 0x6F, 0xCB, 0xCF, 0x65, 0xBA, 0x57, 0x58],
  [0x6D, 0xB6, 0x43, 0x4F, 0x9E, 0x0F, 0x87, 0x91, 0x23, 0x6F, 0xCB, 0xCF, 0x65, 0x7A, 0x5B, 0x9E],
  [0x6D, 0xB6, 0x43, 0x4F, 0x9E, 0x0F, 0x87, 0x91, 0x23, 0x6F, 0xCB, 0xCF, 0x65, 0x87, 0x5E, 0xA4],
  [0x6D, 0xB6, 0x43, 0x4F, 0x9E, 0x0F, 0x87, 0x91, 0x23, 0x6F, 0xCB, 0xCF, 0x65, 0xC9, 0x54, 0x8D],
  [0x6D, 0xB6, 0x43, 0x4F, 0x9E, 0x0F, 0x87, 0x91, 0x23, 0x6F, 0xCB, 0xCF, 0x6A],
]

function sendCMD(server: WechatMiniprogram.BLEPeripheralServer | undefined, type: controlType, data?: number[]) {
  if (!server) return;
  wx.vibrateShort({ type: 'heavy' });

  let _data: ArrayBuffer = new Uint8Array(advertisingData[type]);
  if (data) {
    _data = new Uint8Array(data);
  }

  server.startAdvertising({
    advertiseRequest: {
      manufacturerData: [{
        manufacturerId: "0xFFF0",
        manufacturerSpecificData: _data
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