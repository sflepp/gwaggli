// Load the SDK
import {AWSError} from "aws-sdk";
import {SynthesizeSpeechOutput} from "aws-sdk/clients/polly";
import {md5} from "./util/md5";

const AWS = require('aws-sdk')
const Fs = require('fs')

AWS.config.loadFromPath('.aws/config.json')

const Polly = new AWS.Polly({
    signatureVersion: 'v4',
    region: 'eu-central-1'
})

export const textToSpeech = async (text: string, voiceId: string): Promise<string> => {
    const fileName = `generated/voices/${voiceId}_${md5(text)}.mp3`

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

