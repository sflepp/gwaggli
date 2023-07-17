import { ChatCompletionRequestMessage } from 'openai/api';
import { fitIntoTokenLimit } from './open-ai-client';

it('should fit within token limit', async () => {
    const messages: ChatCompletionRequestMessage[] = [
        {
            role: 'user',
            content: 'Test message 1',
        },
        {
            role: 'system',
            content: 'Test message 2',
        },
        {
            role: 'user',
            content: 'Test message 3',
        },
    ];

    const result = await fitIntoTokenLimit('gpt-4', 8000, messages);

    expect(result).toEqual(messages);
});

it('should cut off some messages if they dont fit into the token limit', async () => {
    const messages: ChatCompletionRequestMessage[] = [
        {
            role: 'user',
            content: 'Test message 1',
        },
        {
            role: 'system',
            content: 'Test message 2',
        },
        {
            role: 'user',
            content: 'Test message 3',
        },
    ];

    const result = await fitIntoTokenLimit('gpt-4', 20, messages);

    expect(result.length).toEqual(2);
    expect(result[0]).toEqual(messages[1]);
    expect(result[1]).toEqual(messages[2]);
});
