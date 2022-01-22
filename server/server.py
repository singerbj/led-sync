#!/usr/bin/env python

import cv2
import socket
from flask import Flask, request, jsonify, json, send_from_directory
from flask_socketio import SocketIO
import threading
import time
import numpy as np

HTTP_PORT = 3000
WS_PORT = 1336
UDP_PORT = 1337
DIRECTORY = "build"
HOSTNAME = socket.gethostname()
LOCAL_IP = socket.gethostbyname(HOSTNAME)

WS_CONNECTIONS = set()

send_capture = False
vid = None
forced_color = [100, 100, 100]
capture_color = [0, 0, 0]

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
    global capture_color
    global send_capture

    if request.method == 'GET':
        return json.dumps(forced_color)
    elif request.method == 'PUT':
        if request.json == False:
            send_capture = True
            return json.dumps(forced_color)
        else:
            send_capture = False
            forced_color = request.json
            return json.dumps(forced_color)

# Websockets
@socketio.on('connect')
def handle_connect():
    print('connect')

@socketio.on('disconnect')
def handle_disconnect():
    print('disconnect')


def start_capture():
    print('starting capturing')

    global vid
    try:
        vid = cv2.VideoCapture(0)
    except:
        try:
            vid = cv2.VideoCapture(1)
        except:
            print("Error getting video capture.")

def stop_capture():
    print('stopping capturing')

    try:
        global vid
        vid.release()
        vid = None
    except:
        print("Error closing video capture.")


if __name__ == '__main__':
    threading.Thread(target=lambda: socketio.run(api, host=str(LOCAL_IP), port=HTTP_PORT)).start()
    while(True):
        if send_capture == False:
            if vid != None:
                stop_capture()

            cv2.destroyAllWindows()
            socketio.emit('forced_color', json.dumps(forced_color))
            time.sleep(0.25)
        else:
            if vid == None:
                start_capture()

            ret, frame = vid.read()

            data = np.reshape(frame, (-1, 3))
            data = np.float32(data)

            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
            flags = cv2.KMEANS_RANDOM_CENTERS
            compactness, labels, centers = cv2.kmeans(data, 1, None, criteria, 10, flags)

            color_array = [int(centers[0].astype(np.int32)[2]), int(centers[0].astype(np.int32)[1]), int(centers[0].astype(np.int32)[0])]
            socketio.emit('forced_color', json.dumps(color_array))


