import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, InputNumber, Switch, Select, Space, Tag, Popconfirm, message, Card, Image } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ShopOutlined } from '@ant-design/icons';
import { poiApi, menuApi } from '../services/api';
import type { MenuItem, CreateMenuItem } from '../types';

export default function MenuManagement() {
  const queryClient = useQueryClient();
  const [selectedPOI, setSelectedPOI] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form] = Form.useForm();

  const { data: pois } = useQuery({
    queryKey: ['pois'],
    queryFn: () => poiApi.getAll().then(r => r.data),
  });

  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['menu', selectedPOI],
    queryFn: () => selectedPOI 
      ? menuApi.getByPOI(selectedPOI).then(r => r.data)
      : menuApi.getAll().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: { poiId: number; item: CreateMenuItem }) => menuApi.create(data.poiId, data.item),
    onSuccess: () => {
      message.success('Đã thêm món');
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      setModalOpen(false);
      form.resetFields();
    },
    onError: () => message.error('Lỗi khi thêm món'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; item: Partial<CreateMenuItem> }) => menuApi.update(data.id, data.item),
    onSuccess: () => {
      message.success('Đã cập nhật');
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      setModalOpen(false);
      setEditingItem(null);
      form.resetFields();
    },
    onError: () => message.error('Lỗi khi cập nhật'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => menuApi.delete(id),
    onSuccess: () => {
      message.success('Đã xoá');
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
    onError: () => message.error('Lỗi khi xoá'),
  });

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, item: values });
    } else {
      const poiId = selectedPOI || values.poiId;
      if (!poiId) {
        message.error('Vui lòng chọn địa điểm');
        return;
      }
      createMutation.mutate({ poiId, item: values });
    }
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ isAvailable: true, price: 0 });
    setModalOpen(true);
  };

  const poiName = (poiId: number) => pois?.find(p => p.id === poiId)?.name || `POI #${poiId}`;

  const columns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'imageUrl',
      width: 80,
      render: (url: string) => {
        const isValid = url && !url.includes('via.placeholder.com') && !url.includes('th.bing.com');
        const cleanUrl = url?.startsWith('data:image') ? url.replace(/\\s+/g, '') : url;
        return isValid ? <Image src={cleanUrl} width={50} height={50} style={{ objectFit: 'cover', borderRadius: 6 }} fallback="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGZmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+" /> : <ShopOutlined style={{ fontSize: 32, color: '#ccc' }} />;
      },
    },
    { title: 'Tên món', dataIndex: 'name', sorter: (a: MenuItem, b: MenuItem) => a.name.localeCompare(b.name) },
    { title: 'Mô tả', dataIndex: 'description', ellipsis: true },
    {
      title: 'Giá',
      dataIndex: 'price',
      sorter: (a: MenuItem, b: MenuItem) => a.price - b.price,
      render: (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v),
    },
    {
      title: 'Địa điểm',
      dataIndex: 'poiId',
      render: (id: number) => poiName(id),
      filters: pois?.map(p => ({ text: p.name, value: p.id })),
      onFilter: (value: any, record: MenuItem) => record.poiId === value,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isAvailable',
      render: (v: boolean) => v ? <Tag color="green">Còn hàng</Tag> : <Tag color="red">Hết hàng</Tag>,
    },
    {
      title: 'Thao tác',
      width: 120,
      render: (_: any, record: MenuItem) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          <Popconfirm title="Xoá món này?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={<><ShopOutlined /> Quản lý Thực đơn</>}
        extra={
          <Space>
            <Select
              allowClear
              placeholder="Lọc theo địa điểm"
              style={{ width: 220 }}
              onChange={(v) => setSelectedPOI(v || null)}
              options={pois?.map(p => ({ label: p.name, value: p.id }))}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Thêm món
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={menuItems}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title={editingItem ? 'Sửa món ăn' : 'Thêm món mới'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingItem(null); form.resetFields(); }}
        onOk={handleSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText={editingItem ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Huỷ"
      >
        <Form form={form} layout="vertical">
          {!selectedPOI && !editingItem && (
            <Form.Item name="poiId" label="Địa điểm" rules={[{ required: true, message: 'Chọn địa điểm' }]}>
              <Select
                placeholder="Chọn địa điểm"
                options={pois?.map(p => ({ label: p.name, value: p.id }))}
              />
            </Form.Item>
          )}
          <Form.Item name="name" label="Tên món" rules={[{ required: true, message: 'Nhập tên món' }]}>
            <Input placeholder="VD: Ốc hấp sả" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} placeholder="Mô tả ngắn về món ăn" />
          </Form.Item>
          <Form.Item name="price" label="Giá (VNĐ)" rules={[{ required: true, message: 'Nhập giá' }]}>
            <InputNumber
              min={0}
              step={1000}
              style={{ width: '100%' }}
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={v => v!.replace(/,/g, '') as any}
            />
          </Form.Item>
          <Form.Item name="imageUrl" label="URL Hình ảnh">
            <Input placeholder="https://example.com/image.jpg" />
          </Form.Item>
          <Form.Item name="isAvailable" label="Còn hàng" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
