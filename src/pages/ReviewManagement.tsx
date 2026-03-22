import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Select, Space, Tag, Popconfirm, message, Card, Rate, Statistic, Row, Col } from 'antd';
import { DeleteOutlined, StarOutlined, CommentOutlined } from '@ant-design/icons';
import { poiApi, reviewApi } from '../services/api';
import type { Review } from '../types';
import dayjs from 'dayjs';

export default function ReviewManagement() {
  const queryClient = useQueryClient();
  const [selectedPOI, setSelectedPOI] = useState<number | null>(null);

  const { data: pois } = useQuery({
    queryKey: ['pois'],
    queryFn: () => poiApi.getAll().then(r => r.data),
  });

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', selectedPOI],
    queryFn: () => selectedPOI 
      ? reviewApi.getByPOI(selectedPOI).then(r => r.data)
      : reviewApi.getAll().then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => reviewApi.delete(id),
    onSuccess: () => {
      message.success('Đã xoá đánh giá');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: () => message.error('Lỗi khi xoá'),
  });

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  const ratingColors: Record<number, string> = {
    5: 'green', 4: 'lime', 3: 'orange', 2: 'volcano', 1: 'red'
  };

  const columns = [
    {
      title: 'Địa điểm',
      dataIndex: 'poiName',
      sorter: (a: Review, b: Review) => a.poiName.localeCompare(b.poiName),
      filters: pois?.map(p => ({ text: p.name, value: p.id })),
      onFilter: (value: any, record: Review) => record.poiId === value,
    },
    { title: 'Người đánh giá', dataIndex: 'userName' },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      sorter: (a: Review, b: Review) => a.rating - b.rating,
      render: (v: number) => (
        <Space>
          <Rate disabled defaultValue={v} style={{ fontSize: 14 }} />
          <Tag color={ratingColors[v]}>{v}/5</Tag>
        </Space>
      ),
    },
    {
      title: 'Bình luận',
      dataIndex: 'comment',
      ellipsis: true,
      render: (v: string) => v || <span style={{ color: '#ccc' }}>Không có bình luận</span>,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      sorter: (a: Review, b: Review) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Thao tác',
      width: 80,
      render: (_: any, record: Review) => (
        <Popconfirm title="Xoá đánh giá này?" onConfirm={() => deleteMutation.mutate(record.id)}>
          <DeleteOutlined style={{ color: 'red', cursor: 'pointer' }} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng đánh giá"
              value={reviews?.length || 0}
              prefix={<CommentOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Điểm trung bình"
              value={avgRating}
              suffix="/ 5"
              prefix={<StarOutlined />}
              valueStyle={{ color: Number(avgRating) >= 4 ? '#3f8600' : Number(avgRating) >= 3 ? '#d48806' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="5 sao"
              value={reviews?.filter(r => r.rating === 5).length || 0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="1-2 sao"
              value={reviews?.filter(r => r.rating <= 2).length || 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<><StarOutlined /> Quản lý Đánh giá</>}
        extra={
          <Select
            allowClear
            placeholder="Lọc theo địa điểm"
            style={{ width: 220 }}
            onChange={(v) => setSelectedPOI(v || null)}
            options={pois?.map(p => ({ label: p.name, value: p.id }))}
          />
        }
      >
        <Table
          columns={columns}
          dataSource={reviews}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>
    </div>
  );
}
