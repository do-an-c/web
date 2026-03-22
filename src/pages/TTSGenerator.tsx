import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, message, Space, Typography, Spin } from 'antd';
import { SoundOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { ttsApi } from '../services/api';

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

const TTSGenerator: React.FC = () => {
  const [form] = Form.useForm();
  const [audioUrl, setAudioUrl] = useState<string>('');

  const synthesizeMutation = useMutation({
    mutationFn: ({ text, languageCode }: { text: string; languageCode: string }) =>
      ttsApi.synthesize(text, languageCode),
    onSuccess: (response) => {
      const url = response.data.audioUrl;
      setAudioUrl(url);
      message.success('Tạo audio thành công!');
    },
    onError: () => {
      message.error('Tạo audio thất bại');
    },
  });

  const handleGenerate = (values: any) => {
    synthesizeMutation.mutate({
      text: values.text,
      languageCode: values.languageCode,
    });
  };

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch((err) => {
        message.error('Không thể phát audio');
        console.error(err);
      });
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <Title level={2}>
        <SoundOutlined /> Text-to-Speech Generator
      </Title>
      <Paragraph style={{ color: '#666', marginBottom: '24px' }}>
        Công cụ tạo audio thuyết minh tự động từ văn bản. Hỗ trợ nhiều ngôn ngữ với giọng đọc tự nhiên.
      </Paragraph>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerate}
          initialValues={{
            languageCode: 'vi',
          }}
        >
          <Form.Item
            name="languageCode"
            label="Ngôn ngữ"
            rules={[{ required: true, message: 'Vui lòng chọn ngôn ngữ' }]}
          >
            <Select size="large">
              <Select.Option value="vi">🇻🇳 Tiếng Việt (vi-VN-HoaiMyNeural)</Select.Option>
              <Select.Option value="en">🇺🇸 English (en-US-JennyNeural)</Select.Option>
              <Select.Option value="ko">🇰🇷 한국어 (ko-KR-SunHiNeural)</Select.Option>
              <Select.Option value="ja">🇯🇵 日本語 (ja-JP-NanamiNeural)</Select.Option>
              <Select.Option value="zh">🇨🇳 中文 (zh-CN-XiaoxiaoNeural)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="text"
            label="Nội dung cần đọc"
            rules={[
              { required: true, message: 'Vui lòng nhập nội dung' },
              { min: 10, message: 'Nội dung phải có ít nhất 10 ký tự' },
              { max: 5000, message: 'Nội dung không được quá 5000 ký tự' },
            ]}
          >
            <TextArea
              rows={8}
              placeholder="Nhập văn bản cần chuyển thành giọng nói..."
              showCount
              maxLength={5000}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              icon={<SoundOutlined />}
              loading={synthesizeMutation.isPending}
              block
            >
              Tạo Audio
            </Button>
          </Form.Item>
        </Form>

        {synthesizeMutation.isPending && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <p style={{ marginTop: '16px', color: '#666' }}>
              Đang tạo audio, vui lòng đợi...
            </p>
          </div>
        )}

        {audioUrl && !synthesizeMutation.isPending && (
          <Card
            style={{ marginTop: '24px', background: '#f0f7ff', border: '1px solid #91d5ff' }}
            title="✅ Kết quả"
          >
            <Space orientation="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <strong>URL Audio:</strong>
                <div style={{ 
                  padding: '8px', 
                  background: 'white', 
                  borderRadius: '4px', 
                  marginTop: '8px',
                  wordBreak: 'break-all',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  {audioUrl}
                </div>
              </div>

              <audio controls src={audioUrl} style={{ width: '100%' }}>
                Trình duyệt không hỗ trợ phát audio
              </audio>

              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={playAudio}
                size="large"
                block
              >
                Phát Audio
              </Button>

              <Button
                href={audioUrl}
                target="_blank"
                download
                block
              >
                Tải xuống
              </Button>
            </Space>
          </Card>
        )}
      </Card>

      <Card style={{ marginTop: '24px' }} title="💡 Hướng dẫn sử dụng">
        <ul style={{ paddingLeft: '20px', color: '#666' }}>
          <li>Chọn ngôn ngữ phù hợp với nội dung bạn muốn đọc</li>
          <li>Nhập văn bản cần chuyển thành giọng nói (10-5000 ký tự)</li>
          <li>Nhấn "Tạo Audio" và đợi hệ thống xử lý</li>
          <li>Audio sẽ được lưu tự động vào thư mục wwwroot/audio trên server</li>
          <li>Bạn có thể phát audio trực tiếp hoặc tải xuống</li>
        </ul>

        <Paragraph style={{ marginTop: '16px', marginBottom: 0 }}>
          <strong>Giọng đọc:</strong> Sử dụng Microsoft Edge TTS với giọng Neural chất lượng cao
        </Paragraph>
      </Card>
    </div>
  );
};

export default TTSGenerator;
