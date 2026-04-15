import React, { useState } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, message, Typography, Popconfirm, Tooltip, Badge, Avatar } from 'antd';
import { PlusOutlined, LockOutlined, UnlockOutlined, DeleteOutlined, UserOutlined, CrownOutlined, ShopOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, authApi } from '../services/api';

const { Title, Text } = Typography;

interface UserRecord {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  restaurantOwner: {
    id: number;
    restaurantName: string;
    description: string;
    address: string;
    logoUrl: string;
    mainPOIId: number | null;
  } | null;
}

const UserManagement: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const queryClient = useQueryClient();

  // Fetch users
  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll(),
  });

  const users: UserRecord[] = usersResponse?.data || [];

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (values: { username: string; password: string; email: string; fullName: string; phoneNumber?: string; role: string }) =>
      authApi.register(values),
    onSuccess: () => {
      message.success('Tạo tài khoản thành công!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalVisible(false);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Lỗi khi tạo tài khoản');
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (id: number) => userApi.toggleStatus(id),
    onSuccess: () => {
      message.success('Đã cập nhật trạng thái!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => userApi.delete(id),
    onSuccess: () => {
      message.success('Đã xóa tài khoản!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Lỗi khi xóa tài khoản');
    },
  });

  const filteredUsers = users.filter(u =>
    u.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchText.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Người dùng',
      key: 'user',
      width: 280,
      render: (_: unknown, record: UserRecord) => (
        <Space>
          <Avatar
            icon={record.role === 'Admin' ? <CrownOutlined /> : <ShopOutlined />}
            style={{ backgroundColor: record.role === 'Admin' ? '#f5222d' : '#1890ff' }}
          />
          <div>
            <Text strong>{record.fullName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>@{record.username}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: 'SĐT',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 130,
      render: (phone: string) => phone || <Text type="secondary">—</Text>,
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 160,
      filters: [
        { text: 'Admin', value: 'Admin' },
        { text: 'Chủ quán', value: 'RestaurantOwner' },
      ],
      onFilter: (value: unknown, record: UserRecord) => record.role === value,
      render: (role: string) => (
        <Tag icon={role === 'Admin' ? <CrownOutlined /> : <ShopOutlined />} color={role === 'Admin' ? 'red' : 'blue'}>
          {role === 'Admin' ? 'Admin' : 'Chủ quán'}
        </Tag>
      ),
    },
    {
      title: 'Quán liên kết',
      key: 'restaurant',
      width: 180,
      render: (_: unknown, record: UserRecord) =>
        record.restaurantOwner ? (
          <Tooltip title={record.restaurantOwner.address || 'Chưa có địa chỉ'}>
            <Tag color="volcano">{record.restaurantOwner.restaurantName}</Tag>
          </Tooltip>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: 'Active', value: 'Active' },
        { text: 'Inactive', value: 'Inactive' },
      ],
      onFilter: (value: unknown, record: UserRecord) => record.status === value,
      render: (status: string) => (
        <Badge status={status === 'Active' ? 'success' : 'error'} text={status === 'Active' ? 'Hoạt động' : 'Đã khóa'} />
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
      sorter: (a: UserRecord, b: UserRecord) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: UserRecord) => (
        <Space>
          <Tooltip title={record.status === 'Active' ? 'Khóa tài khoản' : 'Mở khóa'}>
            <Button
              type="text"
              icon={record.status === 'Active' ? <LockOutlined /> : <UnlockOutlined />}
              onClick={() => toggleStatusMutation.mutate(record.id)}
              style={{ color: record.status === 'Active' ? '#faad14' : '#52c41a' }}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa tài khoản?"
            description={`Bạn có chắc muốn xóa "${record.fullName}"?`}
            onConfirm={() => deleteUserMutation.mutate(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button type="text" icon={<DeleteOutlined />} danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleCreateUser = () => {
    form.validateFields().then(values => {
      createUserMutation.mutate(values);
    });
  };

  const adminCount = users.filter(u => u.role === 'Admin').length;
  const ownerCount = users.filter(u => u.role === 'RestaurantOwner').length;
  const activeCount = users.filter(u => u.status === 'Active').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Quản lý Người dùng</Title>
          <Text type="secondary">Quản lý tài khoản Admin và Chủ cửa hàng POI</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}>
            Tải lại
          </Button>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsModalVisible(true)} style={{ backgroundColor: '#f5222d' }}>
            Tạo tài khoản
          </Button>
        </Space>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <Card size="small" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <Text type="secondary">Tổng người dùng</Text>
          <Title level={3} style={{ margin: '4px 0 0', color: '#1890ff' }}><UserOutlined /> {users.length}</Title>
        </Card>
        <Card size="small" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <Text type="secondary">Admin</Text>
          <Title level={3} style={{ margin: '4px 0 0', color: '#f5222d' }}><CrownOutlined /> {adminCount}</Title>
        </Card>
        <Card size="small" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <Text type="secondary">Chủ quán</Text>
          <Title level={3} style={{ margin: '4px 0 0', color: '#1890ff' }}><ShopOutlined /> {ownerCount}</Title>
        </Card>
        <Card size="small" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <Text type="secondary">Đang hoạt động</Text>
          <Title level={3} style={{ margin: '4px 0 0', color: '#52c41a' }}>✅ {activeCount}</Title>
        </Card>
      </div>

      {/* Table */}
      <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Tìm theo tên, username, email..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
            style={{ width: 350 }}
          />
        </div>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Tổng ${total} người dùng` }}
        />
      </Card>

      {/* Create User Modal */}
      <Modal
        title="Tạo tài khoản mới"
        open={isModalVisible}
        onOk={handleCreateUser}
        onCancel={() => { setIsModalVisible(false); form.resetFields(); }}
        okText="Tạo tài khoản"
        cancelText="Hủy"
        confirmLoading={createUserMutation.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
            <Input placeholder="VD: Nguyễn Văn A" />
          </Form.Item>
          <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, message: 'Vui lòng nhập username' }, { min: 3, message: 'Tối thiểu 3 ký tự' }]}>
            <Input placeholder="VD: nguyenvana" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}>
            <Input placeholder="VD: nguyenvana@gmail.com" />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }, { min: 6, message: 'Tối thiểu 6 ký tự' }]}>
            <Input.Password placeholder="Tối thiểu 6 ký tự" />
          </Form.Item>
          <Form.Item name="phoneNumber" label="Số điện thoại">
            <Input placeholder="VD: 0901234567" />
          </Form.Item>
          <Form.Item name="role" label="Vai trò" rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]} initialValue="RestaurantOwner">
            <Select>
              <Select.Option value="RestaurantOwner">
                <Space><ShopOutlined /> Chủ quán (RestaurantOwner)</Space>
              </Select.Option>
              <Select.Option value="Admin">
                <Space><CrownOutlined /> Admin</Space>
              </Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
