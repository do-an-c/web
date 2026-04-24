import React, { useState } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input,
  Select, message, Typography, Popconfirm, Tooltip, Badge,
  Avatar, DatePicker,
} from 'antd';
import {
  PlusOutlined, LockOutlined, UnlockOutlined, DeleteOutlined,
  UserOutlined, CrownOutlined, ShopOutlined, ReloadOutlined,
  SearchOutlined, RiseOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, authApi } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// ─── Tier config ──────────────────────────────────────────────────────────────
const TIER_CONFIG: Record<string, { label: string; color: string; priority: number }> = {
  Free:  { label: 'Free',  color: '#8c8c8c', priority: 5  },
  Plus:  { label: 'Plus',  color: '#1677ff', priority: 8  },
  Pro:   { label: 'Pro',   color: '#faad14', priority: 10 },
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface RestaurantOwnerInfo {
  id: number;
  restaurantName: string;
  description: string;
  address: string;
  logoUrl: string;
  mainPOIId: number | null;
  subscriptionTier: number;          // 0=Free 1=Plus 2=Pro
  subscriptionTierName: string;      // "Free"|"Plus"|"Pro"
  tierExpiresAt: string | null;
}

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
  restaurantOwner: RestaurantOwnerInfo | null;
}

// ─── Helper ───────────────────────────────────────────────────────────────────
const getTierName = (owner: RestaurantOwnerInfo | null): string =>
  owner?.subscriptionTierName ?? 'Free';

// ─── Component ────────────────────────────────────────────────────────────────
const UserManagement: React.FC = () => {
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isTierModalVisible,   setIsTierModalVisible]   = useState(false);
  const [selectedUser,         setSelectedUser]          = useState<UserRecord | null>(null);

  const [createForm] = Form.useForm();
  const [tierForm]   = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const queryClient = useQueryClient();

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll(),
  });
  const users: UserRecord[] = usersResponse?.data || [];

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createUserMutation = useMutation({
    mutationFn: (values: { username: string; password: string; email: string; fullName: string; phoneNumber?: string; role: string }) =>
      authApi.register(values),
    onSuccess: () => {
      message.success('Tạo tài khoản thành công!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateModalVisible(false);
      createForm.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Lỗi khi tạo tài khoản');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: number) => userApi.toggleStatus(id),
    onSuccess: () => { message.success('Đã cập nhật trạng thái!'); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: (error: any) => { message.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái'); },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => userApi.delete(id),
    onSuccess: () => { message.success('Đã xóa tài khoản!'); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: (error: any) => { message.error(error.response?.data?.message || 'Lỗi khi xóa tài khoản'); },
  });

  const updateTierMutation = useMutation({
    mutationFn: ({ id, tier, expiresAt }: { id: number; tier: string; expiresAt?: string | null }) =>
      userApi.updateTier(id, tier, expiresAt),
    onSuccess: (res) => {
      const d = res.data;
      message.success(`✅ ${d.message} — Priority POI: ${d.newPriority} (${d.poisSynced} POI đã đồng bộ)`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsTierModalVisible(false);
      tierForm.resetFields();
      setSelectedUser(null);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Lỗi khi nâng gói');
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openTierModal = (record: UserRecord) => {
    setSelectedUser(record);
    const currentTier = getTierName(record.restaurantOwner);
    const expires = record.restaurantOwner?.tierExpiresAt;
    tierForm.setFieldsValue({
      tier: currentTier,
      expiresAt: expires ? dayjs(expires) : null,
    });
    setIsTierModalVisible(true);
  };

  const handleSaveTier = () => {
    tierForm.validateFields().then(values => {
      if (!selectedUser) return;
      updateTierMutation.mutate({
        id: selectedUser.id,
        tier: values.tier,
        expiresAt: values.expiresAt ? values.expiresAt.toISOString() : null,
      });
    });
  };

  // ── Filtered data ──────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u =>
    u.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchText.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchText.toLowerCase())
  );

  // ── Stats ──────────────────────────────────────────────────────────────────
  const adminCount  = users.filter(u => u.role === 'Admin').length;
  const ownerCount  = users.filter(u => u.role === 'RestaurantOwner').length;
  const activeCount = users.filter(u => u.status === 'Active').length;
  const proCount    = users.filter(u => getTierName(u.restaurantOwner) === 'Pro').length;

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns = [
    {
      title: 'Người dùng',
      key: 'user',
      width: 240,
      render: (_: unknown, record: UserRecord) => (
        <Space>
          <Avatar
            icon={record.role === 'Admin' ? <CrownOutlined /> : <ShopOutlined />}
            style={{ backgroundColor: record.role === 'Admin' ? '#f5222d' : '#1890ff' }}
          />
          <div>
            <Text strong>{record.fullName}</Text><br />
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
      width: 140,
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
      width: 160,
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
      title: 'Gói đăng ký',
      key: 'tier',
      width: 160,
      filters: [
        { text: 'Free',  value: 'Free'  },
        { text: 'Plus',  value: 'Plus'  },
        { text: 'Pro',   value: 'Pro'   },
      ],
      onFilter: (value: unknown, record: UserRecord) => getTierName(record.restaurantOwner) === value,
      render: (_: unknown, record: UserRecord) => {
        if (record.role !== 'RestaurantOwner') return <Text type="secondary">—</Text>;
        const tierName = getTierName(record.restaurantOwner);
        const cfg      = TIER_CONFIG[tierName] ?? TIER_CONFIG['Free'];
        const expires  = record.restaurantOwner?.tierExpiresAt;
        const expired  = expires ? dayjs(expires).isBefore(dayjs()) : false;

        return (
          <Space direction="vertical" size={0}>
            <Tag
              color={expired ? 'default' : cfg.color}
              style={{ fontWeight: 700, fontSize: 12 }}
            >
              {tierName}{expired ? ' (hết hạn)' : ''} · P{cfg.priority}
            </Tag>
            {expires && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                HH: {dayjs(expires).format('DD/MM/YYYY')}
              </Text>
            )}
          </Space>
        );
      },
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
      width: 110,
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
      sorter: (a: UserRecord, b: UserRecord) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: UserRecord) => (
        <Space>
          {/* Nâng/hạ gói — chỉ hiện với RestaurantOwner */}
          {record.role === 'RestaurantOwner' && (
            <Tooltip title="Nâng / hạ gói đăng ký">
              <Button
                type="text"
                icon={<RiseOutlined />}
                onClick={() => openTierModal(record)}
                style={{ color: '#faad14' }}
              />
            </Tooltip>
          )}
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Quản lý Người dùng</Title>
          <Text type="secondary">Quản lý tài khoản Admin và Chủ cửa hàng POI</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}>
            Tải lại
          </Button>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsCreateModalVisible(true)} style={{ backgroundColor: '#f5222d' }}>
            Tạo tài khoản
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
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
        <Card size="small" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <Text type="secondary">Gói Pro đang dùng</Text>
          <Title level={3} style={{ margin: '4px 0 0', color: '#faad14' }}>⭐ {proCount}</Title>
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
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Tổng ${total} người dùng` }}
        />
      </Card>

      {/* ── Modal: Tạo tài khoản ────────────────────────────────────────────── */}
      <Modal
        title="Tạo tài khoản mới"
        open={isCreateModalVisible}
        onOk={() => createForm.validateFields().then(v => createUserMutation.mutate(v))}
        onCancel={() => { setIsCreateModalVisible(false); createForm.resetFields(); }}
        okText="Tạo tài khoản"
        cancelText="Hủy"
        confirmLoading={createUserMutation.isPending}
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
            <Input placeholder="VD: Nguyễn Văn A" />
          </Form.Item>
          <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true }, { min: 3, message: 'Tối thiểu 3 ký tự' }]}>
            <Input placeholder="VD: nguyenvana" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true }, { type: 'email', message: 'Email không hợp lệ' }]}>
            <Input placeholder="VD: nguyenvana@gmail.com" />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }, { min: 6, message: 'Tối thiểu 6 ký tự' }]}>
            <Input.Password placeholder="Tối thiểu 6 ký tự" />
          </Form.Item>
          <Form.Item name="phoneNumber" label="Số điện thoại">
            <Input placeholder="VD: 0901234567" />
          </Form.Item>
          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]} initialValue="RestaurantOwner">
            <Select>
              <Select.Option value="RestaurantOwner"><Space><ShopOutlined /> Chủ quán (RestaurantOwner)</Space></Select.Option>
              <Select.Option value="Admin"><Space><CrownOutlined /> Admin</Space></Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Modal: Nâng / hạ gói ────────────────────────────────────────────── */}
      <Modal
        title={
          <Space>
            <RiseOutlined style={{ color: '#faad14' }} />
            <span>Quản lý gói đăng ký — <strong>{selectedUser?.fullName}</strong></span>
          </Space>
        }
        open={isTierModalVisible}
        onOk={handleSaveTier}
        onCancel={() => { setIsTierModalVisible(false); tierForm.resetFields(); setSelectedUser(null); }}
        okText="Lưu gói"
        cancelText="Hủy"
        confirmLoading={updateTierMutation.isPending}
        destroyOnHidden
        width={480}
      >
        {selectedUser && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
            <Text type="secondary">Quán: </Text>
            <Text strong>{selectedUser.restaurantOwner?.restaurantName ?? '—'}</Text>
            <br />
            <Text type="secondary">Gói hiện tại: </Text>
            <Tag color={TIER_CONFIG[getTierName(selectedUser.restaurantOwner)]?.color}>
              {getTierName(selectedUser.restaurantOwner)}
            </Tag>
          </div>
        )}
        <Form form={tierForm} layout="vertical">
          <Form.Item
            name="tier"
            label="Gói mới"
            rules={[{ required: true, message: 'Vui lòng chọn gói' }]}
          >
            <Select size="large">
              <Select.Option value="Free">
                <Space>
                  <Tag color={TIER_CONFIG.Free.color}>Free</Tag>
                  <Text type="secondary">Priority 5 — Mặc định</Text>
                </Space>
              </Select.Option>
              <Select.Option value="Plus">
                <Space>
                  <Tag color={TIER_CONFIG.Plus.color}>Plus</Tag>
                  <Text type="secondary">Priority 8 — Ưu tiên cao</Text>
                </Space>
              </Select.Option>
              <Select.Option value="Pro">
                <Space>
                  <Tag color={TIER_CONFIG.Pro.color}>Pro ⭐</Tag>
                  <Text type="secondary">Priority 10 — Luôn phát trước</Text>
                </Space>
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="expiresAt"
            label="Ngày hết hạn (để trống = vĩnh viễn với Free)"
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày hết hạn..."
              disabledDate={d => d && d < dayjs().startOf('day')}
            />
          </Form.Item>
          <div style={{ padding: '8px 12px', background: '#fffbe6', borderRadius: 6, border: '1px solid #ffe58f' }}>
            <Text style={{ fontSize: 12 }}>
              ⚡ Sau khi lưu, <strong>tất cả POI</strong> của chủ quán này sẽ được đồng bộ Priority ngay lập tức.
              POI mới tạo cũng tự động nhận Priority theo gói.
            </Text>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
