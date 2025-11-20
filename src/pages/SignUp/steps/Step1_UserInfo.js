// ./src/pages/SignUp/steps/Step1_UserInfo.js

import React from 'react';
import { Form, Input, Button, Select } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
import './Step1_UserInfo.css';

const { Option } = Select;

const Step1_UserInfo = ({ onNext }) => {
  const [form] = Form.useForm();

  const handleSubmit = (values) => {
    console.log('Step 1 - User Info:', values);
    onNext(values);
  };

  return (
    <div className="step1-container">
      <div className="step-number">1</div>
      <h2 className="step-title">Create Account</h2>
      <p className="step-subtitle">Fill in your information</p>

      <Form
        form={form}
        name="step1_user_info"
        onFinish={handleSubmit}
        layout="vertical"
        className="step1-form"
      >
        {/* Full Name */}
        <Form.Item
          name="fullName"
          rules={[
            { required: true, message: 'Please enter your full name' },
            { min: 2, message: 'Name must be at least 2 characters' }
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Full Name"
            size="large"
            className="step1-input"
          />
        </Form.Item>

        {/* ❌ ĐÃ XÓA PHẦN EMAIL */}

        {/* Phone */}
        <Form.Item
          name="phone"
          rules={[
            { required: true, message: 'Please enter your phone number' },
            { pattern: /^[0-9]{10,11}$/, message: 'Please enter a valid phone number' }
          ]}
        >
          <Input
            prefix={<PhoneOutlined />}
            placeholder="Phone Number"
            size="large"
            className="step1-input"
          />
        </Form.Item>

        {/* Password */}
        <Form.Item
          name="password"
          rules={[
            { required: true, message: 'Please enter your password' },
            { min: 6, message: 'Password must be at least 6 characters' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Password"
            size="large"
            className="step1-input"
          />
        </Form.Item>

        {/* Confirm Password */}
        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Confirm Password"
            size="large"
            className="step1-input"
          />
        </Form.Item>

        {/* Gender */}
        <Form.Item
          name="gender"
          rules={[{ required: true, message: 'Please select your gender' }]}
        >
          <Select
            placeholder="Select Gender"
            size="large"
            className="step1-select"
          >
            <Option value="male">Male</Option>
            <Option value="female">Female</Option>
            <Option value="other">Other</Option>
          </Select>
        </Form.Item>

        {/* Button */}
        <Form.Item 
          style={{ 
            marginBottom: 0,
            width: '100%'
          }}
        >
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            className="step1-submit-btn"
            style={{
              width: '100%',
              display: 'block'
            }}
          >
            CREATE ACCOUNT
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Step1_UserInfo;
