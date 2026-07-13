import React from 'react';
import { User } from '../types';

interface TopHeaderProps {
  currentUser: User | null;
  activeTab: string;
  onToggleSidebar: () => void;
  onGoBack: () => void;
  onLogout: () => void;
  showBackButton: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentUser,
  activeTab,
  onToggleSidebar,
  onGoBack,
  onLogout,
  showBackButton,
}) => {
  const titles: Record<string, string> = {
    'admin-users': '👑 الإدارة العليا - إدارة حسابات ومستخدمي النظام بالكامل',
    'admin-item-track': '🔍 الإدارة العليا - كشف حركات الأصناف الموحد والتفصيلي',
    'admin-backup': '💾 الإدارة العليا - النسخ الاحتياطي اليدوي المشفر واستعادة النظام',
    'rawda-branch': 'معرض الروضة - ساحة توريد الطلبات والنواقص',
    'rawda-returns': 'معرض الروضة - إنشاء وتجهيز مستند مرتجعات أصناف',
    'safaa-branch': 'معرض الصفا - ساحة توريد الطلبات والنواقص',
    'safaa-returns': 'معرض الصفا - إنشاء وتجهيز مستند مرتجعات أصناف',
    'nadi-wh': 'مخزن النادي - معالجة الفواتير الواردة',
    'nahas-wh': 'مخزن النحاس - معالجة الفواتير الواردة',
    'merged-returns-wh': 'لوحة تحكم المخازن الموحدة - 📋 قائمة المرتجعات المدمجة الواردة من المعارض',
    'rawda-archive-sent': 'أرشيف كشوفات الفواتير المرسلة بالكامل - معرض الروضة',
    'rawda-archive-rec': 'أرشيف الفواتير المستلمة المجمع - معرض الروضة',
    'rawda-archive-returns': 'أرشيف المرتجعات المستلمة المؤرشفة - معرض الروضة',
    'safaa-archive-sent': 'أرشيف كشوفات الفواتير المرسلة بالكامل - معرض الصفا',
    'safaa-archive-rec': 'أرشيف الفواتير المستلمة المجمع - معرض الصفا',
    'safaa-archive-returns': 'أرشيف المرتجعات المستلمة المؤرشفة - معرض الصفا',
    'nadi-archive-rec': 'أرشيف فواتير المعارض المستلمة - مخزن النادي',
    'nadi-archive-disp': 'أرشيف منصرف الشحنات الكلية - مخزن النادي',
    'nadi-archive-returns': 'أرشيف المخازن المنفصل - قسم استلام مرتجع النادي',
    'nahas-archive-rec': 'أرشيف فواتير المعارض المستلمة - مخزن النحاس',
    'nahas-archive-disp': 'أرشيف منصرف الشحنات الكلية - مخزن النحاس',
    'nahas-archive-returns': 'أرشيف المخازن المنفصل - قسم استلام مرتجع النحاس',
    'merged-archive': 'الربط الموحد - الأرشيف اليومي للفواتير المدمجة',
    'invoice-details': 'مستند الفاتورة المفتوحة',
  };

  let currentTitle = titles[activeTab];
  if (!currentTitle && activeTab.endsWith('-detailed-received')) {
    currentTitle = '📋 كشف تفصيلي بالبنود والأصناف المستلمة (وارد المخازن)';
  }
  if (!currentTitle) {
    currentTitle = 'نظام النواقص';
  }

  return (
    <header className="top-header no-print" dir="rtl">
      <div className="header-left">
        <button className="toggle-btn" onClick={onToggleSidebar}>
          ☰
        </button>
        {showBackButton && (
          <button className="btn-back" style={{ display: 'inline-block' }} onClick={onGoBack}>
            ↩ رجوع
          </button>
        )}
      </div>
      <div className="header-title">
        <h1>{currentTitle}</h1>
        <p>المسؤول المباشر: {currentUser?.name || ''}</p>
      </div>
      <div className="header-actions">
        <button className="btn-logout-header" onClick={onLogout}>
          🚪 تسجيل الخروج
        </button>
      </div>
    </header>
  );
};
