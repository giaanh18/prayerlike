// src/services/appbridge.js

export const AppBridge = {
  // 檢查是否在 Flutter WebView 環境中
  isApp: () => !!window.flutter_inappwebview,

  // 1. 登入後同步使用者 ID 到 App 綁定推播
  syncLogin: (userId) => {
    if (AppBridge.isApp()) {
      // 呼叫 Flutter 註冊的 OneSignalLogin Handler
      window.flutter_inappwebview.callHandler('OneSignalLogin', String(userId));
      console.log("📱 [AppBridge] 已通知 App 綁定推播: ", userId);
    } else {
      console.log("💻 [AppBridge] 非 App 環境，略過推播綁定 (User:", userId, ")");
    }
  },

  // 2. 登出後通知 App 解除綁定
  syncLogout: () => {
    if (AppBridge.isApp()) {
      // 呼叫 Flutter 註冊的 OneSignalLogout Handler
      window.flutter_inappwebview.callHandler('OneSignalLogout');
      console.log("📱 [AppBridge] 已通知 App 解除推播綁定");
    } else {
      console.log("💻 [AppBridge] 非 App 環境，略過推播解除綁定");
    }
  }
};