import { EventSystem, PipelineEventType } from "@gwaggli/events";
import { KnowledgeLocationAvailable, TextKnowledgeAvailable } from "@gwaggli/events/dist/events/pipeline-events";

import { generateEmbedding } from "../../integration/openai/open-ai-client";
import { EmbeddingsKnowledgeBase } from "../../storage/knowledge-base/embeddings-knowledge-base";



export const registerKnowledgeLoader = (eventSystem: EventSystem) => {

    const knowledgeBase = new EmbeddingsKnowledgeBase();

    eventSystem.on<KnowledgeLocationAvailable>(PipelineEventType.KnowledgeLocationAvailable, async (event) => {

    });




    eventSystem.on<TextKnowledgeAvailable>(PipelineEventType.TextKnowledgeAvailable, async (event) => {
        const embeddings = await generateEmbedding(event.text)

        knowledgeBase.add({
            source: event.source,
            text: event.text,
            embedding: embeddings.data[0].embedding
        });
    });
}
