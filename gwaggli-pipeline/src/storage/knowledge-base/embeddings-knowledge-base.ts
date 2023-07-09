import { KnowledgeBaseEntry } from "./entity/knowledge-base-entry";
import { IndexFlatL2 } from "faiss-node";

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

    public search(query: number[], count: number): KnowledgeBaseEntry[] {
        const searchResult = this.vectorDb.search(query, count);
        return searchResult.labels.map((index) => this.knowledgeBaseEntries[index])
    }
}
