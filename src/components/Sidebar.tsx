import React from 'react';
import { UsersDatabase, User, DraftOrder, ReturnDraft } from '../types';

interface SidebarProps {
  users: UsersDatabase;
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarCollapsed: boolean;
  onLogout: () => void;
  draftOrders: DraftOrder[];
  returnsDraft: ReturnDraft[];
  setSidebarCollapsed?: (val: boolean) => void;
  onShowPrivacy?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  users,
  currentUser,
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  onLogout,
  draftOrders,
  returnsDraft,
  setSidebarCollapsed,
  onShowPrivacy,
}) => {
  const branchKeys = Object.keys(users).filter((k) => users[k].role === 'branch');
  const whKeys = Object.keys(users).filter((k) => users[k].role === 'wh');

  const showMenuItem = (tabId: string) => {
    if (currentUser.role === 'admin') return true;

    if (currentUser.role === 'branch') {
      const k = currentUser.key!;
      if (
        tabId === `${k}-branch` ||
        tabId === `${k}-returns` ||
        tabId === `${k}-archive-sent` ||
        tabId === `${k}-archive-rec` ||
        tabId === `${k}-archive-returns` ||
        tabId === `${k}-detailed-received`
      ) {
        return true;
      }
      return false;
    }

    if (currentUser.role === 'wh') {
      const k = currentUser.key!;
      if (
        tabId === `${k}-wh` ||
        tabId === 'merged-returns-wh' ||
        tabId === `${k}-archive-rec` ||
        tabId === `${k}-archive-disp` ||
        tabId === `${k}-archive-returns` ||
        tabId === 'merged-archive'
      ) {
        return true;
      }
      return false;
    }

    return false;
  };

  const handleItemClick = (tabId: string) => {
    setActiveTab(tabId);
    if (window.innerWidth <= 768) {
      setSidebarCollapsed?.(true);
    }
  };

  return (
    <div
      id="app-sidebar"
      className={`sidebar no-print ${sidebarCollapsed ? 'collapsed' : ''}`}
      dir="rtl"
    >
      <div className="sidebar-brand">
        <h2>🏛️ الروضة</h2>
        <div className="sub">نظام النواقص</div>
      </div>

      <div className="user-info-box" id="user-display-tag">
        👤 {currentUser.name}
      </div>

      {currentUser.role === 'admin' && (
        <div id="admin-group-section">
          <div className="menu-group-title">👑 الإدارة العامة والتحكم</div>
          <ul className="sidebar-menu">
            <li
              className={`menu-item ${activeTab === 'admin-users' ? 'active' : ''}`}
              onClick={() => handleItemClick('admin-users')}
            >
              👥 إدارة حسابات النظام
            </li>
            <li
              className={`menu-item ${activeTab === 'admin-item-track' ? 'active' : ''}`}
              onClick={() => handleItemClick('admin-item-track')}
            >
              🔍 كشف حركات الأصناف
            </li>
            <li
              className={`menu-item ${activeTab === 'admin-monitor' ? 'active' : ''}`}
              onClick={() => handleItemClick('admin-monitor')}
            >
              📊 رقابة المعارض والمخازن
            </li>
            <li
              className={`menu-item ${activeTab === 'admin-backup' ? 'active' : ''}`}
              onClick={() => handleItemClick('admin-backup')}
            >
              💾 الأرشفة والنسخ الاحتياطي
            </li>
          </ul>
        </div>
      )}

      {/* Deficits Sections for branches */}
      {branchKeys.some((k) => showMenuItem(`${k}-branch`)) && (
        <>
          <div className="menu-group-title">🛒 النواقص بالمعارض</div>
          <ul className="sidebar-menu">
            {branchKeys.map((k) => {
              const tabId = `${k}-branch`;
              if (!showMenuItem(tabId)) return null;
              const count = draftOrders.filter((d) => d.branch === users[k].name).length;
              return (
                <li
                  key={tabId}
                  className={`menu-item ${activeTab === tabId ? 'active' : ''}`}
                  onClick={() => handleItemClick(tabId)}
                >
                  طلب نواقص {users[k].name.replace('معرض ', '')}
                  {count > 0 && <span className="badge-count">{count}</span>}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Returns Sections for branches */}
      {branchKeys.some((k) => showMenuItem(`${k}-returns`)) && (
        <>
          <div className="menu-group-title">↩️ مرتجعات المعارض</div>
          <ul className="sidebar-menu">
            {branchKeys.map((k) => {
              const tabId = `${k}-returns`;
              if (!showMenuItem(tabId)) return null;
              const count = returnsDraft.filter((r) => r.branch === users[k].name).length;
              return (
                <li
                  key={tabId}
                  className={`menu-item ${activeTab === tabId ? 'active' : ''}`}
                  onClick={() => handleItemClick(tabId)}
                >
                  مرتجع {users[k].name.replace('معرض ', '')}
                  {count > 0 && (
                    <span className="badge-count" style={{ background: 'var(--warning)' }}>
                       {count}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Detailed Received Items Reports for branches */}
      {branchKeys.some((k) => showMenuItem(`${k}-detailed-received`)) && (
        <>
          <div className="menu-group-title">📋 تقارير الوارد التفصيلية</div>
          <ul className="sidebar-menu">
            {branchKeys.map((k) => {
              const tabId = `${k}-detailed-received`;
              if (!showMenuItem(tabId)) return null;
              return (
                <li
                  key={tabId}
                  className={`menu-item ${activeTab === tabId ? 'active' : ''}`}
                  onClick={() => handleItemClick(tabId)}
                >
                  📋 وارد {users[k].name.replace('معرض ', '')} التفصيلي
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Warehouse Panels */}
      {(whKeys.some((k) => showMenuItem(`${k}-wh`)) || showMenuItem('merged-returns-wh')) && (
        <>
          <div className="menu-group-title">📦 لوحة المخازن</div>
          <ul className="sidebar-menu">
            {whKeys.map((k) => {
              const tabId = `${k}-wh`;
              if (!showMenuItem(tabId)) return null;
              return (
                <li
                  key={tabId}
                  className={`menu-item ${activeTab === tabId ? 'active' : ''}`}
                  onClick={() => handleItemClick(tabId)}
                >
                  نواقص {users[k].name.replace('مخزن ', '')}
                </li>
              );
            })}
            {showMenuItem('merged-returns-wh') && (
              <li
                className={`menu-item ${activeTab === 'merged-returns-wh' ? 'active' : ''}`}
                onClick={() => handleItemClick('merged-returns-wh')}
              >
                📋 قائمة المرتجعات المدمجة
              </li>
            )}
          </ul>
        </>
      )}

      {/* Archives Panels */}
      {(branchKeys.some((k) => showMenuItem(`${k}-archive-sent`) || showMenuItem(`${k}-archive-rec`) || showMenuItem(`${k}-archive-returns`)) ||
        whKeys.some((k) => showMenuItem(`${k}-archive-rec`) || showMenuItem(`${k}-archive-disp`) || showMenuItem(`${k}-archive-returns`)) ||
        showMenuItem('merged-archive')) && (
        <>
          <div className="menu-group-title">🗄️ الأرشفة والسجلات</div>
          <ul className="sidebar-menu">
            {branchKeys.map((k) => (
              <React.Fragment key={k}>
                {showMenuItem(`${k}-archive-sent`) && (
                  <li
                    className={`menu-item ${activeTab === `${k}-archive-sent` ? 'active' : ''}`}
                    onClick={() => handleItemClick(`${k}-archive-sent`)}
                  >
                    📤 مرسل {users[k].name.replace('معرض ', '')}
                  </li>
                )}
                {showMenuItem(`${k}-archive-rec`) && (
                  <li
                    className={`menu-item ${activeTab === `${k}-archive-rec` ? 'active' : ''}`}
                    onClick={() => handleItemClick(`${k}-archive-rec`)}
                  >
                    📥 مستلم {users[k].name.replace('معرض ', '')}
                  </li>
                )}
                {showMenuItem(`${k}-archive-returns`) && (
                  <li
                    className={`menu-item ${activeTab === `${k}-archive-returns` ? 'active' : ''}`}
                    onClick={() => handleItemClick(`${k}-archive-returns`)}
                  >
                    ⏪ مرتجعات {users[k].name.replace('معرض ', '')}
                  </li>
                )}
              </React.Fragment>
            ))}

            {whKeys.map((k) => (
              <React.Fragment key={k}>
                {showMenuItem(`${k}-archive-rec`) && (
                  <li
                    className={`menu-item ${activeTab === `${k}-archive-rec` ? 'active' : ''}`}
                    onClick={() => handleItemClick(`${k}-archive-rec`)}
                  >
                    📋 طلبات {users[k].name.replace('مخزن ', '')}
                  </li>
                )}
                {showMenuItem(`${k}-archive-disp`) && (
                  <li
                    className={`menu-item ${activeTab === `${k}-archive-disp` ? 'active' : ''}`}
                    onClick={() => handleItemClick(`${k}-archive-disp`)}
                  >
                    📦 منصرف {users[k].name.replace('مخزن ', '')}
                  </li>
                )}
                {showMenuItem(`${k}-archive-returns`) && (
                  <li
                    className={`menu-item ${activeTab === `${k}-archive-returns` ? 'active' : ''}`}
                    onClick={() => handleItemClick(`${k}-archive-returns`)}
                  >
                    📥 مرتجع {users[k].name.replace('مخزن ', '')}
                  </li>
                )}
              </React.Fragment>
            ))}

            {showMenuItem('merged-archive') && (
              <li
                className={`menu-item ${activeTab === 'merged-archive' ? 'active' : ''}`}
                onClick={() => handleItemClick('merged-archive')}
              >
                📊 مرسلة مدمجة اليوم
              </li>
            )}
          </ul>
        </>
      )}

      {/* Privacy Policy & IP for all users */}
      <div className="menu-group-title">🛡️ الأمان وحقوق الملكية</div>
      <ul className="sidebar-menu">
        <li
          className="menu-item"
          onClick={onShowPrivacy}
          style={{ cursor: 'pointer' }}
        >
          🛡️ سياسة الخصوصية وحقوق الملكية
        </li>
      </ul>

      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={onShowPrivacy}
          style={{
            width: '100%',
            padding: '8px',
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#cbd5e1',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '11.5px',
            textAlign: 'center',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#cbd5e1';
          }}
        >
          🛡️ سياسة الخصوصية وحقوق المطور
        </button>
        <button className="btn-logout" onClick={onLogout}>
          🚪 تسجيل الخروج
        </button>
      </div>
    </div>
  );
};
