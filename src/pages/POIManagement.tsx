import React, { useState } from 'react';
import { Table, Button, Space, Tag, Modal, message, Input, Image, Select } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { poiApi } from '../services/api';
import type { POI } from '../types';
import POIForm from '../components/POIForm.tsx';

const { Search } = Input;

const POIManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPOI, setEditingPOI] = useState<POI | null>(null);
  const [viewingPOI, setViewingPOI] = useState<POI | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const { data: pois, isLoading } = useQuery({
    queryKey: ['pois', statusFilter],
    queryFn: async () => {
      const response = await poiApi.getAll(statusFilter);
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => poiApi.delete(id),
    onSuccess: () => {
      message.success('Xóa POI thành công');
      queryClient.invalidateQueries({ queryKey: ['pois'] });
    },
    onError: () => {
      message.error('Xóa POI thất bại');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => poiApi.approve(id),
    onSuccess: () => {
      message.success('Phê duyệt POI thành công!');
      queryClient.invalidateQueries({ queryKey: ['pois'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Phê duyệt POI thất bại');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => poiApi.reject(id),
    onSuccess: () => {
      message.success('Đã từ chối POI');
      queryClient.invalidateQueries({ queryKey: ['pois'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || 'Từ chối POI thất bại');
    },
  });

  const handleCreate = () => {
    setEditingPOI(null);
    setIsModalOpen(true);
  };

  const handleEdit = (poi: POI) => {
    setEditingPOI(poi);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa POI này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleApprove = (id: number, name: string) => {
    Modal.confirm({
      title: 'Xác nhận phê duyệt',
      content: `Bạn có chắc chắn muốn phê duyệt POI "${name}"?`,
      okText: 'Phê duyệt',
      okType: 'primary',
      cancelText: 'Hủy',
      onOk: () => approveMutation.mutate(id),
    });
  };

  const handleReject = (id: number, name: string) => {
    Modal.confirm({
      title: 'Xác nhận từ chối',
      content: `Bạn có chắc chắn muốn từ chối POI "${name}"?`,
      okText: 'Từ chối',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => rejectMutation.mutate(id),
    });
  };

  const handleView = (poi: POI) => {
    setViewingPOI(poi);
  };

  const filteredPOIs = pois?.filter(poi => 
    poi.name.toLowerCase().includes(searchText.toLowerCase()) ||
    poi.description.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 100,
      render: (imageUrl: string) => 
        imageUrl ? <Image src={imageUrl} width={60} height={60} style={{ objectFit: 'cover', borderRadius: '4px' }} /> : <div style={{ width: 60, height: 60, background: '#f0f0f0', borderRadius: '4px' }} />
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Vị trí',
      key: 'location',
      width: 150,
      render: (_: any, record: POI) => (
        <div>
          <div>Lat: {record.latitude.toFixed(6)}</div>
          <div>Lng: {record.longitude.toFixed(6)}</div>
        </div>
      ),
    },
    {
      title: 'Bán kính (m)',
      dataIndex: 'radiusMeters',
      key: 'radiusMeters',
      width: 100,
    },
    {
      title: 'Độ ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
    },
    {
      title: 'Lượt xem',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 100,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        let color = 'default';
        if (status === 'Active') color = 'green';
        else if (status === 'Pending') color = 'orange';
        else if (status === 'Rejected') color = 'red';
        else if (status === 'Deleted') color = 'volcano';
        
        return (
          <Tag color={color}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 240,
      render: (_: any, record: POI) => (
        <Space size="small">
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            Xem
          </Button>
          {record.status === 'Pending' ? (
            <>
              <Button 
                type="link" 
                icon={<CheckCircleOutlined />} 
                onClick={() => handleApprove(record.id, record.name)}
                style={{ color: '#52c41a' }}
              >
                Duyệt
              </Button>
              <Button 
                type="link" 
                danger
                icon={<CloseCircleOutlined />} 
                onClick={() => handleReject(record.id, record.name)}
              >
                Từ chối
              </Button>
            </>
          ) : (
            <>
              <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                Sửa
              </Button>
              <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
                Xóa
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Quản lý POI (Điểm thuyết minh)</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Thêm POI mới
        </Button>
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Search
          placeholder="Tìm kiếm POI theo tên hoặc mô tả..."
          allowClear
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: '400px' }}
        />
        
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: '200px' }}
          options={[
            { value: 'All', label: '📋 Tất cả POI' },
            { value: 'Active', label: '✅ POI đã duyệt' },
            { value: 'Pending', label: '⏳ POI chờ duyệt' },
            { value: 'Rejected', label: '❌ POI bị từ chối' },
          ]}
        />
        
        {statusFilter === 'Pending' && (
          <Tag color="orange" style={{ margin: 0 }}>
            {filteredPOIs?.length || 0} POI đang chờ phê duyệt
          </Tag>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={filteredPOIs}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 1300 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} POI`,
        }}
      />

      <Modal
        title={editingPOI ? 'Chỉnh sửa POI' : 'Thêm POI mới'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
        footer={null}
        width={800}
      >
        <POIForm
          initialValues={editingPOI}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        title="Chi tiết POI"
        open={!!viewingPOI}
        onCancel={() => setViewingPOI(null)}
        footer={null}
        width={700}
      >
        {viewingPOI && (
          <div>
            {viewingPOI.imageUrl && (
              <Image src={viewingPOI.imageUrl} width="100%" style={{ marginBottom: '16px', borderRadius: '8px' }} />
            )}
            <p><strong>Tên:</strong> {viewingPOI.name}</p>
            <p><strong>Mô tả:</strong> {viewingPOI.description}</p>
            <p><strong>Vị trí:</strong> Lat: {viewingPOI.latitude}, Lng: {viewingPOI.longitude}</p>
            <p><strong>Bán kính:</strong> {viewingPOI.radiusMeters}m</p>
            <p><strong>Độ ưu tiên:</strong> {viewingPOI.priority}</p>
            <p><strong>Lượt xem:</strong> {viewingPOI.viewCount}</p>
            <p><strong>Trạng thái:</strong> <Tag color={viewingPOI.status === 'Active' ? 'green' : 'red'}>{viewingPOI.status}</Tag></p>
            {viewingPOI.googleMapsUrl && (
              <p><strong>Google Maps:</strong> <a href={viewingPOI.googleMapsUrl} target="_blank" rel="noopener noreferrer">Xem trên bản đồ</a></p>
            )}
            <p><strong>Ngày tạo:</strong> {new Date(viewingPOI.createdAt).toLocaleString('vi-VN')}</p>
            <p><strong>Cập nhật:</strong> {new Date(viewingPOI.updatedAt).toLocaleString('vi-VN')}</p>
            
            {viewingPOI.translations && viewingPOI.translations.length > 0 && (
              <>
                <h3>Bản dịch:</h3>
                {viewingPOI.translations.map((translation, index) => (
                  <div key={index} style={{ marginBottom: '12px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                    <p><strong>Ngôn ngữ:</strong> {translation.languageCode}</p>
                    <p><strong>Tên:</strong> {translation.name}</p>
                    <p><strong>Nội dung:</strong> {translation.content}</p>
                    {translation.approvalStatus && <p><strong>Trạng thái:</strong> {translation.approvalStatus}</p>}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default POIManagement;
