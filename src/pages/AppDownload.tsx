import React, { useEffect, useState } from 'react';
import { Card, Typography, Spin, Space, Button, Alert, Tag, Divider } from 'antd';
import { MobileOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';

const { Title, Text, Paragraph } = Typography;

interface DownloadInfo {
  downloadUrl: string;
  qrCodeUrl: string;
  serverIp: string;
  hasApk: boolean;
  fileName: string | null;
  fileSize: string | null;
  lastModified: string | null;
}

const AppDownload: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<DownloadInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      // Direct call since this endpoint doesn't require auth
      const response = await axios.get(`${API_BASE_URL}/download/info`);
      setInfo(response.data);
    } catch (err) {
      console.error('Error fetching download info:', err);
      setError('Không thể tải thông tin ứng dụng. Vui lòng kiểm tra lại server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        <MobileOutlined /> Quản Lý Tải Ứng Dụng (QR)
      </Title>

      <Card hoverable style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Đang tải thông tin ứng dụng...</div>
          </div>
        ) : error ? (
          <Alert
            message="Lỗi"
            description={error}
            type="error"
            showIcon
            action={
              <Button onClick={fetchInfo} icon={<ReloadOutlined />} size="small">
                Thử lại
              </Button>
            }
          />
        ) : info ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {info.hasApk ? (
              <Tag color="success" style={{ marginBottom: 16, fontSize: '14px', padding: '4px 12px' }}>
                Trạng thái: Máy chủ đã có sẵn file cài đặt
              </Tag>
            ) : (
              <Alert 
                type="warning" 
                showIcon 
                style={{ marginBottom: 24, width: '100%' }}
                message="Chưa có file cài đặt" 
                description="Server hiện chưa có file .apk nào. Vui lòng publish lại Backend gồm file .apk trong thư mục downloads." 
              />
            )}

            <div 
              style={{ 
                padding: '16px', 
                background: '#fff', 
                borderRadius: '12px', 
                border: '1px solid #f0f0f0',
                marginBottom: '24px'
              }}
            >
              <img 
                src={`${API_BASE_URL}/download/qrcode`} 
                alt="QR Code" 
                style={{ 
                  width: '250px', 
                  height: '250px', 
                  display: 'block',
                  opacity: info.hasApk ? 1 : 0.3
                }} 
              />
            </div>
            
            <Paragraph style={{ textAlign: 'center', fontSize: '16px', maxWidth: '500px' }}>
              Hãy dùng điện thoại quét mã QR bên trên để tự động tải ứng dụng <b>Vĩnh Khánh Food Street</b> về máy.
            </Paragraph>

            <Divider dashed />

            <div style={{ width: '100%', maxWidth: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text type="secondary">Tên file:</Text>
                <Text strong>{info.fileName || 'Không có dữ liệu'}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text type="secondary">Dung lượng:</Text>
                <Text strong>{info.fileSize || '-'}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <Text type="secondary">Cập nhật lúc:</Text>
                <Text strong>{info.lastModified ? new Date(info.lastModified).toLocaleString('vi-VN') : '-'}</Text>
              </div>
            </div>

            <Space size="middle">
              <Button 
                type="primary" 
                icon={<DownloadOutlined />} 
                size="large"
                href={info.downloadUrl}
                disabled={!info.hasApk}
              >
                Tải File APK trực tiếp
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchInfo} size="large">
                Làm mới
              </Button>
            </Space>
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default AppDownload;
