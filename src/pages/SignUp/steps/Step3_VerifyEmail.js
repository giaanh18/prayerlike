import React, { useState, useRef } from 'react';
import BrandLogo from '../../../components/BrandLogo/BrandLogo';
import ActionButton from '../../../components/ActionButton/ActionButton';
import logoImage from '../../../assets/images/pray-logo.png';
import './Step3_VerifyEmail.css';

const Step3_VerifyEmail = ({ email, onNext, onBack }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const isProcessing = useRef(false); // ← THÊM FLAG ĐỂ NGĂN DOUBLE TRIGGER

  const handleChange = (index, value) => {
    // ✅ NGĂN CHẶN XỬ LÝ ĐỒNG THỜI
    if (isProcessing.current) return;
    isProcessing.current = true;

    // Chỉ cho phép nhập số
    if (!/^\d*$/.test(value)) {
      isProcessing.current = false;
      return;
    }

    // Xử lý xóa
    if (value === '') {
      const newCode = [...code];
      newCode[index] = '';
      setCode(newCode);
      isProcessing.current = false;
      return;
    }

    // Chỉ lấy ký tự cuối cùng
    const lastChar = value.slice(-1);

    // Ngăn chặn cập nhật trùng
    if (code[index] === lastChar) {
      isProcessing.current = false;
      return;
    }

    const newCode = [...code];
    newCode[index] = lastChar;
    setCode(newCode);

    // Tự động chuyển sang ô tiếp theo
    if (index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }

    // ✅ RESET FLAG SAU KHI XỬ LÝ XONG
    setTimeout(() => {
      isProcessing.current = false;
    }, 50);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = pastedData.split('');
    setCode([...newCode, ...Array(6 - newCode.length).fill('')]);
    
    const lastIndex = Math.min(newCode.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleSubmit = () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      alert('❌ Vui lòng nhập đủ 6 số');
      return;
    }

    console.log('✅ Mã xác minh:', verificationCode);
    onNext();
  };

  const handleResend = () => {
    alert('📧 Đã gửi lại mã xác minh đến ' + email);
  };

  return (
    <div className="step3-container">
      <BrandLogo logoSrc={logoImage} size="medium" />
      
      <div className="step3-content">
        <p className="step3-title">Verification code sent to</p>
        <p className="step3-email">{email}</p>
        <p className="step3-instruction">Enter the 6-digit code from your email</p>

        <div className="verification-code-inputs" onPaste={handlePaste}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="code-input"
              autoFocus={index === 0}
            />
          ))}
        </div>

        <button className="resend-button" onClick={handleResend}>
          resend code
        </button>
      </div>

      <ActionButton
        onClick={handleSubmit}
        variant="primary"
        size="medium"
        className="step3-button"
      >
        continue
      </ActionButton>
    </div>
  );
};

export default Step3_VerifyEmail;
