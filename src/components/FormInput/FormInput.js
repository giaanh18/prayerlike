// ./src/components/FormInput/FormInput.js
import React from 'react';
import './FormInput.css';

const FormInput = ({ 
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  disabled = false,
  ...props 
}) => {
  return (
    <div className={`form-input-container ${className}`}>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="form-input"
        {...props}
      />
    </div>
  );
};

export default FormInput;
