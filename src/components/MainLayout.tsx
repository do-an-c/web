import React, { useState } from 'react';
import { Layout, Menu, theme, Dropdown, Avatar, Space, Typography } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  DashboardOutlined,
  EnvironmentOutlined,
  TranslationOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  CompassOutlined,
  BarChartOutlined,
  ShopOutlined,
  StarOutlined,
  TeamOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Get current page key from location
  const currentPage = location.pathname.substring(1) || 'dashboard';

  // Menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
      },
      {
        key: 'poi',
        icon: <EnvironmentOutlined />,
        label: 'Quản lý POI',
      },
      {
        key: 'menu',
        icon: <ShopOutlined />,
        label: 'Thực đơn',
      },
      {
        key: 'reviews',
        icon: <StarOutlined />,
        label: 'Đánh giá',
      },
      {
        key: 'narration',
        icon: <TranslationOutlined />,
        label: 'Lịch sử thuyết minh',
      },
    ];

    // Admin-only items
    if (isAdmin()) {
      baseItems.push({
        key: 'tours',
        icon: <CompassOutlined />,
        label: 'Quản lý Tour',
      });
      baseItems.push({
        key: 'users',
        icon: <TeamOutlined />,
        label: 'Quản lý người dùng',
      });
      baseItems.push({
        key: 'analytics',
        icon: <BarChartOutlined />,
        label: 'Phân tích & Thống kê',
      });
      baseItems.push({
        key: 'app-download',
        icon: <QrcodeOutlined />,
        label: 'Tải App (QR)',
      });
      // baseItems.push({
      //   key: 'qr-scan',
      //   icon: <QrcodeOutlined />,
      //   label: 'Kiểm tra QR (Mạnh/Yếu)',
      // });
      // baseItems.push({
      //   key: 'settings',
      //   icon: <SettingOutlined />,
      //   label: 'Cấu hình hệ thống',
      // });
    }

    return baseItems;
  };

  // User dropdown menu
  const userMenuItems = [
    {
      key: 'profile',
      icon: <SettingOutlined />,
      label: 'Cài đặt tài khoản',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    }
    // Add other menu item handlers here
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{ 
          height: '64px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? '16px' : '18px',
          fontWeight: 'bold',
          padding: '0 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {collapsed ? '🍜' : '🍜 Vĩnh Khánh Admin'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentPage]}
          items={getMenuItems()}
          onClick={({ key }) => navigate(`/${key}`)}
          style={{ marginTop: '16px' }}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: 0, 
          background: colorBgContainer, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger',
              onClick: () => setCollapsed(!collapsed),
              style: { fontSize: '18px', padding: '0 24px', cursor: 'pointer' }
            })}
          </div>
          
          <div style={{ paddingRight: '24px' }}>
            <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text strong style={{ fontSize: '14px' }}>{user?.fullName}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {user?.role === 'Admin' ? '👨‍💼 Admin' : '🏪 Chủ quán'}
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
