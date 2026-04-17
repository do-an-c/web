import React, { useState } from 'react';
import { Table, Button, Tag, Space, message, Modal, Typography, Descriptions, Card, Tabs, Badge, Image } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { poiApi, translationApi } from '../services/api';
import type { POI, POITranslation } from '../types';

const { Title, Text, Paragraph } = Typography;

const ApprovalManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTranslation, setSelectedTranslation] = useState<POITranslation & { poiName?: string } | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [poiDetailVisible, setPOIDetailVisible] = useState(false);

  // ── Fetch ALL POIs (admin sees all statuses) ──────────────────────────────
  const { data: allPois = [], isLoading: poisLoading } = useQuery({
    queryKey: ['pois-all'],
    queryFn: async () => {
      const response = await poiApi.getAll();
      return response.data;
    },
  });

  // POIs waiting for deletion approval
  const pendingDeletePois = allPois.filter((p: POI) => p.status === 'PendingDelete');

  // ── Fetch pending translations ────────────────────────────────────────────
  const { data: pois = [], isLoading: translationsLoading } = useQuery({
    queryKey: ['pois'],
    queryFn: async () => {
      const response = await poiApi.getAll();
      return response.data;
    },
  });

  const allTranslations = pois.flatMap((poi: POI) =>
    (poi.translations || []).map((translation: POITranslation) => ({
      ...translation,
      poiId: poi.id,
      poiName: poi.name,
    }))
  );
  const pendingTranslations = allTranslations.filter((t: any) => t.approvalStatus === 'Pending');

  // ── POI approve/reject mutations ──────────────────────────────────────────
  const poiApproveMutation = useMutation({
    mutationFn: (id: number) => poiApi.approve(id),
    onSuccess: () => {
      message.success('Đã duyệt xóa POI thành công!');
      queryClient.invalidateQueries({ queryKey: ['pois-all'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Không thể duyệt POI');
    },
  });

  const poiRejectMutation = useMutation({
    mutationFn: (id: number) => poiApi.reject(id),
    onSuccess: () => {
      message.success('Đã từ chối xóa POI, POI được khôi phục Active!');
      queryClient.invalidateQueries({ queryKey: ['pois-all'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Không thể từ chối');
    },
  });

  const handleApprovePOIDelete = (poi: POI) => {
    Modal.confirm({
      title: '⚠️ Xác nhận Duyệt Xóa POI',
      content: (
        <div>
          <p>Bạn có chắc muốn <strong>phê duyệt xóa</strong> POI này?</p>
          <p><strong>Tên:</strong> {poi.name}</p>
          <p style={{ color: 'red' }}>Hành động này sẽ xóa vĩnh viễn POI khỏi hệ thống!</p>
        </div>
      ),
      okText: 'Duyệt Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => poiApproveMutation.mutate(poi.id),
    });
  };

  const handleRejectPOIDelete = (poi: POI) => {
    Modal.confirm({
      title: 'Từ chối Yêu cầu Xóa',
      content: (
        <div>
          <p>Từ chối xóa POI <strong>{poi.name}</strong>?</p>
          <p>POI sẽ được khôi phục lại trạng thái <Tag color="green">Active</Tag></p>
        </div>
      ),
      okText: 'Từ chối (Khôi phục)',
      cancelText: 'Hủy',
      onOk: () => poiRejectMutation.mutate(poi.id),
    });
  };

  // ── Translation approve/reject ────────────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await translationApi.updateApproval(id, status);
    },
    onSuccess: () => {
      message.success('Đã cập nhật trạng thái duyệt bản dịch!');
      queryClient.invalidateQueries({ queryKey: ['pois'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Lỗi cập nhật');
    },
  });

  const handleApprove = (id: number) => {
    Modal.confirm({
      title: 'Duyệt bản dịch',
      content: 'Bạn có muốn duyệt bản dịch này không?',
      onOk: () => approveMutation.mutate({ id, status: 'Approved' }),
    });
  };

  const handleReject = (id: number) => {
    Modal.confirm({
      title: 'Từ chối bản dịch',
      content: 'Bạn có muốn từ chối bản dịch này không?',
      okText: 'Từ chối',
      okType: 'danger',
      onOk: () => approveMutation.mutate({ id, status: 'Rejected' }),
    });
  };

  // ── POI PendingDelete columns ─────────────────────────────────────────────
  const poiColumns = [
    {
      title: 'Ảnh',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 80,
      render: (url: string) =>
        url ? (
          <Image src={url} width={50} height={50} style={{ objectFit: 'cover', borderRadius: 6 }} />
        ) : (
          <div style={{ width: 50, height: 50, background: '#f0f0f0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            🍜
          </div>
        ),
    },
    {
      title: 'Tên POI',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Vị trí',
      key: 'location',
      width: 180,
      render: (_: any, record: POI) => (
        <Text style={{ fontSize: 12 }}>
          Lat: {record.latitude?.toFixed(6)}<br />
          Lng: {record.longitude?.toFixed(6)}
        </Text>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: () => <Tag color="orange">⏳ Chờ duyệt xóa</Tag>,
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 230,
      fixed: 'right' as const,
      render: (_: any, record: POI) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => { setSelectedPOI(record); setPOIDetailVisible(true); }}
          >
            Xem
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleApprovePOIDelete(record)}
            loading={poiApproveMutation.isPending}
          >
            Duyệt Xóa
          </Button>
          <Button
            icon={<CloseOutlined />}
            size="small"
            onClick={() => handleRejectPOIDelete(record)}
            loading={poiRejectMutation.isPending}
          >
            Từ chối
          </Button>
        </Space>
      ),
    },
  ];

  // ── Translation columns ───────────────────────────────────────────────────
  const translationColumns = [
    {
      title: 'Tên POI',
      dataIndex: 'poiName',
      key: 'poiName',
      width: 200,
    },
    {
      title: 'Ngôn ngữ',
      dataIndex: 'languageCode',
      key: 'languageCode',
      width: 130,
      render: (code: string) => {
        const langMap: Record<string, string> = {
          vi: '🇻🇳 Tiếng Việt',
          en: '🇬🇧 English',
          ja: '🇯🇵 日本語',
          ko: '🇰🇷 한국어',
          zh: '🇨🇳 中文',
        };
        return langMap[code] || code;
      },
    },
    {
      title: 'Tên bản dịch',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Nội dung',
      dataIndex: 'content',
      key: 'content',
      width: 300,
      ellipsis: true,
      render: (text: string) => <Text ellipsis style={{ maxWidth: 300 }}>{text}</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 120,
      render: (status: string) => {
        const colorMap: Record<string, string> = { Pending: 'gold', Approved: 'green', Rejected: 'red' };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" icon={<EyeOutlined />} onClick={() => { setSelectedTranslation(record); setDetailModalVisible(true); }}>
            Xem
          </Button>
          {record.approvalStatus === 'Pending' && (
            <>
              <Button type="primary" icon={<CheckOutlined />} size="small" onClick={() => handleApprove(record.id)} loading={approveMutation.isPending}>
                Duyệt
              </Button>
              <Button danger icon={<CloseOutlined />} size="small" onClick={() => handleReject(record.id)} loading={approveMutation.isPending}>
                Từ chối
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  const tabItems = [
    {
      key: 'pending-delete',
      label: (
        <Badge count={pendingDeletePois.length} offset={[10, 0]}>
          <span>🗑️ Yêu cầu Xóa POI</span>
        </Badge>
      ),
      children: (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Text>Các POI dưới đây đã được <strong>chủ quán yêu cầu xóa</strong>. Admin cần duyệt hoặc từ chối.</Text>
          </Card>
          <Table
            columns={poiColumns}
            dataSource={pendingDeletePois}
            rowKey="id"
            loading={poisLoading}
            scroll={{ x: 1100 }}
            locale={{ emptyText: '✅ Không có yêu cầu xóa nào đang chờ duyệt' }}
            pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          />
        </>
      ),
    },
    {
      key: 'translations',
      label: (
        <Badge count={pendingTranslations.length} offset={[10, 0]}>
          <span>📝 Bản dịch chờ duyệt</span>
        </Badge>
      ),
      children: (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Space size="large">
              <div><Text strong>Tổng bản dịch: </Text><Text>{allTranslations.length}</Text></div>
              <div><Text strong>Chờ duyệt: </Text><Tag color="gold">{pendingTranslations.length}</Tag></div>
              <div><Text strong>Đã duyệt: </Text><Tag color="green">{allTranslations.filter((t: any) => t.approvalStatus === 'Approved').length}</Tag></div>
              <div><Text strong>Từ chối: </Text><Tag color="red">{allTranslations.filter((t: any) => t.approvalStatus === 'Rejected').length}</Tag></div>
            </Space>
          </Card>
          <Table
            columns={translationColumns}
            dataSource={allTranslations}
            rowKey="id"
            loading={translationsLoading}
            scroll={{ x: 1400 }}
            pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          />
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>🛡️ Quản lý Phê duyệt</Title>

      <Tabs defaultActiveKey="pending-delete" items={tabItems} />

      {/* POI Detail Modal */}
      <Modal
        title={`Chi tiết POI: ${selectedPOI?.name}`}
        open={poiDetailVisible}
        onCancel={() => setPOIDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPOIDetailVisible(false)}>Đóng</Button>,
          <Button
            key="reject"
            icon={<CloseOutlined />}
            onClick={() => { if (selectedPOI) { handleRejectPOIDelete(selectedPOI); setPOIDetailVisible(false); } }}
            loading={poiRejectMutation.isPending}
          >
            Từ chối xóa
          </Button>,
          <Button
            key="approve"
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => { if (selectedPOI) { handleApprovePOIDelete(selectedPOI); setPOIDetailVisible(false); } }}
            loading={poiApproveMutation.isPending}
          >
            Duyệt Xóa
          </Button>,
        ]}
        width={700}
      >
        {selectedPOI && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Tên POI">{selectedPOI.name}</Descriptions.Item>
            <Descriptions.Item label="Mô tả">{selectedPOI.description}</Descriptions.Item>
            <Descriptions.Item label="Vị trí">Lat: {selectedPOI.latitude}, Lng: {selectedPOI.longitude}</Descriptions.Item>
            <Descriptions.Item label="Bán kính">{selectedPOI.radiusMeters}m</Descriptions.Item>
            <Descriptions.Item label="Trạng thái"><Tag color="orange">PendingDelete</Tag></Descriptions.Item>
            {selectedPOI.imageUrl && (
              <Descriptions.Item label="Ảnh">
                <Image src={selectedPOI.imageUrl} width={200} />
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Translation Detail Modal */}
      <Modal
        title="Chi tiết bản dịch"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>Đóng</Button>,
          selectedTranslation?.approvalStatus === 'Pending' && (
            <>
              <Button key="approve" type="primary" icon={<CheckOutlined />}
                onClick={() => { if (selectedTranslation?.id) { handleApprove(selectedTranslation.id); setDetailModalVisible(false); } }}
                loading={approveMutation.isPending}
              >
                Duyệt
              </Button>
              <Button key="reject" danger icon={<CloseOutlined />}
                onClick={() => { if (selectedTranslation?.id) { handleReject(selectedTranslation.id); setDetailModalVisible(false); } }}
                loading={approveMutation.isPending}
              >
                Từ chối
              </Button>
            </>
          ),
        ]}
        width={800}
      >
        {selectedTranslation && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Tên POI">{selectedTranslation.poiName}</Descriptions.Item>
            <Descriptions.Item label="Ngôn ngữ">{selectedTranslation.languageCode}</Descriptions.Item>
            <Descriptions.Item label="Tên bản dịch">{selectedTranslation.name}</Descriptions.Item>
            <Descriptions.Item label="Nội dung">
              <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0, maxHeight: 300, overflow: 'auto' }}>
                {selectedTranslation.content}
              </Paragraph>
            </Descriptions.Item>
            <Descriptions.Item label="Audio URL">{selectedTranslation.audioUrl || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={selectedTranslation.approvalStatus === 'Pending' ? 'gold' : selectedTranslation.approvalStatus === 'Approved' ? 'green' : 'red'}>
                {selectedTranslation.approvalStatus}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ApprovalManagement;
