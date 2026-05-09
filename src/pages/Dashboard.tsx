import React from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import { EnvironmentOutlined, SoundOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { poiApi } from '../services/api';

const Dashboard: React.FC = () => {
  const { data: pois } = useQuery({
    queryKey: ['pois', 'All'],
    queryFn: async () => {
      const response = await poiApi.getAll('All');
      return response.data;
    },
  });

  const totalPOIs = pois?.length || 0;
  const activePOIs = pois?.filter(poi => poi.status === 'Active').length || 0;
  const totalTranslations = pois?.reduce((sum, poi) => sum + (poi.translations?.length || 0), 0) || 0;
  const poisWithTranslations = pois?.filter(poi => poi.translations && poi.translations.length > 0).length || 0;

  return (
    <div style={{ padding: '24px' }}>
      <h1>Dashboard - Vinh Khanh Food Street Admin</h1>
      
      <Row gutter={16} style={{ marginTop: '24px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng số POI"
              value={totalPOIs}
              prefix={<EnvironmentOutlined />}
              styles={{ content: { color: '#3f8600' } }}
            />
          </Card>
        </Col>
        
        <Col span={8}>
          <Card>
            <Statistic
              title="POI Đang hoạt động"
              value={activePOIs}
              prefix={<ClockCircleOutlined />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng bản dịch"
              value={totalTranslations}
              prefix={<SoundOutlined />}
              suffix={`/ ${totalPOIs * 5}`}
              styles={{ content: { color: '#cf1322' } }}
            />
            <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
              {poisWithTranslations}/{totalPOIs} POI có nội dung
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card title="Thống kê nhanh">
            <p>🎯 Hệ thống quản lý điểm thuyết minh tự động cho Phố Ẩm Thực Vĩnh Khánh</p>
            <p>📍 Quản lý POI (Points of Interest)</p>
            <p>🌐 Hỗ trợ đa ngôn ngữ</p>
            <p>🔊 Text-to-Speech tự động</p>
            <p>📊 Theo dõi thống kê và phân tích</p>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: '24px' }}>
        <Col span={12}>
          <Card title="POI Được nghe nhiều nhất">
            {pois?.sort((a, b) => b.viewCount - a.viewCount).slice(0, 5).map((poi, index) => (
              <div key={poi.id} style={{ marginBottom: '12px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                <strong>#{index + 1}. {poi.name}</strong>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {poi.viewCount} lượt nghe • Priority: {poi.priority}
                </div>
              </div>
            ))}
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="POI Mới nhất">
            {pois?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map((poi) => (
              <div key={poi.id} style={{ marginBottom: '12px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                <strong>{poi.name}</strong>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Tạo lúc: {new Date(poi.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
