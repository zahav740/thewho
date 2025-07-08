/**
 * @file: ExcelImportPage.tsx
 * @description: Страница управления Excel импортом
 * @created: 2025-07-02
 */
import React from 'react';
import { Layout, Breadcrumb } from 'antd';
import { HomeOutlined, FileExcelOutlined } from '@ant-design/icons';
import ExcelImportManager from '../../components/ExcelImportManager';

const { Content } = Layout;

const ExcelImportPage: React.FC = () => {
  return (
    <Layout className="layout">
      <Content style={{ padding: '0 50px' }}>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item href="/">
            <HomeOutlined />
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <FileExcelOutlined />
            <span>Excel Импорт</span>
          </Breadcrumb.Item>
        </Breadcrumb>
        <div className="site-layout-content">
          <ExcelImportManager />
        </div>
      </Content>
    </Layout>
  );
};

export default ExcelImportPage;
