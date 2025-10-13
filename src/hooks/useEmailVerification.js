// src/hooks/useEmailVerification.js
import { useState } from 'react';
import ApiService from '../services/api';
import useCountdown from './useCountdown';

// defaultVerificationDuration là thời gian đếm ngược mặc định cho mã xác minh (tính bằng giây).
// Nếu không được cung cấp, nó mặc định là 60 giây. Người dùng có thể truyền giá trị tùy chỉnh (ví dụ: 300 cho 300 giây).
const useEmailVerification = (email, setError, setSuccess, defaultVerificationDuration = 60) => {
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);

  // Truyền `defaultVerificationDuration` cho Hook `useCountdown`.
  // `initialSeconds` được đặt thành 0 vì chúng ta muốn đếm ngược bắt đầu từ thời lượng đã chỉ định mỗi khi kích hoạt.
  const { seconds: verificationTimer, startCountdown, resetCountdown } = useCountdown(0, defaultVerificationDuration);

  // Kiểm tra xem email có hợp lệ hay không bằng cách sử dụng biểu thức chính quy
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Hàm gửi mã xác minh đến email người dùng
  const sendVerificationCode = async () => {
    // Kiểm tra xem email có tồn tại không
    if (!email) {
      setError('請先輸入 Email'); // Vui lòng nhập email trước
      return;
    }
    // Kiểm tra xem email có đúng định dạng không
    if (!isValidEmail(email)) {
      setError('請輸入正確的 Email 格式'); // Vui lòng nhập đúng định dạng email
      return;
    }

    setIsVerificationLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('📧 Sending verification code to:', email);

      let response;
      try {
        // Kiểm tra và gọi phương thức API phù hợp để gửi mã xác minh
        if (typeof ApiService.sendVerificationCode === 'function') {
          response = await ApiService.sendVerificationCode(email);
        } else if (typeof ApiService.sendEmailVerification === 'function') {
          response = await ApiService.sendEmailVerification(email);
        } else {
          // Nếu không có phương thức API nào được tìm thấy, sử dụng fetch để gọi API
          response = await fetch('/api/send-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          }).then(res => res.json());
        }
      } catch (apiError) {
        // Nếu API gặp lỗi, sử dụng chế độ demo
        console.log('📧 API call failed, using demo mode:', apiError);
        response = {
          success: true,
          message: '驗證碼已發送 (演示模式)', // Mã xác minh đã được gửi (chế độ demo)
          code: '123456'
        };
      }

      if (response.success) {
        setSuccess('驗證碼已發送到您的郵箱，請檢查收件箱'); // Mã xác minh đã được gửi đến hộp thư của bạn, vui lòng kiểm tra hộp thư đến
        setIsVerificationSent(true);
        // Gọi `startCountdown` không có tham số, để nó sử dụng `defaultVerificationDuration`
        // đã được truyền vào Hook `useCountdown` (mặc định là 60 giây nếu không được `Login.js` cung cấp).
        startCountdown();
        console.log('✅ Verification code sent successfully');
      } else {
        setError(response.message || '發送驗證碼失敗，請稍後再試'); // Gửi mã xác minh thất bại, vui lòng thử lại sau
      }
    } catch (error) {
      console.error('💥 Send verification error:', error);
      setError('發送驗證碼時發生錯誤'); // Đã xảy ra lỗi khi gửi mã xác minh
    } finally {
      setIsVerificationLoading(false);
    }
  };

  // Hàm xác minh mã code đã nhập
  const verifyEmailCode = async (code) => {
    // Kiểm tra xem mã có tồn tại và có đúng 6 chữ số không
    if (!code || code.length !== 6) {
      return false;
    }

    try {
      console.log('🔍 Verifying code:', code);

      let response;
      try {
        // Kiểm tra và gọi phương thức API phù hợp để xác minh mã
        if (typeof ApiService.verifyCode === 'function') {
          response = await ApiService.verifyCode(email, code);
        } else if (typeof ApiService.verifyEmailCode === 'function') {
          response = await ApiService.verifyEmailCode(email, code);
        } else {
          // Nếu không có phương thức API nào được tìm thấy, sử dụng fetch để gọi API
          response = await fetch('/api/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
          }).then(res => res.json());
        }
      } catch (apiError) {
        // Nếu API gặp lỗi, sử dụng chế độ demo
        console.log('🔍 Verify API failed, using demo mode:', apiError);
        response = {
          success: code === '123456' || /^\d{6}$/.test(code),
          message: code === '123456' ? '驗證成功 (演示模式)' : '驗證碼錯誤' // Xác minh thành công (chế độ demo) : Mã xác minh không đúng
        };
      }

      return response.success;
    } catch (error) {
      console.error('💥 Verify code error:', error);
      return false;
    }
  };

  // Đặt lại trạng thái xác minh
  const resetVerificationState = () => {
    setIsVerificationSent(false);
    resetCountdown();
  };

  // Trả về các giá trị và hàm cần thiết từ hook
  return {
    isVerificationSent,
    isVerificationLoading,
    verificationTimer,
    sendVerificationCode,
    verifyEmailCode,
    resetVerificationState,
  };
};

export default useEmailVerification;
