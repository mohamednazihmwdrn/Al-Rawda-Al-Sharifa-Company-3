import React from 'react';

interface PrintAreaProps {
  printContent: { title: string; subtitle: string; html: string } | null;
}

export const PrintArea: React.FC<PrintAreaProps> = ({ printContent }) => {
  if (!printContent) return null;

  return (
    <div id="printArea" style={{ display: 'block' }} className="print-container">
      <div className="header" style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '12px', direction: 'rtl' }}>
        <div className="company-name-main" style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 2px 0' }}>شركة الروضة الشريفة</div>
        <h1 style={{ fontSize: '14px', margin: '5px 0 2px 0', fontWeight: 700, color: '#111' }}>{printContent.title}</h1>
        <h2 style={{ fontSize: '10.5px', fontWeight: 'normal', margin: 0, color: '#444' }}>
          {printContent.subtitle}
        </h2>
      </div>
      <div
        className="print-body-content"
        style={{ direction: 'rtl' }}
        dangerouslySetInnerHTML={{ __html: printContent.html }}
      />
      <div className="print-footer">
        <div style={{ fontWeight: 'bold', color: '#000' }}>🏛️ شركة الروضة الشريفة</div>
        <div className="page-number-box" style={{ fontWeight: 'bold', color: '#000' }}></div>
        <div style={{ direction: 'rtl', fontWeight: 'bold' }}>حقوق الملكية الفكرية محفوظة لمطور النظام Mohamed Nazih 01029190615 ©</div>
      </div>
    </div>
  );
};
