import axios from "axios";

const fs = require("fs")


interface ElevenLabsConfig {
    apiKey: string;
}

const elevenLabsConfig = (JSON.parse(fs.readFileSync(".elevenlabs/config.json"))) as ElevenLabsConfig


const elevenLabsApi = axios.create({
    baseURL: "https://api.elevenlabs.io",
    headers: {
        "Content-Type": "application/json",
        "xi-api-key": elevenLabsConfig.apiKey,
        "Accept": "audio/wav"
    }
});


export const textToSpeechElevenLabs = async (text: string, voiceId: string): Promise<Buffer> => {
    const response = await elevenLabsApi.post(`/v1/text-to-speech/${voiceId}`, {
        "text": text,
        "model_id": "eleven_multilingual_v1",
        "voice_settings": {
            "stability": 0,
            "similarity_boost": 0,
            "style": 0.5,
            "use_speaker_boost": false
        },
    }, {
        responseType: 'arraybuffer'
    })

    return response.data
}
