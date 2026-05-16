import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Result, Tag, Typography, Space, Divider, Descriptions, Alert, Spin } from 'antd';
import { QrcodeOutlined, CheckCircleOutlined, CloseCircleOutlined, ThunderboltOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import * as signalR from '@microsoft/signalr';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Use the same base URL as api.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://vinhkhanh-api-2026-dwffczfxgkcdbvf0.eastasia-01.azurewebsites.net/api';

interface ValidateResult {
  result: number;
  strength: string;
  message: string;
  downloadUrl: string | null;
}

interface ScanInfoResult {
  app: string;
  valid: boolean;
  result: number;
  strength: string;
  action: string;
  downloadUrl: string | null;
}

const QrScanTest: React.FC = () => {
  const [qrContent, setQrContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [validateResult, setValidateResult] = useState<ValidateResult | null>(null);
  const [scanInfo, setScanInfo] = useState<ScanInfoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Determine the base URL for SignalR (removing /api if present)
    const hubUrl = API_BASE.replace('/api', '');
    
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${hubUrl}/hubs/tracking`)
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        console.log('Connected to TrackingHub for QR Scans');
        return connection.invoke('JoinAdminRoom');
      })
      .then(() => {
        console.log('Joined admins room successfully');
      })
      .catch(err => console.error('SignalR Connection Error: ', err));

    connection.on("ReceiveScanResult", (data: any) => {
      console.log('Received real-time scan result:', data);
      
      // Auto-update the validate result
      setValidateResult({
        result: data.result,
        strength: data.strength,
        message: data.message,
        downloadUrl: data.downloadUrl
      });
      
      // Auto-update scan info (short format)
      setScanInfo({
        app: "VinhKhanhFoodStreet",
        valid: data.result === 0,
        result: data.result,
        strength: data.strength,
        action: data.result === 0 ? "TAI_APP" : "KHONG_HOP_LE",
        downloadUrl: data.downloadUrl
      });
      
      // Update UI with real-time feedback
      const timestamp = new Date(data.timestamp).toLocaleTimeString();
      setQrContent(`[AUTO-TRIGGER] Thiết bị vừa tải App lúc ${timestamp}`);
      setError(null);
    });

    return () => {
      connection.stop();
    };
  }, []);

  const handleScan = async () => {
    if (!qrContent.trim()) {
      setError('Vui lòng nhập nội dung QR code');
      return;
    }

    setLoading(true);
    setError(null);
    setValidateResult(null);
    setScanInfo(null);

    try {
      // B1: Validate QR
      const validateRes = await axios.post(`${API_BASE}/download/validate-qr`, {
        content: qrContent.trim()
      });
      const vResult: ValidateResult = validateRes.data;
      setValidateResult(vResult);

      // B2: Get short info
      if (vResult.result === 0) {
        const encoded = encodeURIComponent(qrContent.trim());
        const scanRes = await axios.get(`${API_BASE}/download/scan-info?qrContent=${encoded}`);
        setScanInfo(scanRes.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQrContent('');
    setValidateResult(null);
    setScanInfo(null);
    setError(null);
  };

  const handleTestValid = () => {
    setQrContent(`${API_BASE}/download/app`);
  };

  const handleTestInvalid = () => {
    setQrContent('https://google.com/random-page');
  };

  return (
    <div>
      <Title level={2}>
        <QrcodeOutlined /> Kiểm Tra QR Code (Mạnh/Yếu)
      </Title>
      <Paragraph type="secondary">
        Công cụ kiểm tra nội dung QR code theo luồng B1 (kiểm tra 0/1) → B2 (hiển thị kiểu short).
        Tương ứng Activity Diagram 12.17.
      </Paragraph>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left column - Input */}
        <Card
          title="📷 B1: Quét & Kiểm Tra QR"
          extra={
            <Space>
              <Button size="small" onClick={handleTestValid} type="dashed">
                Test hợp lệ
              </Button>
              <Button size="small" onClick={handleTestInvalid} type="dashed" danger>
                Test không hợp lệ
              </Button>
            </Space>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Text strong>Nội dung QR Code:</Text>
              <TextArea
                rows={3}
                value={qrContent}
                onChange={(e) => setQrContent(e.target.value)}
                placeholder="Dán URL từ QR code vào đây..."
                style={{ marginTop: 8, fontFamily: 'monospace' }}
              />
            </div>

            <Space>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleScan}
                loading={loading}
                size="large"
                block
              >
                Kiểm Tra (Validate)
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
                size="large"
              >
                Reset
              </Button>
            </Space>

            {error && (
              <Alert type="error" message={error} showIcon closable />
            )}
          </Space>
        </Card>

        {/* Right column - Result */}
        <Card title="📊 Kết Quả Kiểm Tra">
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" tip="Đang kiểm tra..." />
            </div>
          )}

          {!loading && !validateResult && !error && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              <QrcodeOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <br />
              <Text type="secondary">Nhập nội dung QR và nhấn "Kiểm Tra"</Text>
            </div>
          )}

          {validateResult && (
            <>
              {/* Strength Result */}
              <Result
                icon={validateResult.result === 0
                  ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                }
                title={
                  <Space>
                    {validateResult.result === 0 ? (
                      <Tag color="success" style={{ fontSize: 16, padding: '4px 16px' }}>
                        🟢 MẠNH — Hợp lệ (0)
                      </Tag>
                    ) : (
                      <Tag color="error" style={{ fontSize: 16, padding: '4px 16px' }}>
                        🔴 YẾU — Không hợp lệ (1)
                      </Tag>
                    )}
                  </Space>
                }
                subTitle={validateResult.message}
                style={{ padding: '16px 0' }}
              />

              <Divider />

              {/* Validation Details */}
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Result Code">
                  <Tag color={validateResult.result === 0 ? 'green' : 'red'}>
                    {validateResult.result}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Strength">
                  <Text strong style={{ color: validateResult.strength === 'manh' ? '#52c41a' : '#ff4d4f' }}>
                    {validateResult.strength.toUpperCase()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Download URL">
                  {validateResult.downloadUrl ? (
                    <a href={validateResult.downloadUrl} target="_blank" rel="noopener noreferrer">
                      {validateResult.downloadUrl}
                    </a>
                  ) : (
                    <Text type="secondary">N/A</Text>
                  )}
                </Descriptions.Item>
              </Descriptions>

              {/* B2: Short format */}
              {scanInfo && (
                <>
                  <Divider />
                  <Card
                    size="small"
                    title="📋 B2: Kết quả kiểu Short"
                    style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}
                  >
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="App">{scanInfo.app}</Descriptions.Item>
                      <Descriptions.Item label="Valid">
                        <Tag color={scanInfo.valid ? 'green' : 'red'}>
                          {scanInfo.valid ? 'TRUE' : 'FALSE'}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Result">{scanInfo.result}</Descriptions.Item>
                      <Descriptions.Item label="Strength">{scanInfo.strength}</Descriptions.Item>
                      <Descriptions.Item label="Action">
                        <Tag color={scanInfo.action === 'TAI_APP' ? 'blue' : 'default'}>
                          {scanInfo.action}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Download URL">
                        {scanInfo.downloadUrl ? (
                          <a href={scanInfo.downloadUrl} target="_blank" rel="noopener noreferrer">
                            📲 Tải APK
                          </a>
                        ) : 'N/A'}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </>
              )}

              {/* Download button for valid QR */}
              {validateResult.result === 0 && validateResult.downloadUrl && (
                <>
                  <Divider />
                  <Button
                    type="primary"
                    size="large"
                    block
                    href={validateResult.downloadUrl}
                    target="_blank"
                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  >
                    📲 Tải APK / Mở Link
                  </Button>
                </>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Flow explanation */}
      <Card style={{ marginTop: 24 }} title="📖 Luồng xử lý (Activity Diagram 12.17)">
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Tag style={{ padding: '8px 16px', fontSize: 14 }}>
            B1: Quét QR
          </Tag>
          <Text style={{ lineHeight: '36px' }}>→</Text>
          <Tag color="blue" style={{ padding: '8px 16px', fontSize: 14 }}>
            Kiểm tra (0,1)
          </Tag>
          <Text style={{ lineHeight: '36px' }}>→</Text>
          <Tag color="green" style={{ padding: '8px 16px', fontSize: 14 }}>
            0 = Mạnh ✅
          </Tag>
          <Text style={{ lineHeight: '36px' }}>/</Text>
          <Tag color="red" style={{ padding: '8px 16px', fontSize: 14 }}>
            1 = Yếu ❌
          </Tag>
          <Text style={{ lineHeight: '36px' }}>→</Text>
          <Tag color="purple" style={{ padding: '8px 16px', fontSize: 14 }}>
            B2: Kiểu Short
          </Tag>
        </div>
      </Card>
    </div>
  );
};

export default QrScanTest;
