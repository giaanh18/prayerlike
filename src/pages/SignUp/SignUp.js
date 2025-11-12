// src/pages/SignUp/SignUp.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthAPI from '../../services/authApi';

import LoginBackground from '../../components/LoginBackground/LoginBackground';
import BrandLogo from '../../components/BrandLogo/BrandLogo';
import FormInput from '../../components/FormInput/FormInput';
import ActionButton from '../../components/ActionButton/ActionButton';

import Step2Terms from './steps/Step2_Terms';
import Step4Transition from './steps/Step4_Transition';
import Step5TribeInfo from './steps/Step5_TribeInfo';
import Step6TribeSelection from './steps/Step6_TribeSelection';

import logoImage from '../../assets/images/pray-logo.png';
import './SignUp.css';

const SignUp = ({ onSignUpComplete, onReturnToLogin }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const verifiedEmail = location.state?.email || location.state?.existingProfile?.email || '';
    const sessionData = location.state?.sessionData || null;
    const initialName = location.state?.existingProfile?.name || '';
    const initialUserId = location.state?.existingProfile?.user_id || location.state?.existingProfile?.id || '';
    const provider = location.state?.sessionData?.provider || 'email';

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        userId: initialUserId,
        name: initialName,
        email: verifiedEmail,
        termsAccepted: false,
        emailVerified: true,
        tribe: null, 
        provider: provider
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        console.log('🟢 [SignUp.js] 元件已成功載入 (MOUNTED)。');
        console.log('📋 [SignUp.js] 載入時的初始 formData:', formData);
        console.log('🔑 [SignUp.js] 載入時的 sessionData:', sessionData);
    }, []); 

    // ========================================
    // 📝 FORM HANDLERS
    // ========================================
    const handleChange = (field, value) => {
        if (field === 'userId') {
            const cleanValue = value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
            value = cleanValue;
        }
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const updateFormData = (data) => {
        console.log('🔄 [SignUp.js] updateFormData 被呼叫，傳入資料:', data);
        setFormData(prev => {
            const newState = { ...prev, ...data };
            console.log('📋 [SignUp.js] formData 狀態已更新為:', newState);
            return newState;
        });
    };

    // ========================================
    // ✅ VALIDATION
    // ========================================
    const validateForm = () => {
        const newErrors = {};
        if (!formData.userId.trim()) {
            newErrors.userId = '請輸入 User ID';
        } else if (formData.userId.length < 3) {
            newErrors.userId = 'User ID 必須至少 3 個字元';
        } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.userId)) {
            newErrors.userId = 'User ID 只能包含英文、數字、底線和連字號';
        }
        if (!formData.name.trim()) {
            newErrors.name = '請輸入您的名稱';
        } else if (formData.name.length < 2) {
            newErrors.name = '名稱必須至少 2 個字元';
        }
        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email 格式不正確';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ========================================
    // 🔄 NAVIGATION HANDLERS
    // ========================================
    const handleNext = () => {
        if (validateForm()) {
            console.log('✅ [SignUp.js] Step 1 驗證通過，資料:', formData);
            setCurrentStep(2);
        }
    };
    
    const handleReturnToLogin = () => {
        if (isSubmitting || isLoading) return;
        if (typeof onReturnToLogin === 'function') {
            console.log('🚪 [SignUp.js] 呼叫 onReturnToLogin 返回登入');
            onReturnToLogin();
        } else {
            console.error('[SignUp.js] onReturnToLogin prop 未提供');
            navigate('/login', { replace: true });
        }
    };

    const handleBack = () => {
        if (currentStep === 1) {
            handleReturnToLogin();
        } else if (currentStep !== 4) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const prevStep = () => {
        if (currentStep === 5) {
            setCurrentStep(2);
        } else if (currentStep > 1 && currentStep !== 4) {
            setCurrentStep(prev => prev - 1);
        }
    };

    // ========================================
    // 📍 STEP HANDLERS
    // ========================================
    const handleStep2Next = (termsData) => {
        updateFormData({ ...termsData, termsAccepted: true });
        console.log('✅ [SignUp.js] Step 2 條款同意，資料:', termsData);
        setCurrentStep(4);
    };

    const handleStep4Complete = () => {
        console.log('✅ [SignUp.js] Step 4 過場動畫完成');
        setCurrentStep(5);
    };

    const handleStep5Next = () => {
        console.log('✅ [SignUp.js] Step 5 部落資訊檢視完成');
        setCurrentStep(6);
    };

    // 輔助函式：提交 Tribe (假設 Profile 已存在)
    const handleTribeSubmission = async (tribeData) => {
        const tribeId = tribeData?.id; 

        if (!tribeId) {
            console.log('🟡 [TribeSubmission] 沒有選擇 Tribe，跳過 API 提交。');
            return true; 
        }
        
        // 注意：isLoading 狀態由主函式 (handleStep6Next) 控制
        
        const apiEndpoint = 'https://pray-api.yalinelena.church/auth/profile/tribe';
        const postData = { tribe: tribeId };

        console.log(`🚀 [TribeSubmission] 準備發送 API 請求...`);
        console.log(`   [TribeSubmission] API: POST ${apiEndpoint}`);
        console.log(`   [TribeSubmission] Body: ${JSON.stringify(postData)}`);
        
        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                },
                body: JSON.stringify(postData),
                credentials: 'include',
                mode: 'cors'
            });

            const responseText = await response.text();
            
            if (!response.ok) {
                console.error(`🔴 [TribeSubmission] API 請求失敗 (Status: ${response.status})。回應:`, responseText);
                if (response.status === 401 || response.status === 404) {
                    throw new Error(`(Status ${response.status}) 會話過期或帳號不存在 (Tribe)。`);
                }
                try {
                    const errorData = JSON.parse(responseText);
                    throw new Error(errorData.message || `API 錯誤：無法儲存支派 (${response.status})`);
                } catch(e) {
                    throw new Error(`API 錯誤 (Status ${response.status})，無法解析 JSON 回應 (Tribe)。`);
                }
            }
            
            console.log('✅ [TribeSubmission] API 請求成功。回應:', responseText);
            return true;

        } catch (error) {
            console.error('💥 [TribeSubmission] 儲存支派時發生 JavaScript 錯誤:', error);
            // 在這裡拋出錯誤，讓主函式 (handleStep6Next) 的 catch 區塊捕獲
            throw error; 
        }
    };
    
    // 【關鍵修改】：這是現在唯一的最終提交函式
    const handleStep6Next = async (tribeDataFromStep6) => {
        console.log('✅ [SignUp.js] Step 6 完成 (handleStep6Next 觸發)。');
        console.log('🔎 [SignUp.js] 檢查從 Step 6 *直接傳入*的 Tribe 資料:', tribeDataFromStep6);

        // 1. 設定完整載入狀態
        setIsLoading(true);
        setIsSubmitting(true);

        // 2. 立即更新本地狀態
        updateFormData({ tribe: tribeDataFromStep6 });

        try {
            // 3. 【順序一：先建立 Profile】
            const profileData = {
                name: formData.name,       // 來自 Step 1
                user_id: formData.userId   // 來自 Step 1
            };
            console.log('📤 [Step6Next] 1. 準備呼叫 AuthAPI.updateProfile (建立 Profile)...', profileData);
            const updateResult = await AuthAPI.updateProfile(profileData);
            console.log('✅ [Step6Next] 1. AuthAPI.updateProfile 成功', updateResult);

            // 4. 【順序二：再更新 Tribe】
            //    我們使用 tribeDataFromStep6，因為 formData.tribe 可能是異步的
            console.log('📤 [Step6Next] 2. 準備呼叫 handleTribeSubmission...');
            await handleTribeSubmission(tribeDataFromStep6);
            console.log('✅ [Step6Next] 2. handleTribeSubmission 完成');

            // 5. 【順序三：取得最終 Profile】
            console.log('📤 [Step6Next] 3. 準備呼叫 AuthAPI.getProfile 取得最終資料...');
            const profile = await AuthAPI.getProfile(); 
            console.log('✅ [Step6Next] 3. AuthAPI.getProfile 成功', profile);
            
            // 6. 【順序四：儲存並導航】
            const finalData = {
                id: profile.user_id || formData.userId,
                name: profile.name || formData.name,
                email: formData.email,
                avatar: profile.avatar || `https://ui-avatars.com/api/?name=${formData.name}&background=667eea&color=fff`,
                token: sessionData?.app_token || 'session-token',
                loginMethod: formData.provider === 'oauth' ? 'oauth' : 'email_verification',
                // 使用剛才 API 回傳的 profile.tribe，這是最準確的
                tribe: profile.tribe 
            };
            console.log('🎉 [Step6Next] 4. 最終註冊資料 (準備儲存到 localStorage):', finalData);
            localStorage.setItem('userData', JSON.stringify(finalData));
            
            if (typeof onSignUpComplete === 'function') {
                console.log('✅ [Step6Next] 5. 呼叫 onSignUpComplete 並導向 /main');
                onSignUpComplete(finalData);
                setTimeout(() => {
                    navigate('/main', { replace: true });
                }, 100);
            } else {
                console.error('❌ [Step6Next] onSignUpComplete 不是一個函式');
                alert('註冊成功！請重新登入。');
                navigate('/login');
            }
        
        } catch (error) {
            // 統一的錯誤處理
            console.error('💥 [Step6Next] 註冊流程最終步驟失敗:', error);
            let errorMessage = error.message || '註冊失敗，請稍後再試';
            if (error.message.includes('Unauthorized') || error.message.includes('Session') || error.message.includes('會話過期')) {
                errorMessage = '會話已過期，請重新登入。';
                setTimeout(() => {
                    onReturnToLogin ? onReturnToLogin() : navigate('/login', { replace: true });
                }, 2000);
            }
            alert(errorMessage);
        } finally {
            // 7. 結束載入狀態
            setIsSubmitting(false);
            setIsLoading(false);
        }
    };
    
    // handleFinalComplete 函式現在不再被 handleStep6Next 呼叫，可以移除或保留
    // const handleFinalComplete = async () => { ... };

    // ========================================
    // 🎨 RENDER STEPS
    // ========================================
    const renderStep1 = () => (
        <div className="signup-content">
            <BrandLogo logoSrc={logoImage} size="medium" />
            <div className="signup-form">
                <div className="input-group">
                    <FormInput
                        type="text"
                        placeholder="USER ID"
                        value={formData.userId}
                        onChange={(e) => handleChange('userId', e.target.value)}
                        className="signup-input"
                        disabled={isSubmitting || isLoading}
                    />
                    {errors.userId && <span className="error-text">{errors.userId}</span>}
                    <small style={{ color: '#999', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                        3-30 個字元，僅限英文、數字、底線和連字號
                    </small>
                </div>
                <div className="input-group">
                    <FormInput
                        type="text"
                        placeholder="ENTER YOUR NAME"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="signup-input"
                        disabled={isSubmitting || isLoading}
                    />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                    <small style={{ color: '#999', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                        您的顯示名稱（2-50 個字元）
                    </small>
                </div>
                <div className="input-group">
                    <FormInput
                        type="email"
                        placeholder="EMAIL ADDRESS"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="signup-input"
                        disabled={isSubmitting || isLoading || !!verifiedEmail}
                        autoComplete="email"
                    />
                    {errors.email && <span className="error-text">{errors.email}</span>}
                    <small style={{ color: '#999', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                        {verifiedEmail ? '✅ Email 已驗證' : '我們將發送驗證郵件到此地址'}
                    </small>
                </div>
                <ActionButton
                    onClick={handleNext}
                    variant="primary"
                    size="medium"
                    className="create-account-button"
                    disabled={isSubmitting || isLoading}
                    loading={isSubmitting || isLoading}
                >
                    Create account
                </ActionButton>
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button
                        onClick={handleReturnToLogin}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#667eea',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontSize: '14px',
                            padding: '5px 10px'
                        }}
                        disabled={isSubmitting || isLoading}
                    >
                        已有帳號？返回登入
                    </button>
                </div>
            </div>
        </div>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return renderStep1();
            case 2:
                return (
                    <Step2Terms
                        onNext={handleStep2Next}
                        onBack={handleBack}
                    />
                );
            case 4:
                return (
                    <Step4Transition
                        onComplete={handleStep4Complete}
                    />
                );
            case 5:
                return (
                    <Step5TribeInfo
                        formData={formData}
                        updateFormData={updateFormData}
                        nextStep={handleStep5Next}
                        prevStep={prevStep}
                    />
                );
            case 6:
                return (
                    <Step6TribeSelection
                        formData={formData}
                        updateFormData={updateFormData}
                        nextStep={handleStep6Next} // 這裡傳入的是 handleStep6Next 函式
                        prevStep={prevStep}
                        isLoading={isLoading} 
                    />
                );
            default:
                return renderStep1();
        }
    };

    // ========================================
    // 🎯 MAIN RENDER
    // ========================================
    const shouldShowProgress = currentStep === 1 || currentStep === 2;
    return (
        <LoginBackground gradientColors={['#142049', '#848484', '#FFDF9E']}>
            <div className="signup-container">
                {shouldShowProgress && (
                    <div className="signup-progress">
                        <div className={`progress-dot ${currentStep >= 1 ? 'active' : ''}`}></div>
                        <div className={`progress-dot ${currentStep >= 2 ? 'active' : ''}`}></div>
                    </div>
                )}
                {renderCurrentStep()}
                {(isLoading || isSubmitting) && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        zIndex: 9999, backdropFilter: 'blur(4px)'
                    }}>
                        <div style={{
                            background: 'white', padding: '40px', borderRadius: '16px',
                            textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                            minWidth: '200px'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '15px', animation: 'spin 1s linear infinite' }}>⏳</div>
                            <div style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>處理中，請稍候...</div>
                        </div>
                    </div>
                )}
            </div>
        </LoginBackground>
    );
};

export default SignUp;