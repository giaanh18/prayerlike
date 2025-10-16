// ./src/pages/Login/login.js

// ========================================
// 📦 IMPORT CÁC THƯ VIỆN VÀ COMPONENTS
// ========================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Hook để điều hướng giữa các trang
import ApiService from '../../services/api'; // Service để gọi API backend
import useEmailVerification from '../../hooks/useEmailVerification'; // Custom hook xử lý xác thực email

// Các component UI đã được tái sử dụng
import LoginBackground from '../../components/LoginBackground/LoginBackground'; // Nền gradient
import BrandLogo from '../../components/BrandLogo/BrandLogo'; // Logo thương hiệu
import FormInput from '../../components/FormInput/FormInput'; // Input form
import ActionButton from '../../components/ActionButton/ActionButton'; // Nút hành động
import CircleButton from '../../components/CircleButton/CircleButton'; // Nút tròn cho social login

// Các file ảnh
import logoImage from '../../assets/images/pray-logo.png';
import appleIcon from '../../assets/icons/apple-icon.png';
import facebookIcon from '../../assets/icons/facebook-icon.png';
import googleIcon from '../../assets/icons/google-icon.png';

import './login.css'; // File CSS riêng cho trang login

// ========================================
// 🎯 COMPONENT CHÍNH
// ========================================

const Login = ({ onLogin }) => { // onLogin: callback từ component cha khi đăng nhập thành công
  
  // ========================================
  // 🔧 KHỞI TẠO HOOKS
  // ========================================
  
  const navigate = useNavigate(); // Hook để chuyển trang

  // ========================================
  // 📊 STATE MANAGEMENT
  // ========================================
  
  const [email, setEmail] = useState(''); // Lưu email người dùng nhập
  const [isLoading, setIsLoading] = useState(false); // Trạng thái loading khi xử lý đăng nhập
  const [loginSuccessMessage, setLoginSuccessMessage] = useState(''); // Thông báo đăng nhập thành công
  const [error, setError] = useState(''); // Thông báo lỗi
  const [success, setSuccess] = useState(''); // Thông báo thành công
  const [verificationCode, setVerificationCode] = useState(''); // Lưu mã xác thực 6 số

  // Thời gian đếm ngược mặc định: 90 giây
  const EMAIL_VERIFICATION_COUNTDOWN_DEFAULT_SECONDS = 90;

  // ========================================
  // 🎣 CUSTOM HOOK XỬ LÝ XÁC THỰC EMAIL
  // ========================================
  
  const {
    isVerificationSent,      // Boolean: Đã gửi mã xác thực chưa?
    isVerificationLoading,   // Boolean: Đang gửi mã?
    verificationTimer,       // Number: Thời gian đếm ngược (90, 89, 88...)
    sendVerificationCode,    // Function: Gửi mã xác thực
    verifyEmailCode,         // Function: Kiểm tra mã xác thực
    resetVerificationState,  // Function: Reset lại trạng thái xác thực
  } = useEmailVerification(
    email,                   // Truyền email vào hook
    setError,                // Callback để set lỗi
    () => {},                // Callback success (không dùng)
    EMAIL_VERIFICATION_COUNTDOWN_DEFAULT_SECONDS // Thời gian đếm ngược
  );

  // ========================================
  // 🎉 HÀM HIỂN THỊ THÔNG BÁO ĐĂNG NHẬP THÀNH CÔNG
  // ========================================
  
  const showLoginSuccess = (method, userData) => {
    // Các thông báo tương ứng với từng phương thức đăng nhập
    const messages = {
      'email_verification': '驗證碼登入成功，正在進入系統', // Đăng nhập bằng mã xác thực
      'google_social': 'Google 登入成功，正在進入系統',
      'facebook_social': 'Facebook 登入成功，正在進入系統',
      'apple_social': 'Apple 登入成功，正在進入系統'
    };
    
    // Hiển thị thông báo tương ứng
    setLoginSuccessMessage(messages[userData.loginMethod] || '登入成功，正在進入系統');
    
    // Sau 1 giây:
    setTimeout(() => {
      setLoginSuccessMessage(''); // Xóa thông báo
      onLogin(userData); // Gọi callback từ component cha
      
      // Sau thêm 0.1 giây nữa → Chuyển sang trang /main
      setTimeout(() => {
        navigate('/main', { replace: true }); // replace: true → không lưu history
      }, 100);
    }, 1000);
  };

  // ========================================
  // 📧 XỬ LÝ KHI NGƯỜI DÙNG THAY ĐỔI EMAIL
  // ========================================
  
  const handleEmailChange = (e) => {
    setEmail(e.target.value); // Cập nhật email
    setError(''); // Xóa thông báo lỗi
    setSuccess(''); // Xóa thông báo thành công
    setLoginSuccessMessage(''); // Xóa thông báo đăng nhập
    
    // Nếu đã gửi mã xác thực → Reset lại
    if (isVerificationSent) {
      resetVerificationState(); // Reset trạng thái xác thực
      setVerificationCode(''); // Xóa mã đã nhập
    }
  };

  // ========================================
  // 🔢 XỬ LÝ KHI NGƯỜI DÙNG NHẬP MÃ XÁC THỰC
  // ========================================
  
  const handleVerificationCodeChange = (e) => {
    // Chỉ cho phép nhập số và tối đa 6 ký tự
    const value = e.target.value
      .replace(/\D/g, '')  // Loại bỏ tất cả ký tự không phải số (\D = non-digit)
      .slice(0, 6);        // Chỉ lấy 6 ký tự đầu
    
    setVerificationCode(value); // Cập nhật mã
    setError(''); // Xóa thông báo lỗi
  };

  // ========================================
  // ✉️ XỬ LÝ KHI NHẤN NÚT "VERIFY"
  // ========================================
  
  const handleVerify = async () => {
    // 1. Kiểm tra email có được nhập không
    if (!email) {
      setError('請輸入 Email'); // "Vui lòng nhập Email"
      return;
    }

    // 2. Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex chuẩn cho email
    if (!emailRegex.test(email)) {
      setError('請輸入正確的 Email 格式'); // "Vui lòng nhập đúng định dạng Email"
      return;
    }

    // 3. Gọi hàm gửi mã xác thực từ custom hook
    await sendVerificationCode();
  };

  // ========================================
  // 🔐 XỬ LÝ KHI NHẤN NÚT "CONFIRM"
  // ========================================
  
  const handleLogin = async () => {
    console.log('🔐 驗證碼確認流程開始'); // "Bắt đầu quy trình xác nhận mã"
    console.log('📧 Email:', email);
    console.log('🔢 驗證碼:', verificationCode); // "Mã xác thực"

    // ========================================
    // 📋 CÁC BƯỚC KIỂM TRA
    // ========================================

    // 1. Kiểm tra email
    if (!email) {
      setError('請輸入 Email');
      return;
    }

    // 2. Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('請輸入正確的 Email 格式');
      return;
    }

    // 3. Kiểm tra đã gửi mã chưa
    if (!isVerificationSent) {
      setError('請先發送驗證碼'); // "Vui lòng gửi mã xác thực trước"
      return;
    }

    // 4. Kiểm tra mã xác thực phải đủ 6 số
    if (!verificationCode || verificationCode.length !== 6) {
      setError('請輸入 6 位數驗證碼'); // "Vui lòng nhập mã 6 số"
      return;
    }

    // ========================================
    // ✅ XÁC THỰC MÃ VỚI BACKEND
    // ========================================

    // Gọi hàm verify từ custom hook
    const isCodeValid = await verifyEmailCode(verificationCode);
    
    // Nếu mã sai
    if (!isCodeValid) {
      setError('驗證碼錯誤，請重新輸入'); // "Mã sai, vui lòng nhập lại"
      return;
    }

    // ========================================
    // 🚀 XỬ LÝ SAU KHI XÁC THỰC THÀNH CÔNG
    // ========================================

    setIsLoading(true); // Bật loading
    setError(''); // Xóa lỗi
    setSuccess(''); // Xóa thông báo thành công

    try {
      console.log('📡 呼叫後端 API 驗證使用者狀態...'); // "Gọi API backend kiểm tra trạng thái user"

      // ========================================
      // 💡 PHẦN NÀY CÓ THỂ GỌI API THẬT
      // ========================================
      // const response = await ApiService.checkUserExists(email, verificationCode);
      // if (response.isNewUser) {
      //   navigate('/signup', { state: { email, verificationCode, verified: true } });
      // } else {
      //   navigate('/main', { state: { userData: response.user } });
      // }

      // ========================================
      // 🔧 HIỆN TẠI: LUÔN CHUYỂN SANG TRANG ĐĂNG KÝ
      // ========================================
      
      console.log('✅ 驗證碼正確，跳轉到註冊頁面'); // "Mã đúng, chuyển sang trang đăng ký"
      setSuccess('第一次登入，正在前往註冊頁面...'); // "Lần đầu đăng nhập, đang chuyển đến trang đăng ký"
      
      // Sau 1 giây → Chuyển trang
      setTimeout(() => {
        navigate('/signup', { 
          state: { 
            email: email,                // Truyền email
            verificationCode: verificationCode, // Truyền mã xác thực
            verified: true               // Đánh dấu đã xác thực
          } 
        });
      }, 1000);

    } catch (error) {
      console.error('💥 驗證過程發生錯誤:', error); // "Lỗi trong quá trình xác thực"
      setError('驗證時發生錯誤，請稍後再試'); // "Có lỗi xảy ra, vui lòng thử lại"
    } finally {
      setIsLoading(false); // Tắt loading
    }
  };

  // ========================================
  // 🌐 XỬ LÝ ĐĂNG NHẬP BẰNG MẠNG XÃ HỘI
  // ========================================
  
  const handleSocialLogin = (provider) => {
    console.log(`🔐 Social login with ${provider}`);

    // Tạo dữ liệu user giả lập (trong thực tế sẽ nhận từ OAuth)
    const userData = {
      id: `${provider} User`,
      name: `${provider} User`,
      email: `user@${provider.toLowerCase()}.com`,
      avatar: `https://ui-avatars.com/api/?name=${provider}&background=667eea&color=fff`,
      token: `${provider.toLowerCase()}-token-${Date.now()}`, // Token giả
      loginMethod: `${provider.toLowerCase()}_social` // Phương thức đăng nhập
    };

    console.log('🚀 Social login successful');
    showLoginSuccess(`${provider} 社交登入`, userData); // Hiển thị thông báo thành công
  };

  // ========================================
  // 🎨 RENDER GIAO DIỆN
  // ========================================
  
  return (
    <LoginBackground
      gradientColors={['#142049', '#848484', '#FFDF9E']} // Màu gradient cho nền
    >
      <div className="login-page">
        {/* ========================================
            📦 NỘI DUNG CHÍNH
            ======================================== */}
        <div className="login-main-content">
          
          {/* ========================================
              🏷️ LOGO THƯƠNG HIỆU
              ======================================== */}
          <BrandLogo 
            logoSrc={logoImage}
            size="medium"
          />
          
          {/* ========================================
              📝 FORM ĐĂNG NHẬP
              ======================================== */}
          <div className="login-form-new">
            
            {/* ========================================
                📧 HÀNG EMAIL + NÚT VERIFY
                ======================================== */}
            <div className="email-verify-row">
              {/* Input Email */}
              <FormInput
                type="email"
                placeholder="EMAIL"
                value={email}
                onChange={handleEmailChange}
                disabled={!!loginSuccessMessage} // Disable nếu đang hiện thông báo thành công
                className="email-input email-left-align"
              />
              
              {/* Nút Verify/Resend */}
              <ActionButton
                onClick={handleVerify}
                variant="primary"
                size="medium"
                disabled={
                  !email ||                      // Chưa nhập email
                  isVerificationLoading ||       // Đang gửi mã
                  verificationTimer > 0 ||       // Đang đếm ngược
                  !!loginSuccessMessage          // Đang hiện thông báo thành công
                }
                loading={isVerificationLoading}  // Hiện loading khi gửi
                className={`verify-button ${email ? 'has-email' : ''}`}
              >
                {/* Hiển thị text động:
                    - Nếu đang đếm ngược: "90s", "89s"...
                    - Nếu đã gửi và hết thời gian: "RESEND"
                    - Nếu chưa gửi: "VERIFY" */}
                {verificationTimer > 0 ? `${verificationTimer}s` : 
                 isVerificationSent ? 'RESEND' : 'VERIFY'}
              </ActionButton>
            </div>
            
            {/* ========================================
                🔢 INPUT MÃ XÁC THỰC (chỉ hiện sau khi gửi mã)
                ======================================== */}
            {isVerificationSent && (
              <FormInput
                placeholder="123456"
                value={verificationCode}
                onChange={handleVerificationCodeChange}
                disabled={!!loginSuccessMessage}
                className="verification-code-input"
              />
            )}
            
            {/* ========================================
                ⚠️ THÔNG BÁO LỖI
                ======================================== */}
            {error && (
              <div className="message-container error-message">
                {error}
              </div>
            )}

            {/* ========================================
                ✅ THÔNG BÁO THÀNH CÔNG
                ======================================== */}
            {success && (
              <div className="message-container success-message">
                {success}
              </div>
            )}

            {/* ========================================
                🎉 THÔNG BÁO ĐĂNG NHẬP THÀNH CÔNG
                ======================================== */}
            {loginSuccessMessage && (
              <div className="message-container login-success-message">
                {loginSuccessMessage}
              </div>
            )}
            
            {/* ========================================
                🔐 NÚT CONFIRM
                ======================================== */}
            <ActionButton
              onClick={handleLogin}
              variant="primary"
              size="medium"
              disabled={
                isLoading ||                     // Đang xử lý
                !email ||                        // Chưa nhập email
                !isVerificationSent ||           // Chưa gửi mã
                verificationCode.length !== 6 || // Mã chưa đủ 6 số
                !!loginSuccessMessage            // Đang hiện thông báo thành công
              }
              loading={isLoading}
              className={`login-button ${verificationCode.length === 6 ? 'has-code' : ''}`}
            >
              CONFIRM
            </ActionButton>
          </div>
          
          {/* ========================================
              🌐 CÁC NÚT ĐĂNG NHẬP MẠNG XÃ HỘI
              ======================================== */}
          <div className="social-login-container">
            {/* Nút Apple */}
            <CircleButton
              provider="Apple"
              iconSrc={appleIcon}
              onClick={() => handleSocialLogin('Apple')}
              size="medium"
            />
            
            {/* Nút Facebook */}
            <CircleButton
              provider="Facebook"
              iconSrc={facebookIcon}
              onClick={() => handleSocialLogin('Facebook')}
              size="medium"
            />
            
            {/* Nút Google */}
            <CircleButton
              provider="Google"
              iconSrc={googleIcon}
              onClick={() => handleSocialLogin('Google')}
              size="medium"
            />
          </div>
        </div>
      </div>
    </LoginBackground>
  );
};

// ========================================
// 📤 EXPORT COMPONENT
// ========================================

export default Login;
