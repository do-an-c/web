import React, { useState } from 'react';
import { Button, Popover, Space, message } from 'antd';
import { SoundOutlined, PlayCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { ttsApi } from '../services/api';

interface TTSPreviewProps {
  text: string;
  languageCode?: string;
  buttonText?: string;
  buttonType?: 'link' | 'text' | 'default' | 'primary' | 'dashed';
}

const TTSPreview: React.FC<TTSPreviewProps> = ({ 
  text, 
  languageCode = 'vi',
  buttonText = 'Nghe thử',
  buttonType = 'link'
}) => {
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);

  const synthesizeMutation = useMutation({
    mutationFn: () => ttsApi.synthesize(text, languageCode),
    onSuccess: (response) => {
      const url = response.data.audioUrl;
      setAudioUrl(url);
      playAudio(url);
    },
    onError: () => {
      message.error('Không thể tạo audio');
    },
  });

  const playAudio = (url: string) => {
    const audio = new Audio(url);
    setIsPlaying(true);
    
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      setIsPlaying(false);
      message.error('Không thể phát audio');
    };
    
    audio.play().catch(() => {
      setIsPlaying(false);
      message.error('Không thể phát audio');
    });
  };

  const handlePreview = () => {
    if (!text || text.trim().length < 10) {
      message.warning('Văn bản quá ngắn để tạo audio');
      return;
    }

    if (audioUrl) {
      playAudio(audioUrl);
    } else {
      synthesizeMutation.mutate();
    }
  };

  const popoverContent = audioUrl ? (
    <Space vertical style={{ width: '250px' }}>
      <audio controls src={audioUrl} style={{ width: '100%' }}>
        Trình duyệt không hỗ trợ
      </audio>
      <Button size="small" href={audioUrl} target="_blank" block>
        Tải xuống
      </Button>
    </Space>
  ) : null;

  return (
    <Popover content={popoverContent} title="Audio Preview" trigger="hover">
      <Button
        type={buttonType}
        icon={synthesizeMutation.isPending ? <LoadingOutlined /> : isPlaying ? <PlayCircleOutlined /> : <SoundOutlined />}
        onClick={handlePreview}
        loading={synthesizeMutation.isPending}
        disabled={!text || text.trim().length < 10}
      >
        {buttonText}
      </Button>
    </Popover>
  );
};

export default TTSPreview;
