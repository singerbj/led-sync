#!/usr/bin/env python

import asyncio
import concurrent.futures
import websockets
import socket
from flask import Flask, request, jsonify, json, send_from_directory
from flask_socketio import SocketIO
import threading
import time
import sys



HTTP_PORT = 3000
WS_PORT = 1336
UDP_PORT = 1337
DIRECTORY = "build"

HOSTNAME = socket.gethostname()
LOCAL_IP = socket.gethostbyname(HOSTNAME)

WS_CONNECTIONS = set()



forced_color = [100, 100, 100]



# # Websockets
# async def ws_connection_management(websocket):
#     global WS_CONNECTIONS, VALUE
#     try:
#         # Register user
#         WS_CONNECTIONS.add(websocket)
#     finally:
#         # Unregister user
#         WS_CONNECTIONS.remove(websocket)
#         # websockets.broadcast(WS_CONNECTIONS, users_event())

# def broadcast_color(websockets):
#     while(True):
#         websockets.broadcast(WS_CONNECTIONS, json.dumps(forcedColor))

# async def init_websockets():
#     async with websockets.serve(ws_connection_management, LOCAL_IP, WS_PORT):
#         print('WSS startd at ws://' + str(LOCAL_IP) + ':' + str(WS_PORT))
#         threading.Thread(target=lambda: broadcast_color(websockets)).start()
#     await asyncio.Future()  # run forever


# HTTP
api = Flask(__name__, static_url_path='', static_folder='build',)
socketio = SocketIO(api)

@api.route('/', defaults=dict(filename=None))
@api.route('/<path:filename>', methods=['GET'])
def index(filename):
    filename = filename or 'index.html'
    return send_from_directory('./build', filename)

@api.route('/color', methods=['GET', 'PUT'])
def get_color():
    global forced_color
    if request.method == 'GET':
        return json.dumps(forced_color)
    else:
        forced_color = request.json
        return jsonify(forced_color)

@socketio.on('connect')
def handle_connect():
    print('connect')

@socketio.on('disconnect')
def handle_disconnect():
    print('disconnect')

if __name__ == '__main__':
    # sys.stdout.flush()

    # socketio.run(api, host=str(LOCAL_IP), port=HTTP_PORT)
    threading.Thread(target=lambda: socketio.run(api, host=str(LOCAL_IP), port=HTTP_PORT)).start()

    while(True):
        print('sending')
        socketio.emit('forced_color', json.dumps(forced_color))
        time.sleep(0.25)

