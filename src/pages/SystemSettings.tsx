import React from 'react';
import { Card, Form, InputNumber, Button, Select, Slider, Switch, message, Divider, Space, Typography } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const SystemSettings: React.FC = () => {
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    console.log('Settings saved:', values);
    message.success('Đã lưu cấu hình hệ thống thành công. Hành vi trên Mobile App sẽ được cập nhật!');
  };

  const handleReset = () => {
    form.resetFields();
    message.info('Đã khôi phục cài đặt gốc');
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: 24, marginTop: 0 }}>Cấu hình hệ thống (System Settings)</Title>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          geofenceRadius: 20,
          maxRadiusLimit: 100,
          antiSpamCooldown: 10,
          defaultLanguage: 'vi',
          audioCacheLimit: 50,
          enableDebugMode: false
        }}
      >
        <Card title="📍 Cấu hình Khu vực Phát hiện (Geofence Engine)" bordered={false} style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item 
              name="geofenceRadius" 
              label="Bán kính kích hoạt mặc định (m)"
              rules={[{ required: true, message: 'Vui lòng nhập bán kính' }]}
              tooltip="Khoảng cách người dùng phải đứng gần quán ăn để kích hoạt âm thanh"
            >
              <InputNumber min={5} max={50} addonAfter="mét" />
            </Form.Item>
            
            <Form.Item 
              name="maxRadiusLimit" 
              label="Bán kính mở rộng tối đa (m)"
              tooltip="Độ lớn tối đa cho phép của vùng Geofence ngay cả đối với quán có ưu tiên cao nhất"
            >
              <InputNumber min={10} max={200} addonAfter="mét" />
            </Form.Item>
          </Space>
        </Card>

        <Card title="⏳ Cơ chế chống Spam (Anti-spam Mechanics)" bordered={false} style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <Form.Item 
            name="antiSpamCooldown" 
            label="Thời gian chờ phát lại (Cooldown Timer)"
            tooltip="Khoảng thời gian tối thiểu kể từ lúc phát xong một điểm, cấm phát lại điểm đó nếu người dùng không di chuyển ra ngoài khu vực"
            rules={[{ required: true, message: 'Vui lòng nhập thời gian chờ' }]}
          >
            <InputNumber min={1} max={60} addonAfter="phút" style={{ width: 150 }} />
          </Form.Item>
          <Text type="secondary">Ví dụ: Mức 10 phút phù hợp cho việc đi dạo thong thả mà không bị quấy rầy.</Text>
        </Card>

        <Card title="🔊 Ngôn ngữ & Bộ nhớ đệm (Audio & TTS)" bordered={false} style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: 48 }}>
            <div style={{ flex: 1 }}>
              <Form.Item 
                name="defaultLanguage" 
                label="Ngôn ngữ thuyết minh TTS ưu tiên"
              >
                <Select>
                  <Select.Option value="vi">🇻🇳 Tiếng Việt</Select.Option>
                  <Select.Option value="en">🇬🇧 Tiếng Anh</Select.Option>
                  <Select.Option value="kr">🇰🇷 Tiếng Hàn</Select.Option>
                  <Select.Option value="jp">🇯🇵 Tiếng Nhật</Select.Option>
                </Select>
              </Form.Item>
              
              <Form.Item 
                name="enableDebugMode" 
                label="Bật chế độ thử nghiệm (Debug Audio)"
                valuePropName="checked"
                style={{ marginTop: 24 }}
              >
                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
              </Form.Item>
            </div>
            
            <div style={{ flex: 1 }}>
              <Form.Item 
                name="audioCacheLimit" 
                label="Giới hạn dung lượng bộ đệm (Offline Cache)"
                tooltip="Mức lưu trữ tối đa cho các file Audio trên máy người dùng để tiết kiệm bộ nhớ"
              >
                <Slider
                  min={10}
                  max={200}
                  marks={{
                    10: '10MB',
                    50: '50MB',
                    100: '100MB',
                    200: '200MB',
                  }}
                />
              </Form.Item>
            </div>
          </div>
        </Card>

        <Divider />
        
        <Form.Item style={{ textAlign: 'right' }}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Khôi phục mặc định
            </Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large">
              Lưu thay đổi hệ thống
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default SystemSettings;
