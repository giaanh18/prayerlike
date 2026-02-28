// ./src/pages/SignUp/steps/Step2_Terms.js
import React, { useState } from 'react';
import ActionButton from '../../../components/ActionButton/ActionButton';
import './Step2_Terms.css';

const Step2_Terms = ({ onNext, onBack }) => {
  const [agreed, setAgreed] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  const privacyPolicy = {
    appName: "Pray Like Incense",
    title: "Personal Data Protection and Privacy Policy (Taiwan PDPA Version)",
    sections: [
      {
        id: 1,
        title: "1. Introduction",
        content: "Pray Like Incense (hereinafter referred to as \"the Service\") values the privacy and personal data protection of every user. This Policy is established in accordance with the Personal Data Protection Act of Taiwan and relevant regulations, and explains how the Service collects, processes, uses, and protects users' personal data."
      },
      {
        id: 2,
        title: "2. Purposes of Personal Data Collection",
        content: "The Service collects personal data solely for the following purposes:",
        items: [
          "User account registration and identity verification",
          "Publishing prayer requests, responses (Amen), and intercessory interaction features",
          "Multilingual translation, system notifications, and service optimization",
          "Account management, system maintenance, and security control",
          "Internal statistics and analysis related to the Service's mission (without personal identification)"
        ],
        note: "All collection purposes are reasonable, necessary, and directly related to religious and community services."
      },
      {
        id: 3,
        title: "3. Categories of Personal Data Collected",
        content: "The personal data collected by the Service may include, but is not limited to, the following:",
        subsections: [
          {
            subtitle: "Basic Information:",
            items: [
              "Email address",
              "Username (nickname)",
              "Language preference"
            ]
          },
          {
            subtitle: "Usage Records:",
            items: [
              "Login time",
              "Prayer and response records",
              "System operation behavior (for technical and security purposes only)"
            ]
          }
        ],
        warning: "⚠️ The Service does not proactively collect national identification numbers, physical addresses, phone numbers, financial account information, medical data, or other sensitive personal data."
      },
      {
        id: 4,
        title: "4. Period, Area, Subjects, and Methods of Personal Data Use",
        subsections: [
          {
            subtitle: "Period:",
            content: "From the date of user registration until account deletion or termination of the Service."
          },
          {
            subtitle: "Area:",
            content: "Primarily processed within Taiwan. If cross-border data storage is required due to cloud services, reasonable security protection measures will be implemented."
          },
          {
            subtitle: "Subjects:",
            content: "Limited to necessary administrative personnel of the Service or legally commissioned technical service providers. The Service will not sell, exchange, or rent personal data to any third party."
          },
          {
            subtitle: "Methods:",
            content: "Personal data is processed by automated or non-automated means within lawful and secure system environments."
          }
        ]
      },
      {
        id: 5,
        title: "5. Data Security and Protection Measures",
        content: "The Service adopts reasonable technical and administrative measures to prevent unauthorized access, alteration, leakage, or destruction of personal data, including but not limited to:",
        items: [
          "Access control management",
          "System protection and encrypted data transmission",
          "Confidentiality obligations for administrators",
          "Regular review and improvement of security measures"
        ]
      },
      {
        id: 6,
        title: "6. User Rights",
        content: "In accordance with Article 3 of the Personal Data Protection Act, users may exercise the following rights regarding their personal data:",
        items: [
          "Request access or review",
          "Request a copy",
          "Request supplementation or correction",
          "Request cessation of collection, processing, or use",
          "Request deletion"
        ],
        note: "Users may submit such requests through the contact channels provided by the Service."
      },
      {
        id: 7,
        title: "7. Data Autonomy and Privacy Settings",
        content: "Users may choose the visibility of prayer content published within the Service, including:",
        items: [
          "Public display",
          "Limited to specific groups",
          "Personal private records"
        ],
        note: "All disclosure settings are determined by the user. The Service will not alter visibility settings without user authorization."
      },
      {
        id: 8,
        title: "8. Policy Amendments",
        content: "The Service reserves the right to revise this Policy in response to legal amendments or service requirements. Revised versions will be announced on relevant Service pages without individual notice."
      },
      {
        id: 9,
        title: "9. Contact Information",
        content: "If you have any questions regarding this Policy, personal data protection matters, or wish to exercise rights under the Personal Data Protection Act, please contact us through the following official channel:",
        contact: {
          label: "Official Contact Email:",
          email: "info@yalinelena.church"
        },
        note: "The Service will respond and assist with related requests within a reasonable timeframe."
      }
    ]
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleContinue = () => {
    if (!agreed) {
      alert('Please agree to the terms and privacy policy');
      return;
    }
    console.log('Step 2 - Terms accepted');
    onNext({ termsAgreed: true, agreedAt: new Date().toISOString() });
  };

  return (
    <div className="step2-container">
      {/* Header */}
      <div className="terms-display-button">
        TERM & PRIVACY
      </div>

      {/* Privacy Policy Content */}
      <div className="permissions-box">
        <div className="permissions-header">
          <span className="key-icon">📜</span>
          <span className="header-text">{privacyPolicy.appName}</span>
        </div>

        <div className="policy-subtitle">
          {privacyPolicy.title}
        </div>

        {/* Accordion Sections */}
        <div className="terms-accordion">
          {privacyPolicy.sections.map((section) => (
            <div key={section.id} className="terms-accordion-item">
              <div 
                className="terms-accordion-header"
                onClick={() => toggleSection(section.id)}
              >
                <span className="terms-title">{section.title}</span>
                <span className="terms-toggle-icon">
                  {expandedSections[section.id] ? '▼' : '▶'}
                </span>
              </div>

              {expandedSections[section.id] && (
                <div className="terms-accordion-content">
                  {section.content && (
                    <p className="terms-text">{section.content}</p>
                  )}

                  {section.items && (
                    <ul className="terms-list">
                      {section.items.map((item, idx) => (
                        <li key={idx} className="terms-list-item">{item}</li>
                      ))}
                    </ul>
                  )}

                  {section.subsections && (
                    <div className="terms-subsections">
                      {section.subsections.map((sub, idx) => (
                        <div key={idx} className="terms-subsection">
                          <strong className="terms-subtitle">{sub.subtitle}</strong>
                          {sub.content && <p className="terms-text">{sub.content}</p>}
                          {sub.items && (
                            <ul className="terms-list">
                              {sub.items.map((item, i) => (
                                <li key={i} className="terms-list-item">{item}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {section.warning && (
                    <div className="terms-warning-box">
                      <p className="permission-text">{section.warning}</p>
                    </div>
                  )}

                  {section.contact && (
                    <div className="terms-contact-box">
                      <p className="permission-text">
                        <strong>{section.contact.label}</strong><br />
                        📧 <a href={`mailto:${section.contact.email}`}>
                          {section.contact.email}
                        </a>
                      </p>
                    </div>
                  )}

                  {section.note && (
                    <p className="terms-note">{section.note}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Agreement Checkbox */}
      <div className="agreement-section">
        <label className="custom-checkbox">
          <input 
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span className="checkmark"></span>
          <span className="checkbox-label">
            I agree to the Personal Data Protection and Privacy Policy
          </span>
        </label>
      </div>

      {/* Continue Button */}
      <div className="step2-buttons">
        <ActionButton 
          onClick={handleContinue}
          variant="primary"
          size="medium"
          className="continue-button"
          disabled={!agreed}
        >
          CONTINUE
        </ActionButton>
      </div>
    </div>
  );
};

export default Step2_Terms;
