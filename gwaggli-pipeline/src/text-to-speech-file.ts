import {AWSError} from "aws-sdk";
import {SynthesizeSpeechOutput} from "aws-sdk/clients/polly";
import crypto from "crypto";
import {WaveData} from "./domain/wave-data";

const AWS = require('aws-sdk')
const Fs = require('fs')

AWS.config.loadFromPath('.aws/config.json')

const Polly = new AWS.Polly({
    signatureVersion: 'v4',
    region: 'eu-central-1'
})

export const textToSpeechFile = async (text: string, voiceId: string): Promise<string> => {

    const hash = crypto
        .createHash('sha256')
        .update(text + voiceId)
        .digest('hex');


    const fileName = `generated/voices/${voiceId}_${new Date().getTime()}-${hash}.mp3`

    if (Fs.existsSync(fileName)) {
        console.log(`File ${fileName} already exists`)

        return fileName;
    }

    return new Promise((resolve, reject) => {
        Polly.synthesizeSpeech({
            Text: text,
            OutputFormat: 'mp3',
            VoiceId: voiceId,
            Engine: 'neural'
        }, (err: AWSError, data: SynthesizeSpeechOutput) => {
            if (err) {
                console.log(err)
                reject(err)
                return;
            }


            if (data.AudioStream instanceof Buffer) {
                Fs.writeFile(fileName, data.AudioStream, (err: any) => {
                    if (err) {
                        return console.log(err)
                    }
                    console.log("The file was saved!")
                    resolve(fileName)
                });
            }
        })
    })
}

export const textToSpeech = async (text: string, voiceId: string): Promise<WaveData> => {
    const sampleRate = 16000;

    return new Promise((resolve, reject) => {
        Polly.synthesizeSpeech({
            Text: text,
            OutputFormat: 'pcm',
            VoiceId: voiceId,
            Engine: 'neural',
            SampleRate: sampleRate.toString()
        }, (err: AWSError, data: SynthesizeSpeechOutput) => {
            if (err) {
                console.log(err)
                reject(err)
                return;
            }

            if (data.AudioStream instanceof Buffer) {

                const waveData = new WaveData(data.AudioStream, {
                    sampleRate: sampleRate,
                    channels: 1,
                    bitsPerSample: 16,
                    mono: true
                })

                resolve(waveData)
            }
        })
    })
}
