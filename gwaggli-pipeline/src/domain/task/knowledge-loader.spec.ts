import { EventSystem, PipelineEventType } from '@gwaggli/events';
import { registerKnowledgeLoader } from './knowledge-loader';
import { EmbeddingResult } from '../../integration/openai/open-ai-client';
import { KnowledgeEmbeddingAvailable } from '@gwaggli/events/dist/events/pipeline-events';

jest.mock('../../integration/openai/open-ai-client', () => ({
    generateEmbedding: jest.fn(async (text: string): Promise<EmbeddingResult> => {
        return {
            text: text,
            embedding: Array(1536).fill(1.0),
        };
    }),
}));

let eventSystem: EventSystem;

beforeEach(() => {
    eventSystem = new EventSystem();

    registerKnowledgeLoader(eventSystem);
});

it('should create an embedding', async () => {
    eventSystem.dispatch({
        type: PipelineEventType.KnowledgeTextAvailable,
        subsystem: 'pipeline',
        sid: '123',
        timestamp: Date.now(),
        source: 'test-data',
        text: 'This is an example text',
    });

    const event = await eventSystem.awaitType<KnowledgeEmbeddingAvailable>(
        PipelineEventType.KnowledgeEmbeddingAvailable
    );

    expect(event).toBeDefined();
    expect(event.type).toBe(PipelineEventType.KnowledgeEmbeddingAvailable);
    expect(event.subsystem).toBe('pipeline');
    expect(event.sid).toBe('123');
    expect(event.timestamp).toBeGreaterThan(0);
    expect(event.source).toBe('test-data');
    expect(event.text).toBe('This is an example text');
    expect(event.embedding).toBeDefined();
    expect(event.embedding.length).toBe(1536);
});
