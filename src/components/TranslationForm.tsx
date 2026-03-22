import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message, Space } from 'antd';
import { SoundOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { translationApi } from '../services/api';
import type { POI, POITranslation } from '../types';
import TTSPreview from './TTSPreview';

const { TextArea } = Input;

interface TranslationFormProps {
  poi: POI;
  translation: POITranslation | null;
  visible: boolean;
  onClose: () => void;
}

const TranslationForm: React.FC<TranslationFormProps> = ({
  poi,
  translation,
  visible,
  onClose,
}) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (visible) {
      if (translation) {
        form.setFieldsValue(translation);
      } else {
        form.resetFields();
      }
    }
  }, [visible, translation, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      if (translation) {
        // Update existing translation - don't send audioUrl or approvalStatus
        return translationApi.update(translation.id!, {
          name: values.name,
          content: values.content,
        });
      } else {
        // Create new translation
        return translationApi.create({
          poiId: poi.id,
          languageCode: values.languageCode,
          name: values.name,
          content: values.content,
        });
      }
    },
    onSuccess: () => {
      message.success(translation ? 'Cập nhật thành công' : 'Thêm translation thành công');
      queryClient.invalidateQueries({ queryKey: ['translations', poi.id] });
      queryClient.invalidateQueries({ queryKey: ['poi', poi.id] });
      queryClient.invalidateQueries({ queryKey: ['pois'] });
      onClose();
    },
    onError: (error: any) => {
      console.error('Translation save error:', error);
      console.error('Error response:', error?.response?.data);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.title || 'Lưu translation thất bại';
      message.error(errorMessage);
    },
  });

  const handleSubmit = async (values: any) => {
    await saveMutation.mutateAsync(values);
  };

  return (
    <Modal
      title={
        <Space>
          <SoundOutlined />
          <span>{translation ? 'Chỉnh sửa' : 'Thêm'} nội dung thuyết minh</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          languageCode: 'vi',
          approvalStatus: 'Pending',
        }}
      >
        <Form.Item
          name="languageCode"
          label="Ngôn ngữ"
          rules={[{ required: true, message: 'Vui lòng chọn ngôn ngữ' }]}
        >
          <Select size="large" disabled={!!translation}>
            <Select.Option value="vi">🇻🇳 Tiếng Việt</Select.Option>
            <Select.Option value="en">🇺🇸 English</Select.Option>
            <Select.Option value="ko">🇰🇷 한국어 (Korean)</Select.Option>
            <Select.Option value="ja">🇯🇵 日本語 (Japanese)</Select.Option>
            <Select.Option value="zh">🇨🇳 中文 (Chinese)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="name"
          label="Tên POI (bản dịch)"
          rules={[
            { required: true, message: 'Vui lòng nhập tên' },
            { min: 3, message: 'Tên phải có ít nhất 3 ký tự' },
          ]}
        >
          <Input placeholder="Tên điểm tham quan bằng ngôn ngữ đã chọn" />
        </Form.Item>

        <Form.Item
          name="content"
          label="Nội dung thuyết minh"
          rules={[
            { required: true, message: 'Vui lòng nhập nội dung' },
            { min: 50, message: 'Nội dung phải có ít nhất 50 ký tự' },
            { max: 2000, message: 'Nội dung không được quá 2000 ký tự' },
          ]}
          extra="Viết nội dung giới thiệu sinh động, hấp dẫn. Độ dài đề xuất: 100-500 ký tự (30-60 giây khi đọc)"
        >
          <TextArea
            rows={8}
            placeholder="Nhập nội dung thuyết minh chi tiết về địa điểm này..."
            showCount
            maxLength={2000}
          />
        </Form.Item>

        <Form.Item shouldUpdate style={{ marginBottom: '16px' }}>
          {() => {
            const content = form.getFieldValue('content');
            const languageCode = form.getFieldValue('languageCode');
            return content && content.length >= 50 ? (
              <div style={{ textAlign: 'center', padding: '12px', background: '#f0f7ff', borderRadius: '4px' }}>
                <TTSPreview 
                  text={content} 
                  languageCode={languageCode}
                  buttonText="🔊 Nghe thử nội dung thuyết minh"
                  buttonType="primary"
                />
              </div>
            ) : null;
          }}
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={saveMutation.isPending}
              size="large"
            >
              {translation ? 'Cập nhật' : 'Thêm mới'}
            </Button>
            <Button onClick={onClose} size="large">
              Hủy
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <div style={{ marginTop: '16px', padding: '12px', background: '#fffbe6', borderRadius: '4px', border: '1px solid #ffe58f' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
          💡 <strong>Mẹo viết nội dung tốt:</strong>
        </p>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '12px', color: '#666' }}>
          <li>Bắt đầu với câu thu hút sự chú ý</li>
          <li>Giới thiệu lịch sử, đặc điểm nổi bật của địa điểm</li>
          <li>Đề cập món ăn đặc sản hoặc điểm nhấn</li>
          <li>Kết thúc bằng lời mời gọi trải nghiệm</li>
          <li>Sử dụng ngôn ngữ thân thiện, dễ hiểu</li>
        </ul>
      </div>
    </Modal>
  );
};

export default TranslationForm;
