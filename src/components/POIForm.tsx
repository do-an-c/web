import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Form, Input, InputNumber, Button, message, Select, Space, Divider } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { poiApi } from '../services/api';
import type { POI, CreatePOI, UpdatePOI } from '../types';
import TTSPreview from './TTSPreview';

// Fix Leaflet's default icon issue with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapClickHandler = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to fix map render issue inside Ant Design modal
const MapUpdater = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    // Wait for modal animation to semi-finish before invalidating size
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

interface POIFormProps {
  initialValues?: POI | null;
  onClose: () => void;
}

const { TextArea } = Input;

const POIForm: React.FC<POIFormProps> = ({ initialValues, onClose }) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<[number, number] | null>(
    initialValues ? [initialValues.latitude, initialValues.longitude] : [10.762622, 106.700172] // Default: Vĩnh Khánh, Q4, TPHCM
  );

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      setPosition([initialValues.latitude, initialValues.longitude]);
    } else {
      form.resetFields();
      setPosition([10.762622, 106.700172]);
    }
  }, [initialValues, form]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    form.setFieldsValue({
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6))
    });
  };

  const createMutation = useMutation({
    mutationFn: (data: CreatePOI) => poiApi.create(data),
    onSuccess: () => {
      message.success('Tạo POI thành công');
      queryClient.invalidateQueries({ queryKey: ['pois'] });
      onClose();
    },
    onError: (error: any) => {
      const serverMsg = error?.response?.data?.error;
      message.error(serverMsg || 'Tạo POI thất bại');
      console.error('Create POI error details:', error?.response?.data);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePOI }) => poiApi.update(id, data),
    onSuccess: () => {
      if (isAdmin) {
        message.success('Cập nhật POI thành công');
      } else {
        message.success('Đã gửi cập nhật! Vui lòng chờ Admin duyệt trước khi hiển thị.');
      }
      queryClient.invalidateQueries({ queryKey: ['pois'] });
      onClose();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.error || 'Cập nhật POI thất bại');
    },
  });

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (initialValues) {
        // Update existing POI
        const updateData: UpdatePOI = {
          name: values.name,
          description: values.description,
          latitude: values.latitude,
          longitude: values.longitude,
          radiusMeters: values.radiusMeters,
          priority: values.priority,
          imageUrl: values.imageUrl,
          status: values.status || initialValues.status || 'Pending',
        };
        await updateMutation.mutateAsync({ id: initialValues.id, data: updateData });
      } else {
        // Create new POI
        const createData: CreatePOI = {
          name: values.name,
          description: values.description,
          latitude: values.latitude,
          longitude: values.longitude,
          radiusMeters: values.radiusMeters || 50,
          priority: values.priority || 5,
          imageUrl: values.imageUrl,
          translations: values.translations || [],
        };
        console.log('Creating POI with data:', createData);
        await createMutation.mutateAsync(createData);
      }
    } catch (error) {
      console.error('POI submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={initialValues || {
        radiusMeters: 50,
        priority: 5,
        status: 'Active',
      }}
    >
      <Form.Item
        name="name"
        label="Tên POI"
        rules={[{ required: true, message: 'Vui lòng nhập tên POI' }]}
      >
        <Input placeholder="Nhập tên điểm thuyết minh" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Mô tả"
        rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
      >
        <TextArea rows={4} placeholder="Nhập mô tả chi tiết về điểm này" />
      </Form.Item>
      
      <Form.Item shouldUpdate style={{ marginBottom: '8px' }}>
        {() => {
          const description = form.getFieldValue('description');
          return description && description.length >= 10 ? (
            <div style={{ textAlign: 'right' }}>
              <TTSPreview text={description} languageCode="vi" buttonText="🔊 Nghe thử mô tả" />
            </div>
          ) : null;
        }}
      </Form.Item>

      <Form.Item
        name="imageUrl"
        label="URL Hình ảnh"
      >
        <Input placeholder="https://example.com/image.jpg" />
      </Form.Item>

      <Form.Item label="Chọn vị trí trên bản đồ">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
            <Button 
              icon={<PlusOutlined />} 
              onClick={() => {
                if (navigator.geolocation) {
                  message.loading({ content: 'Đang lấy vị trí...', key: 'location' });
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const { latitude, longitude } = pos.coords;
                      handleLocationSelect(Number(latitude.toFixed(6)), Number(longitude.toFixed(6)));
                      message.success({ content: 'Đã lấy được vị trí!', key: 'location' });
                    },
                    (err) => {
                      message.error({ content: 'Không thể lấy vị trí: ' + err.message, key: 'location' });
                    },
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                  );
                } else {
                  message.error('Trình duyệt không hỗ trợ định vị');
                }
              }}
            >
              Dùng vị trí hiện tại của tôi
            </Button>
        </div>
        <div style={{ height: '300px', width: '100%', marginBottom: '16px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #d9d9d9' }}>
          <MapContainer
            center={position || [10.762622, 106.700172]}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={position} />
            {position && <Marker position={position} />}
            <MapClickHandler onLocationSelect={handleLocationSelect} />
          </MapContainer>
        </div>
      </Form.Item>

      <Space style={{ width: '100%' }} size="large">
        <Form.Item
          name="latitude"
          label="Vĩ độ (Latitude)"
          rules={[{ required: true, message: 'Vui lòng nhập hoặc chọn vĩ độ' }]}
        >
          <InputNumber
            style={{ width: '200px' }}
            placeholder="10.7769"
            step={0.000001}
            precision={6}
            onChange={(val) => {
              if (val) {
                const lng = form.getFieldValue('longitude');
                if (lng) setPosition([Number(val), Number(lng)]);
              }
            }}
          />
        </Form.Item>

        <Form.Item
          name="longitude"
          label="Kinh độ (Longitude)"
          rules={[{ required: true, message: 'Vui lòng nhập hoặc chọn kinh độ' }]}
        >
          <InputNumber
            style={{ width: '200px' }}
            placeholder="106.7009"
            step={0.000001}
            precision={6}
            onChange={(val) => {
              if (val) {
                const lat = form.getFieldValue('latitude');
                if (lat) setPosition([Number(lat), Number(val)]);
              }
            }}
          />
        </Form.Item>
      </Space>

      <Space style={{ width: '100%' }} size="large">
        <Form.Item
          name="radiusMeters"
          label="Bán kính kích hoạt (mét)"
          rules={[{ required: true, message: 'Vui lòng nhập bán kính' }]}
        >
          <InputNumber
            style={{ width: '200px' }}
            min={10}
            max={500}
            placeholder="50"
          />
        </Form.Item>

        <Form.Item
          name="priority"
          label="Độ ưu tiên (1-10)"
          rules={[{ required: true, message: 'Vui lòng nhập độ ưu tiên' }]}
        >
          <InputNumber
            style={{ width: '200px' }}
            min={1}
            max={10}
            placeholder="5"
          />
        </Form.Item>
      </Space>

      {isAdmin && (
        <Form.Item
          name="status"
          label="Trạng thái"
          rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
        >
          <Select>
            <Select.Option value="Active">Active</Select.Option>
            <Select.Option value="Inactive">Inactive</Select.Option>
          </Select>
        </Form.Item>
      )}

      {!initialValues && (
        <>
          <Divider>Bản dịch (Tùy chọn)</Divider>
          <Form.List name="translations">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'languageCode']}
                      rules={[{ required: true, message: 'Chọn ngôn ngữ' }]}
                    >
                      <Select placeholder="Ngôn ngữ" style={{ width: 120 }}>
                        <Select.Option value="en">English</Select.Option>
                        <Select.Option value="vi">Tiếng Việt</Select.Option>
                        <Select.Option value="zh">中文</Select.Option>
                        <Select.Option value="ja">日本語</Select.Option>
                        <Select.Option value="ko">한국어</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'name']}
                      rules={[{ required: true, message: 'Nhập tên' }]}
                    >
                      <Input placeholder="Tên (bản dịch)" style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'content']}
                      rules={[{ required: true, message: 'Nhập nội dung' }]}
                    >
                      <Input placeholder="Nội dung (bản dịch)" style={{ width: 250 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Thêm bản dịch
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </>
      )}

      <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialValues ? 'Cập nhật' : 'Tạo mới'}
          </Button>
          <Button onClick={onClose}>Hủy</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default POIForm;
