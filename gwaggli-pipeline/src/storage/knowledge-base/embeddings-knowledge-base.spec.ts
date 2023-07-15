import {EmbeddingsKnowledgeBase} from "./embeddings-knowledge-base";
import fs from "fs";
let sut: EmbeddingsKnowledgeBase;
beforeEach(() => {
    sut = new EmbeddingsKnowledgeBase();
});

interface EmbeddingTestData {
    text: string;
    embedding: number[];
}

it('it should add entries', async () => {

    const testData = JSON.parse(fs.readFileSync("./__test-data__/embeddings/embeddings-set-1.json", 'utf8')) as EmbeddingTestData[];

    testData.forEach((data: EmbeddingTestData) => {
        sut.add({
            source: "test-data",
            text: data.text,
            embedding: data.embedding
        })
    });

    expect(sut.size()).toBe(testData.length);
});

it('it should search entries', async () => {
    const testData = JSON.parse(fs.readFileSync("./__test-data__/embeddings/embeddings-set-1.json", 'utf8')) as EmbeddingTestData[];

    testData.forEach((data: EmbeddingTestData) => {
        sut.add({
            source: "test-data",
            text: data.text,
            embedding: data.embedding
        })
    });

    const result = sut.search(testData[0].embedding, 2);

    expect(result.length).toBe(2);
    expect(result[0].text).toBe(testData[0].text);
});
