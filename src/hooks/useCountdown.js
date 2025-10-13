// src/hooks/useCountdown.js
import { useState, useEffect, useRef } from 'react';

// Hook tùy chỉnh để quản lý chức năng đếm ngược.
// Mặc định đếm ngược 60 giây, nhưng cho phép người dùng truyền thời lượng chờ tùy chỉnh thông qua `startCountdown`.
const useCountdown = (initialSeconds = 0, defaultDuration = 60) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const timerRef = useRef(null); // Sử dụng useRef để lưu ID của setInterval.
  // 使用 useRef 來保存 setInterval 的 ID。

  // Bắt đầu đếm ngược với thời lượng đã cho. Nếu không có thời lượng nào được cung cấp, sử dụng `defaultDuration`.
  const startCountdown = (durationToUse) => {
    // Nếu `durationToUse` được truyền vào, sử dụng nó; nếu không, sử dụng `defaultDuration` của Hook.
    const actualDuration = durationToUse !== undefined ? durationToUse : defaultDuration;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setSeconds(actualDuration);
    timerRef.current = setInterval(() => {
      setSeconds(prevSeconds => {
        if (prevSeconds <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prevSeconds - 1;
      });
    }, 1000);
  };

  // Đặt lại bộ đếm ngược về 0 và xóa bất kỳ bộ hẹn giờ đang chạy nào.
  const resetCountdown = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setSeconds(0);
  };

  // Xóa bộ hẹn giờ khi thành phần bị hủy gắn kết.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return { seconds, startCountdown, resetCountdown };
};

export default useCountdown;
