
import asyncio
import websockets

async def hello(websocket, path):
    msg_in = await websocket.recv()
    print(f"< recieved: {msg_in}")

    msg_to_list = lambda msg: [float(v) for v in msg.strip('[]').split(',')]
    msg_sqr = [v**2 for v in msg_to_list(msg_in)]

    msg_out = f"Result: {msg_sqr}!"

    await websocket.send(msg_out)
    print(f"> {msg_out}")

start_server = websockets.serve(hello, "127.0.0.1", 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()