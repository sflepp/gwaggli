import asyncio
import websockets
import whisper
import json

model_size = "large"

# https://github.com/openai/whisper/discussions/380
print("Loading whisper model with size '" + model_size + "'...")
model = whisper.load_model(model_size)
async def transcribe(websocket):
    try:
        async for message in websocket:
            event = json.loads(message)
            path = "./data/" + event["fileName"]
            print("Transcribing... path=" + path)
            result = model.transcribe(path, fp16=False)
            result["trackId"] = event["trackId"]
            print("Transcription complete. text=" + result["text"])
            json_result = json.dumps(result)
            await websocket.send(json_result)
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected.")


async def main():
    async with websockets.serve(transcribe, "localhost", 8765):
        await asyncio.Future()  # run forever


print("Starting gwaggli-whisper on ws://localhost:8765...")
asyncio.run(main())
