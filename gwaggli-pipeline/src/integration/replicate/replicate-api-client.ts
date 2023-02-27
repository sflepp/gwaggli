import axios from "axios";

const fs = require("fs")

interface ReplicateConfig {
    apiKey: string;
}

const replicateConfig = (JSON.parse(fs.readFileSync(".replicate/config.json"))) as ReplicateConfig


const replicaApi = axios.create({
    baseURL: "https://api.replicate.com/v1",
    headers: {
        "Content-Type": "application/json",
        "Authorization": "Token " + replicateConfig.apiKey
    }
});


export interface ReplicaPredictionResponse<I, O> {
    id: string,
    version: string,
    created_at: string,
    started_at: string,
    completed_at: string,
    status: 'starting' | 'processing' | 'succeeded'| 'failed' | 'canceled',
    input?: I,
    output?: O,
    error?: any,
    logs?: string,
    metrics?: {
        prediction_time: number,
    }
}


export async function* predict<I, O>(version: string, input: I): AsyncGenerator<ReplicaPredictionResponse<I, O>> {
    const initialResponse = (await replicaApi.post("/predictions", {
        version: version,
        input: input
    })).data as ReplicaPredictionResponse<I, O>

    yield initialResponse;

    const maxTries = 100;
    const sleepTime = 100;
    let tries = 0;

    while (tries < maxTries) {
        const response = (await replicaApi.get(`/predictions/${initialResponse.id}`)).data as ReplicaPredictionResponse<I, O>
        yield response;

        if (response.status === 'succeeded') {
            return response;
        }

        if (response.status === 'failed') {
            throw new Error(`Prediction failed: ${response.error}`)
        }

        await new Promise((resolve) => setTimeout(resolve, sleepTime))
        tries++;
    }

    console.warn(`Prediction request ${initialResponse.id} timed out after ${maxTries * sleepTime}ms. Cancelling...`);
    await replicaApi.post(`/predictions/${initialResponse.id}/cancel`)
}
