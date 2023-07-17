import { WaveData } from '../../domain/data/wave-data';
import { AWSError } from 'aws-sdk';
import { SynthesizeSpeechOutput } from 'aws-sdk/clients/polly';

import AWS from 'aws-sdk';

AWS.config.loadFromPath('.aws/config.json');

const Polly = new AWS.Polly({
    signatureVersion: 'v4',
    region: 'eu-central-1',
});

export const textToSpeechAwsPolly = async (text: string, voiceId: string): Promise<WaveData> => {
    const sampleRate = 16000;

    return new Promise((resolve, reject) => {
        Polly.synthesizeSpeech(
            {
                Text: text,
                OutputFormat: 'pcm',
                VoiceId: voiceId,
                Engine: 'neural',
                SampleRate: sampleRate.toString(),
            },
            (err: AWSError, data: SynthesizeSpeechOutput) => {
                if (err) {
                    console.log(err);
                    reject(err);
                    return;
                }

                if (data.AudioStream instanceof Buffer) {
                    const waveData = new WaveData(data.AudioStream, {
                        sampleRate: sampleRate,
                        channels: 1,
                        bitsPerSample: 16,
                        mono: true,
                    });

                    resolve(waveData);
                }
            }
        );
    });
};
