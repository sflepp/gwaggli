import fs from "fs";
import {Configuration, OpenAIApi} from "openai";

const openAiConfig = JSON.parse(fs.readFileSync(".openai/config.json", "utf8"));

const configuration = new Configuration({
    apiKey: openAiConfig.apiKey,
})

const openAi = new OpenAIApi(configuration);

export default openAi;