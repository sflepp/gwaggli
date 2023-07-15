import {KnowledgeBaseEntry} from "./entity/knowledge-base-entry";
import {IndexFlatL2} from "faiss-node";

export interface KnowledgeBaseSearchResult {
    entry: KnowledgeBaseEntry;
    distance: number;
}

export class EmbeddingsKnowledgeBase {

    private knowledgeBaseEntries: KnowledgeBaseEntry[] = [];
    private vectorDb: IndexFlatL2 = new IndexFlatL2(1536);

    public add(entry: KnowledgeBaseEntry) {
        this.vectorDb.add(entry.embedding);
        this.knowledgeBaseEntries.push(entry);
    }

    public size(): number {
        return this.knowledgeBaseEntries.length;
    }

    public search(query: number[], maxCount: number, maxDistance: number = 1.0): KnowledgeBaseSearchResult[] {
        const count = Math.min(maxCount, this.size());
        if (count === 0) return [];

        const searchResult = this.vectorDb.search(query, count);

        return searchResult.labels
            .map((label, index) => {
                return {
                    entry: this.knowledgeBaseEntries[label],
                    distance: searchResult.distances[index]
                }
            })
            .filter((result) => result.distance <= maxDistance);
    }
}
