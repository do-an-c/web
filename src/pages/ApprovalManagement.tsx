import React, { useState } from 'react';
import { Table, Button, Tag, Space, message, Modal, Typography, Descriptions, Card } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { poiApi, translationApi } from '../services/api';
import type { POI, POITranslation } from '../types';

const { Title, Text, Paragraph } = Typography;

const ApprovalManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTranslation, setSelectedTranslation] = useState<POITranslation & { poiName?: string } | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Fetch all POIs with translations
  const { data: pois = [], isLoading } = useQuery({
    queryKey: ['pois'],
    queryFn: async () => {
      const response = await poiApi.getAll();
      return response.data;
    },
  });

  // Flatten all translations with POI info
  const allTranslations = pois.flatMap((poi: POI) =>
    poi.translations.map((translation: POITranslation) => ({
      ...translation,
      poiId: poi.id,
      poiName: poi.name,
    }))
  );

  // Filter pending translations
  const pendingTranslations = allTranslations.filter(
    (t: any) => t.approvalStatus === 'Pending'
  );

  // Approval mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await translationApi.updateApproval(id, status);
    },
    onSuccess: () => {
      message.success('Translation approval status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['pois'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to update approval status');
    },
  });

  const handleApprove = (id: number) => {
    Modal.confirm({
      title: 'Approve Translation',
      content: 'Are you sure you want to approve this translation?',
      onOk: () => approveMutation.mutate({ id, status: 'Approved' }),
    });
  };

  const handleReject = (id: number) => {
    Modal.confirm({
      title: 'Reject Translation',
      content: 'Are you sure you want to reject this translation?',
      okText: 'Reject',
      okType: 'danger',
      onOk: () => approveMutation.mutate({ id, status: 'Rejected' }),
    });
  };

  const showDetail = (record: any) => {
    setSelectedTranslation(record);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: 'POI Name',
      dataIndex: 'poiName',
      key: 'poiName',
      width: 200,
    },
    {
      title: 'Language',
      dataIndex: 'languageCode',
      key: 'languageCode',
      width: 100,
      render: (code: string) => {
        const langMap: Record<string, string> = {
          vi: '🇻🇳 Vietnamese',
          en: '🇬🇧 English',
          ja: '🇯🇵 Japanese',
          ko: '🇰🇷 Korean',
          zh: '🇨🇳 Chinese',
        };
        return langMap[code] || code;
      },
    },
    {
      title: 'Translation Name',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Content Preview',
      dataIndex: 'content',
      key: 'content',
      width: 300,
      ellipsis: true,
      render: (text: string) => (
        <Text ellipsis style={{ maxWidth: 300 }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      width: 120,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          Pending: 'gold',
          Approved: 'green',
          Rejected: 'red',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => (date ? new Date(date).toLocaleString() : 'N/A'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => showDetail(record)}
          >
            View
          </Button>
          {record.approvalStatus === 'Pending' && (
            <>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                size="small"
                onClick={() => handleApprove(record.id)}
                loading={approveMutation.isPending}
              >
                Approve
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                size="small"
                onClick={() => handleReject(record.id)}
                loading={approveMutation.isPending}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Content Approval Management</Title>
      
      <Card style={{ marginBottom: 16 }}>
        <Space size="large">
          <div>
            <Text strong>Total Translations: </Text>
            <Text>{allTranslations.length}</Text>
          </div>
          <div>
            <Text strong>Pending Approval: </Text>
            <Tag color="gold">{pendingTranslations.length}</Tag>
          </div>
          <div>
            <Text strong>Approved: </Text>
            <Tag color="green">
              {allTranslations.filter((t: any) => t.approvalStatus === 'Approved').length}
            </Tag>
          </div>
          <div>
            <Text strong>Rejected: </Text>
            <Tag color="red">
              {allTranslations.filter((t: any) => t.approvalStatus === 'Rejected').length}
            </Tag>
          </div>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={allTranslations}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 1400 }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} translations`,
        }}
      />

      <Modal
        title="Translation Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          selectedTranslation?.approvalStatus === 'Pending' && (
            <>
              <Button
                key="approve"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => {
                  if (selectedTranslation?.id) {
                    handleApprove(selectedTranslation.id);
                    setDetailModalVisible(false);
                  }
                }}
                loading={approveMutation.isPending}
              >
                Approve
              </Button>
              <Button
                key="reject"
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  if (selectedTranslation?.id) {
                    handleReject(selectedTranslation.id);
                    setDetailModalVisible(false);
                  }
                }}
                loading={approveMutation.isPending}
              >
                Reject
              </Button>
            </>
          ),
        ]}
        width={800}
      >
        {selectedTranslation && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="POI Name">
              {selectedTranslation.poiName}
            </Descriptions.Item>
            <Descriptions.Item label="Language">
              {selectedTranslation.languageCode}
            </Descriptions.Item>
            <Descriptions.Item label="Translation Name">
              {selectedTranslation.name}
            </Descriptions.Item>
            <Descriptions.Item label="Content">
              <Paragraph
                style={{ whiteSpace: 'pre-wrap', marginBottom: 0, maxHeight: 300, overflow: 'auto' }}
              >
                {selectedTranslation.content}
              </Paragraph>
            </Descriptions.Item>
            <Descriptions.Item label="Audio URL">
              {selectedTranslation.audioUrl || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag
                color={
                  selectedTranslation.approvalStatus === 'Pending'
                    ? 'gold'
                    : selectedTranslation.approvalStatus === 'Approved'
                    ? 'green'
                    : 'red'
                }
              >
                {selectedTranslation.approvalStatus}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {selectedTranslation.createdAt
                ? new Date(selectedTranslation.createdAt).toLocaleString()
                : 'N/A'}
            </Descriptions.Item>
            {selectedTranslation.approvedAt && (
              <Descriptions.Item label="Approved At">
                {new Date(selectedTranslation.approvedAt).toLocaleString()}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ApprovalManagement;
