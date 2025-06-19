import React from 'react';
import { Card, List, Button, Empty, Typography, Space, Tooltip } from 'antd';
import { UserOutlined, DeleteOutlined, ClearOutlined } from '@ant-design/icons';
import { useUsernameHistory } from '../../hooks/useUsernameHistory';

const { Title, Text } = Typography;

export const UsernameHistoryManager: React.FC = () => {
  const { usernameHistory, removeUsername, clearHistory } = useUsernameHistory();

  if (usernameHistory.length === 0) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No saved usernames yet"
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <UserOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Saved Usernames ({usernameHistory.length})
          </Title>
        </Space>
      }
      extra={
        <Tooltip title="Clear all saved usernames">
          <Button
            type="text"
            danger
            icon={<ClearOutlined />}
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all saved usernames?')) {
                clearHistory();
              }
            }}
          >
            Clear All
          </Button>
        </Tooltip>
      }
    >
      <List
        dataSource={usernameHistory}
        renderItem={(username, index) => (
          <List.Item
            actions={[
              <Tooltip title="Remove this username">
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => removeUsername(username)}
                />
              </Tooltip>
            ]}
          >
            <List.Item.Meta
              avatar={<UserOutlined style={{ color: '#1890ff' }} />}
              title={username}
              description={`Position #${index + 1} in history`}
            />
          </List.Item>
        )}
      />
      
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          💡 These usernames appear as suggestions when you type in login forms
        </Text>
      </div>
    </Card>
  );
};
