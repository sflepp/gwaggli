import React from 'react';
import { Layout, Menu, theme } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;

const AppLayout: React.FC = () => {
    const {
        token: { colorBgContainer },
    } = theme.useToken();

    const navigate = useNavigate();

    return (
        <Layout>
            <Header className="header">
                <Menu
                    theme="dark"
                    mode="horizontal"
                    defaultSelectedKeys={['Home']}
                    items={[
                        {
                            key: 'Home',
                            label: 'Home',
                            onClick: () => navigate('/'),
                        },
                        {
                            key: 'Chat',
                            label: 'Chat',
                            onClick: () => navigate('/chat'),
                        },
                        {
                            key: 'Copilot',
                            label: 'Copilot',
                            onClick: () => navigate('/copilot'),
                        },
                        {
                            key: 'Trace',
                            label: 'Trace',
                            onClick: () => navigate('/trace'),
                        },
                        {
                            key: 'Debugger',
                            label: 'Debugger',
                            onClick: () => navigate('/debugger'),
                        },
                        {
                            key: 'Data-Loader',
                            label: 'Data-Loader',
                            onClick: () => navigate('/data-loader'),
                        },
                    ]}
                />
            </Header>
            <Layout>
                <Layout style={{ padding: '0 24px 24px' }}>
                    <Content
                        style={{
                            position: 'relative',
                            padding: 24,
                            margin: 0,
                            minHeight: 280,
                            background: colorBgContainer,
                        }}
                    >
                        <Outlet></Outlet>
                    </Content>
                </Layout>
            </Layout>
        </Layout>
    );
};

export default AppLayout;
