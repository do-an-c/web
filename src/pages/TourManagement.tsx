import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Space, Tag, Modal, Form, Input, InputNumber, Transfer, message, Typography, Popconfirm } from 'antd';
import type { TransferProps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CompassOutlined } from '@ant-design/icons';
import { tourApi, poiApi } from '../services/api';
import type { Tour, POI, CreateTourRequest, TourStopRequest } from '../types';

const { Title, Text } = Typography;

const TourManagement: React.FC = () => {
  const [data, setData] = useState<Tour[]>([]);
  const [allPois, setAllPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [targetKeys, setTargetKeys] = useState<TransferProps['targetKeys']>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [toursRes, poisRes] = await Promise.all([
        tourApi.getAll(),
        poiApi.getAll()
      ]);
      setData(toursRes.data);
      setAllPois(poisRes.data);
    } catch (error) {
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    {
      title: 'Tên lộ trình',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong><CompassOutlined style={{ marginRight: 8, color: '#f5222d' }} />{text}</Text>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Thời lượng & KC',
      key: 'time_dist',
      render: (_: any, record: Tour) => (
        <Space direction="vertical" size="small">
          <Tag color="blue">{record.durationMinutes} phút</Tag>
          <Tag color="green">{record.distanceKm} km</Tag>
        </Space>
      ),
    },
    {
      title: 'Các điểm POI',
      key: 'pois',
      render: (_: any, record: Tour) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {record.stops?.map(stop => (
            <Tag color="volcano" key={stop.id}>
              {stop.poi?.name || `POI #${stop.poi?.id}`}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Tour) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} type="text" style={{ color: '#1890ff' }} onClick={() => handleEdit(record)}>Sửa</Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa tour này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button icon={<DeleteOutlined />} type="text" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleCreate = () => {
    form.resetFields();
    form.setFieldsValue({
      durationMinutes: 45,
      distanceKm: 1.0,
      imageUrl: 'https://raw.githubusercontent.com/minhquang/img/main/tour1.jpg'
    });
    setTargetKeys([]);
    setSelectedKeys([]);
    setEditingId(null);
    setIsModalVisible(true);
  };

  const handleEdit = (tour: Tour) => {
    form.setFieldsValue({
      name: tour.name,
      description: tour.description,
      durationMinutes: tour.durationMinutes,
      distanceKm: tour.distanceKm,
      imageUrl: tour.imageUrl
    });
    const selectedPoiIds = tour.stops?.map(s => s.poi?.id.toString()).filter((x): x is string => x !== undefined) || [];
    setTargetKeys(selectedPoiIds);
    setSelectedKeys([]);
    setEditingId(tour.id);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await tourApi.delete(id);
      message.success('Đã xóa tour thành công');
      fetchData();
    } catch (error) {
      message.error('Lỗi khi xóa tour');
    }
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      try {
        const stops: TourStopRequest[] = (targetKeys || []).map((poiId, index) => ({
          poiId: parseInt(poiId as string),
          order: index + 1
        }));

        const payload: CreateTourRequest = {
          name: values.name,
          description: values.description,
          durationMinutes: values.durationMinutes,
          distanceKm: values.distanceKm,
          imageUrl: values.imageUrl,
          stops
        };

        if (editingId !== null) {
          await tourApi.update(editingId, payload);
          message.success('Đã cập nhật lộ trình thành công!');
        } else {
          await tourApi.create(payload);
          message.success('Đã tạo lộ trình thành công!');
        }
        
        setIsModalVisible(false);
        fetchData();
      } catch (error) {
        message.error('Có lỗi xảy ra khi lưu tour');
      }
    });
  };

  const onChange: TransferProps['onChange'] = (nextTargetKeys) => {
    setTargetKeys(nextTargetKeys);
  };

  const onSelectChange: TransferProps['onSelectChange'] = (sourceSelectedKeys, targetSelectedKeys) => {
    setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys]);
  };

  // Map POIs to Transfer dataSource
  const transferDataSource = allPois.map(poi => ({
    key: poi.id.toString(),
    title: poi.name,
    description: poi.description
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Quản lý Tour Ẩm Thực</Title>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleCreate} style={{ backgroundColor: '#f5222d' }}>
          Tạo Lộ Trình Mới
        </Button>
      </div>

      <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          pagination={{ pageSize: 10 }} 
          loading={loading}
        />
      </Card>

      <Modal
        title={editingId ? "Cập nhật Lộ Trình" : "Tạo Lộ Trình Mới"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        okText="Lưu lộ trình"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên Tour" rules={[{ required: true, message: 'Vui lòng nhập tên tour' }]}>
            <Input placeholder="VD: Lộ trình ăn sập Vĩnh Khánh" />
          </Form.Item>
          
          <Form.Item name="description" label="Mô tả ngắn">
            <Input.TextArea rows={3} placeholder="Mô tả trải nghiệm cho du khách..." />
          </Form.Item>

          <Space size="large" style={{ display: 'flex', marginBottom: 8 }}>
            <Form.Item name="durationMinutes" label="Thời lượng (Phút)" rules={[{ required: true }]}>
              <InputNumber min={5} max={1440} />
            </Form.Item>
            <Form.Item name="distanceKm" label="Khoảng cách (Km)" rules={[{ required: true }]}>
              <InputNumber min={0.1} max={50} step={0.1} />
            </Form.Item>
          </Space>

          <Form.Item name="imageUrl" label="URL Hình ảnh (Tùy chọn)">
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item label="Thiết kế lộ trình (Thứ tự POI theo danh sách chọn)">
            <Transfer
              dataSource={transferDataSource}
              titles={['Các quán có sẵn', 'Lộ trình được chọn']}
              targetKeys={targetKeys}
              selectedKeys={selectedKeys}
              onChange={onChange}
              onSelectChange={onSelectChange}
              render={item => item.title as string}
              listStyle={{
                width: 350,
                height: 300,
              }}
              showSearch
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TourManagement;
