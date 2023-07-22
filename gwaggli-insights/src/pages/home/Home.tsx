import React from 'react';
import { Typography } from 'antd';
import { Col, Row } from 'antd';

const { Title } = Typography;
const App: React.FC = () => {

    return <>
        <Title>Gwaggli</Title>
        <Row>
            <Col span={6}><img style={{ width: 'calc(100% - 20px)', maxWidth: '400px' }} src={'/gwaggli.jpg'} /></Col>
            <Col span={12}>
                <div style={{ fontSize: '22px', textAlign: 'justify', hyphens: 'auto' }}>
                    <p style={{ marginTop: '0'}}>Grüezi! Meet me – I am Gwaggli, the quirky wooden mascot carved straight out of Swiss folklore
                        and brought to life in this very application. Despite my name&apos;s connotation in Swiss German
                        (hint: it means a bit of a bumbling goof), I&apos;m no ordinary wooden figure. I&apos;m here as
                        your AI-driven assistant, ready to help you navigate through your tasks using the sheer power of
                        your voice.</p>

                    <p>Now, don’t get me wrong; my wooden nature might make me a tad bit clunky at times. But isn&apos;t
                        that the fun of it? Each stumble, every unexpected moment, adds a layer of adventure to our
                        journey. I might even toss in a Swiss joke or two to brighten up your day!</p>

                    <p>So, lean back, share a laugh with me, and let your voice guide the way. Whether you&apos;re
                        seeking answers, setting reminders, or just in need of a virtual friend to chat with, I’m here.
                        With a rich blend of Swiss charm and AI sophistication, together, we&apos;re about to make this
                        experience both delightful and memorable.</p>

                    <p>Let the Gwaggli magic begin!</p>
                </div>
            </Col>
        </Row>
    </>;
};

export default App;
