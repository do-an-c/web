import React from 'react';
import { Table, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { narrationApi } from '../services/api';
import type { Narration } from '../types';

const NarrationHistory: React.FC = () => {
  const { data: narrations, isLoading } = useQuery({
    queryKey: ['narrations'],
    queryFn: async () => {
      const response = await narrationApi.getAll();
      return response.data;
    },
  });

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'POI',
      key: 'poi',
      width: 200,
      render: (_: any, record: Narration) => (
        <div>
          <div><strong>{record.poiName}</strong></div>
          <div style={{ fontSize: '12px', color: '#999' }}>ID: {record.poiId}</div>
        </div>
      ),
    },
    {
      title: 'User ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Ngôn ngữ',
      dataIndex: 'languageCode',
      key: 'languageCode',
      width: 100,
      render: (languageCode: string) => (
        <Tag color="blue">{languageCode.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'narratType',
      key: 'narratType',
      width: 120,
      render: (type: string) => (
        <Tag color={type === 'TTS' ? 'green' : 'orange'}>{type}</Tag>
      ),
    },
    {
      title: 'Khoảng cách',
      dataIndex: 'distanceMeters',
      key: 'distanceMeters',
      width: 120,
      render: (distance: number) => `${distance.toFixed(0)}m`,
    },
    {
      title: 'Vị trí',
      key: 'location',
      width: 180,
      render: (_: any, record: Narration) => (
        <div>
          <div>Lat: {record.userLatitude.toFixed(6)}</div>
          <div>Lng: {record.userLongitude.toFixed(6)}</div>
        </div>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'playedAt',
      key: 'playedAt',
      width: 180,
      render: (playedAt: string) => new Date(playedAt).toLocaleString('vi-VN'),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1>Lịch sử thuyết minh</h1>
      <p style={{ marginBottom: '16px', color: '#666' }}>
        Theo dõi các lần người dùng được thuyết minh tự động
      </p>

      <Table
        columns={columns}
        dataSource={narrations}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} lượt thuyết minh`,
        }}
      />
    </div>
  );
};

export default NarrationHistory;
