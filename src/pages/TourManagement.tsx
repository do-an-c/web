import React, { useState } from 'react';
import { Card, Button, Table, Space, Tag, Modal, Form, Input, Transfer, message, Typography } from 'antd';
import type { TransferProps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CompassOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// Mock data
const mockTours = [
  {
    id: 1,
    name: 'Hải Sản Bùng Nổ',
    desc: 'Lộ trình khám phá các quán hải sản tươi sống bật nhất Vĩnh Khánh',
    time: '45 phút',
    pois: ['Ốc Vũ', 'Hải Sản Biển Đông']
  },
  {
    id: 2,
    name: '100k Ăn Sập Vĩnh Khánh',
    desc: 'Tour ăn vặt siêu hạt dẻ cho sinh viên học sinh',
    time: '1h 20 phút',
    pois: ['Bánh Tráng Trộn 123', 'Trà Sữa Cô Tư', 'Xúc Xích Nướng Lề Đường']
  }
];

const mockPoiOptions = [
  { key: 'poi_1', title: 'Ốc Vũ', description: 'Hải sản' },
  { key: 'poi_2', title: 'Lẩu Dê Oanh', description: 'Lẩu' },
  { key: 'poi_3', title: 'Trà Sữa Cô Tư', description: 'Đồ uống' },
  { key: 'poi_4', title: 'Bánh Tráng Trộn 123', description: 'Ăn vặt' },
  { key: 'poi_5', title: 'Hải Sản Biển Đông', description: 'Hải sản' },
  { key: 'poi_6', title: 'Xúc Xích Nướng Lề Đường', description: 'Ăn vặt' },
];

const TourManagement: React.FC = () => {
  const [data] = useState(mockTours);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [targetKeys, setTargetKeys] = useState<TransferProps['targetKeys']>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();

  const columns = [
    {
      title: 'Tên lộ trình',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong><CompassOutlined style={{ marginRight: 8, color: '#f5222d' }} />{text}</Text>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'desc',
      key: 'desc',
    },
    {
      title: 'Thời lượng',
      dataIndex: 'time',
      key: 'time',
      render: (time: string) => <Tag color="blue">{time}</Tag>,
    },
    {
      title: 'Các điểm POI',
      dataIndex: 'pois',
      key: 'pois',
      render: (pois: string[]) => (
        <>
          {pois.map(tag => (
            <Tag color="volcano" key={tag}>
              {tag}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button icon={<EditOutlined />} type="text" style={{ color: '#1890ff' }}>Sửa</Button>
          <Button icon={<DeleteOutlined />} type="text" danger>Xóa</Button>
        </Space>
      ),
    },
  ];

  const handleCreate = () => {
    form.resetFields();
    setTargetKeys([]);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(() => {
      message.success('Đã lưu lộ trình thành công!');
      setIsModalVisible(false);
    });
  };

  const onChange: TransferProps['onChange'] = (nextTargetKeys) => {
    setTargetKeys(nextTargetKeys);
  };

  const onSelectChange: TransferProps['onSelectChange'] = (sourceSelectedKeys, targetSelectedKeys) => {
    setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys]);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Quản lý Tour Ẩm Thực</Title>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleCreate} style={{ backgroundColor: '#f5222d' }}>
          Tạo Lộ Trình Mới
        </Button>
      </div>

      <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Table columns={columns} dataSource={data} rowKey="id" pagination={{ pageSize: 5 }} />
      </Card>

      <Modal
        title="Tạo Lộ Trình Mới"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        okText="Lưu lộ trình"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên Tour" rules={[{ required: true, message: 'Vui lòng nhập tên tour' }]}>
            <Input placeholder="VD: Lộ trình ăn sập Vĩnh Khánh" />
          </Form.Item>
          
          <Form.Item name="desc" label="Mô tả ngắn">
            <Input.TextArea rows={3} placeholder="Mô tả trải nghiệm cho du khách..." />
          </Form.Item>

          <Form.Item label="Thiết kế lộ trình (Thứ tự POI)">
            <Transfer
              dataSource={mockPoiOptions}
              titles={['Các quán có sẵn', 'Lộ trình được chọn']}
              targetKeys={targetKeys}
              selectedKeys={selectedKeys}
              onChange={onChange}
              onSelectChange={onSelectChange}
              render={item => item.title}
              listStyle={{
                width: 350,
                height: 300,
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TourManagement;
