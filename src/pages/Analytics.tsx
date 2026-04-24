import { useQuery } from '@tanstack/react-query';
import { Card, Statistic, Row, Col, Table, DatePicker, Space, Typography, Spin, Empty, Badge, Segmented } from 'antd';
import { EyeOutlined, EnvironmentOutlined, UserOutlined, ClockCircleOutlined, FireOutlined, HistoryOutlined } from '@ant-design/icons';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Marker } from 'react-leaflet';
import L from 'leaflet';
import HeatmapLayer from '../components/HeatmapLayer';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';
import api, { poiApi } from '../services/api';
import 'leaflet/dist/leaflet.css';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const onlineUserIcon = L.divIcon({
  className: 'pulse-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface AnalyticsSummary {
  totalNarrations: number;
  uniquePOIs: number;
  uniqueUsers: number;
  averageDurationSeconds: number;
  activeOnlineUsers: number;
  topPOIs: POIStats[];
}

interface POIStats {
  poiId: number;
  poiName: string;
  narrationCount: number;
  averageDurationSeconds: number;
  lastPlayedAt: string;
}

interface HeatmapPoint {
  latitude: number;
  longitude: number;
  weight: number;
}

interface POI {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

const Analytics = () => {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);

  const [heatmapMode, setHeatmapMode] = useState<'realtime' | 'historical'>('realtime');

  const { data: summary, isLoading } = useQuery({
    queryKey: ['analytics-summary', dateRange],
    queryFn: async () => {
      const response = await api.get<AnalyticsSummary>('/Analytics/summary', {
        params: {
          startDate: dateRange[0].toISOString(),
          endDate: dateRange[1].toISOString()
        }
      });
      return response.data;
    }
  });

  const { data: heatmapData, isLoading: heatmapLoading } = useQuery({
    queryKey: ['analytics-heatmap', dateRange, heatmapMode],
    queryFn: async () => {
      const params: any = { isRealtime: heatmapMode === 'realtime' };
      if (heatmapMode === 'historical') {
        params.startDate = dateRange[0].toISOString();
        params.endDate = dateRange[1].toISOString();
      }
      
      const response = await api.get<HeatmapPoint[]>('/Analytics/heatmap', { params });
      return response.data;
    },
    // Auto refresh every 5 seconds if in realtime mode
    refetchInterval: heatmapMode === 'realtime' ? 5000 : false
  });

  const { data: pois } = useQuery({
    queryKey: ['pois-for-map'],
    queryFn: async () => {
      const response = await poiApi.getAll();
      return response.data;
    }
  });

  const columns = [
    {
      title: '#',
      dataIndex: 'poiId',
      key: 'rank',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: 'Tên POI',
      dataIndex: 'poiName',
      key: 'poiName'
    },
    {
      title: 'Số lần nghe',
      dataIndex: 'narrationCount',
      key: 'narrationCount',
      sorter: (a: POIStats, b: POIStats) => a.narrationCount - b.narrationCount,
      render: (count: number) => count.toLocaleString()
    },
    {
      title: 'Thời lượng TB (giây)',
      dataIndex: 'averageDurationSeconds',
      key: 'averageDuration',
      render: (seconds: number) => seconds.toFixed(1)
    },
    {
      title: 'Lần cuối',
      dataIndex: 'lastPlayedAt',
      key: 'lastPlayed',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
    }
  ];

  // Default center: Vinh Khanh, District 4, HCMC
  const mapCenter: [number, number] = [10.762622, 106.660172];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>📊 Phân tích & Thống kê</Title>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Space>
            <span>Khoảng thời gian:</span>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0], dates[1]]);
                }
              }}
              format="DD/MM/YYYY"
            />
          </Space>
        </Card>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={24}>
            <Card loading={isLoading} style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
              <Statistic
                title={<Badge status="processing" text="Người dùng đang online (Realtime)" />}
                value={summary?.activeOnlineUsers || 0}
                valueStyle={{ color: '#52c41a', fontSize: '2rem', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>
        
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card loading={isLoading}>
              <Statistic
                title="Tổng lượt thuyết minh"
                value={summary?.totalNarrations || 0}
                prefix={<EyeOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card loading={isLoading}>
              <Statistic
                title="Số POI được nghe"
                value={summary?.uniquePOIs || 0}
                prefix={<EnvironmentOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card loading={isLoading}>
              <Statistic
                title="Người dùng"
                value={summary?.uniqueUsers || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card loading={isLoading}>
              <Statistic
                title="Thời lượng TB (giây)"
                value={summary?.averageDurationSeconds || 0}
                precision={1}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        <Card
          title="🏆 Top POI được nghe nhiều nhất"
          loading={isLoading}
        >
          <Table
            dataSource={summary?.topPOIs || []}
            columns={columns}
            rowKey="poiId"
            pagination={false}
          />
        </Card>

        {/* Heatmap Section */}
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📍 Bản đồ nhiệt (Heatmap)</span>
              <Segmented
                options={[
                  { label: <span><FireOutlined /> Real-time</span>, value: 'realtime' },
                  { label: <span><HistoryOutlined /> Phân tích đường đi</span>, value: 'historical' },
                ]}
                value={heatmapMode}
                onChange={(val) => setHeatmapMode(val as 'realtime' | 'historical')}
              />
            </div>
          }
          loading={heatmapLoading}
        >
          <div style={{ height: '500px', borderRadius: '8px', overflow: 'hidden' }}>
            {heatmapLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Spin size="large" tip="Đang tải dữ liệu heatmap...">
                  <div style={{ height: '400px' }} />
                </Spin>
              </div>
            ) : (
              <MapContainer
                center={mapCenter}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Heatmap layer */}
                {heatmapData && heatmapData.length > 0 && (
                  <HeatmapLayer points={heatmapData} fitBounds={heatmapMode === 'historical'} />
                )}

                {/* POI markers */}
                {pois?.map((poi: POI) => (
                  <CircleMarker
                    key={poi.id}
                    center={[poi.latitude, poi.longitude]}
                    radius={8}
                    pathOptions={{
                      color: '#FF6F00',
                      fillColor: '#FF6F00',
                      fillOpacity: 0.8,
                      weight: 2,
                    }}
                  >
                    <Tooltip permanent={false}>
                      <strong>{poi.name}</strong>
                    </Tooltip>
                  </CircleMarker>
                ))}

                {/* Real-time Online Users Markers (Rendered last to appear on top) */}
                {heatmapMode === 'realtime' && heatmapData && heatmapData.map((pt, idx) => (
                  <Marker
                    key={`online-user-${idx}`}
                    position={[pt.latitude, pt.longitude]}
                    icon={onlineUserIcon}
                  >
                    <Tooltip>
                      <strong>Người dùng đang online</strong>
                    </Tooltip>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>

          {/* Legend */}
          <div style={{
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '13px', color: '#666' }}>Mật độ:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '20px', height: '12px', background: '#2196F3', borderRadius: '2px' }} />
              <span style={{ fontSize: '12px', color: '#888' }}>Thấp</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '20px', height: '12px', background: '#4CAF50', borderRadius: '2px' }} />
              <span style={{ fontSize: '12px', color: '#888' }}>Trung bình</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '20px', height: '12px', background: '#FFEB3B', borderRadius: '2px' }} />
              <span style={{ fontSize: '12px', color: '#888' }}>Cao</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '20px', height: '12px', background: '#FF9800', borderRadius: '2px' }} />
              <span style={{ fontSize: '12px', color: '#888' }}>Rất cao</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '20px', height: '12px', background: '#F44336', borderRadius: '2px' }} />
              <span style={{ fontSize: '12px', color: '#888' }}>Cực cao</span>
            </div>
            <span style={{ fontSize: '12px', color: '#aaa', marginLeft: '8px' }}>
              | 🔶 = Vị trí POI
            </span>
            {heatmapMode === 'realtime' && (
              <span style={{ fontSize: '12px', color: '#aaa', marginLeft: '8px' }}>
                | 🔵 = Người dùng Online
              </span>
            )}
          </div>

          {(!heatmapData || heatmapData.length === 0) && !heatmapLoading && (
            <Empty
              description="Chưa có dữ liệu heatmap trong khoảng thời gian này"
              style={{ marginTop: '16px' }}
            />
          )}
        </Card>
      </Space>
    </div>
  );
};

export default Analytics;
