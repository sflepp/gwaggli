import {predict, ReplicaPredictionResponse} from "./replicate-api-client";


interface WhisperTranscriptionRequest {
    // Audio file as URL (data urls also work)
    audio: string; // base64 encoded audio

    // Choose a Whisper model.
    model: 'tiny' | 'base' | 'small' | 'medium' | 'large-v1' | 'large-v2',

    // Choose the format for the transcription
    transcription: 'plain text' | 'srt' | 'vtt',

    // Translate the text to English when set to True
    translate: boolean,

    // language spoken in the audio, specify null to perform language detection
    language?: string,

    // temperature to use for sampling
    temperature: number,

    // optional patience value to use in beam decoding, as in
    // https://arxiv.org/abs/2204.05424, the default (1.0) is equivalent to
    // conventional beam search
    patience?: number,

    // comma-separated list of token ids to suppress during sampling; '-1'
    // will suppress most special characters except common punctuations
    suppress_tokens: string

    // optional text to provide as a prompt for the first window.
    initial_prompt?: string,

    // if True, provide the previous output of the model as a prompt for
    // the next window; disabling may make the text inconsistent across
    // windows, but the model becomes less prone to getting stuck in a
    // failure loop
    condition_on_previous_text: boolean,

    // temperature to increase when falling back when the decoding fails to
    // meet either of the thresholds below
    temperature_increment_on_fallback: number,

    // if the gzip compression ratio is higher than this value, treat the
    // decoding as failed
    compression_ratio_threshold: number,

    // if the average log probability is lower than this value, treat the
    // decoding as failed
    logprob_threshold: number,

    // if the probability of the <|nospeech|> token is higher than this
    // value AND the decoding has failed due to `logprob_threshold`,
    // consider the segment as silence
    no_speech_threshold: number,
}

interface WhisperTranscriptionResult {
    transcription: string;
    detected_language: string;
    segments: {
        id: string,
        start: number,
        end: number,
        seek: number,
        text: string,
        tokens: number[],
        avg_logprob: number,
        temperature: number,
        no_speech_prob: number,
        compression_ratio: number,
    }[]
}


export async function* transcribeUsingWhisper(audio: string): AsyncGenerator<ReplicaPredictionResponse<WhisperTranscriptionRequest, WhisperTranscriptionResult>> {
    yield * predict<WhisperTranscriptionRequest, WhisperTranscriptionResult>(
        "b70a8e9dc4aa40bf4309285fbaefe3ed3d3a313f1f32ea61826fc64cdb4917a5",
        {
            audio: `data:audio/wav;base64,${audio}`,
            model: 'large-v1',
            transcription: 'plain text',
            translate: false,
            temperature: 0.6,
            suppress_tokens: '-1',
            condition_on_previous_text: true,
            temperature_increment_on_fallback: 0.2,
            compression_ratio_threshold: 2.4,
            logprob_threshold: -1,
            no_speech_threshold: 0.6
        }
    )
}