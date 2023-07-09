import { EmbeddingsKnowledgeBase } from "./embeddings-knowledge-base";
import { embeddingsDataSet1 } from "./test-data/embeddings";
describe('embeddings-knowledge-base', () => {

    let sut: EmbeddingsKnowledgeBase;


    beforeEach(() => {
        sut = new EmbeddingsKnowledgeBase();
    });

    it('it should add entries', async () => {
        embeddingsDataSet1.forEach((data) => {
            sut.add({
                source: "test-data",
                text: data.text,
                embedding: data.embedding
            })
        });

        expect(sut.size()).toBe(embeddingsDataSet1.length);
    });

    it('it should search entries', async () => {
        embeddingsDataSet1.forEach((data) => {
            sut.add({
                source: "test-data",
                text: data.text,
                embedding: data.embedding
            })
        });

        const result = sut.search(embeddingsDataSet1[0].embedding, 2);

        expect(result.length).toBe(2);
        expect(result[0].text).toBe(embeddingsDataSet1[0].text);
    });
});
