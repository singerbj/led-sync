#!/usr/bin/env python

from turtle import color
import cv2
import socket
from flask import Flask, request, jsonify, json, send_from_directory
import threading
import time
import numpy as np
import os
import traceback
import sys
import signal
import subprocess
from datetime import datetime
# from flask_socketio import SocketIO, emit
# from flask_cors import CORS, cross_origin

CAPTURE_WIDTH = 480
CAPTURE_HEIGHT = 270
HTTP_PORT = 3000
WS_PORT = 1336
UDP_PORT = 1337
DIRECTORY = "build"
DEV = os.getenv('DEV')
HOSTNAME = socket.gethostname()
if DEV:
    LOCAL_IP = "localhost"
    FLASK_ADDRESS = LOCAL_IP
else:
    FLASK_ADDRESS = HOSTNAME + ".local"
    try:
        LOCAL_IP = socket.gethostbyname(HOSTNAME + ".local")
    except:
        LOCAL_IP = socket.gethostbyname(HOSTNAME)

print("HOSTNAME -> " + HOSTNAME)
print("LOCAL_IP -> " + LOCAL_IP)
print("FLASK_ADDRESS -> " + FLASK_ADDRESS)


WS_CONNECTIONS = set()

send_capture = False
vid = None
forced_color = [100, 100, 100]
hsv = [0, 0, 0]
lerp_modifer = 1.0
capture_color = [0, 0, 0]
devices = []
first_device_fetch = True

# HTTP
api = Flask(__name__, static_url_path='', static_folder='build')
# cors = CORS(api)
# socketio = SocketIO(api)


@api.route('/', defaults=dict(filename=None))
@api.route('/<path:filename>', methods=['GET'])
# @cross_origin()
def index(filename):
    filename = filename or 'index.html'
    return send_from_directory('./build', filename)


@api.route('/color', methods=['GET', 'PUT'])
# @cross_origin()
def get_color():
    global forced_color
    global capture_color
    global send_capture

    if request.method == 'GET':
        return json.dumps(forced_color)
    elif request.method == 'PUT':
        if request.json == False:
            send_capture = True
            print("Setting capture on", file=sys.stdout, flush=True)
            return json.dumps(forced_color)
        else:
            send_capture = False
            forced_color = request.json
            print("Setting forced_color: " + str(forced_color),
                  file=sys.stdout, flush=True)
            return json.dumps(forced_color)


@api.route('/hsv', methods=['GET', 'PUT'])
# @cross_origin()
def get_hsv():
    global hsv

    if request.method == 'GET':
        print("Getting hsv: " + str(hsv), file=sys.stdout, flush=True)
        return json.dumps(hsv)
    elif request.method == 'PUT':
        hsv = request.json
        print("Setting hsv: " + str(hsv), file=sys.stdout, flush=True)
        return json.dumps(hsv)


@api.route('/lerp', methods=['GET', 'PUT'])
# @cross_origin()
def get_lerp_modifier():
    global lerp_modifer

    if request.method == 'GET':
        print("Getting lerp_modifer: " + str(hsv), file=sys.stdout, flush=True)
        return json.dumps(lerp_modifer)
    elif request.method == 'PUT':
        lerp_modifer = request.json
        print("Setting lerp_modifer: " + str(lerp_modifer),
              file=sys.stdout, flush=True)
        return json.dumps(lerp_modifer)


@api.route('/devices', methods=['GET'])
# @cross_origin()
def http_get_devices():
    global devices
    print("Getting devices: ", file=sys.stdout, flush=True)
    print(devices, file=sys.stdout, flush=True)
    return json.dumps(devices)


# @socketio.on('connect')
# def test_connect(auth):
#     print("==========> New websocket connection", flush=True)


# @socketio.on_error_default
# def default_error_handler(e):
#     print(request.event["message"], flush=True)  # "my error event"
#     print(request.event["args"], flush=True)    # (data,)


def testDevice(source):
    print("Testing with device " + str(source), flush=True)
    cap = cv2.VideoCapture(source)
    if cap is None or not cap.isOpened():
        raise Exception('Warning: unable to open video source: ' + str(source))


def start_capture():
    print('starting capturing', flush=True)

    global vid
    try:
        testDevice(3)
        vid = cv2.VideoCapture(3)
        print("Capturing with device 3", flush=True)
    except:
        try:
            testDevice(2)
            vid = cv2.VideoCapture(2)
            print("Capturing with device 2", flush=True)
        except:
            try:
                testDevice(1)
                vid = cv2.VideoCapture(1)
                print("Capturing with device 1", flush=True)
            except:
                try:
                    testDevice(0)
                    vid = cv2.VideoCapture(0)
                    print("Capturing with device 0", flush=True)
                except:
                    print("Error getting video capture.", flush=True)

    vid.set(3, CAPTURE_WIDTH)
    vid.set(4, CAPTURE_HEIGHT)


def stop_capture():
    print('stopping capturing', flush=True)

    try:
        global vid
        vid.release()
        vid = None
    except:
        print("Error closing video capture.", flush=True)


def get_devices():
    global devices
    global first_device_fetch
    try:
        while True:
            print("getting devices...", flush=True)
            temp_devices = []

            if first_device_fetch == False:
                subnet = ".".join(LOCAL_IP.split(".")[0:3]) + ".*"
                nmap_cmd = subprocess.Popen(
                    "nmap -sn '" + subnet + "' > /dev/null 2>&1", shell=True)
                nmap_cmd.wait()
            else:
                first_device_fetch = False

            arp_cmd = subprocess.Popen(
                "arp -a | grep -v 'incomplete' | grep 'esp' | awk '{print $2}' | sed 's/^.//;s/.$//'", stdout=subprocess.PIPE, shell=True)

            arp_cmd_output = arp_cmd.communicate()[0]
            arp_cmd.wait()

            if arp_cmd_output != None:
                for device in arp_cmd_output.split(b"\n"):
                    device_string = device.decode("utf-8")
                    if len(device_string) > 0:
                        temp_devices.append(device_string)
                        devices = temp_devices
            else:
                devices = []

            print(str(datetime.now().strftime("%m/%d/%Y, %H:%M:%S")) +
                  ' -> devices: ', flush=True)
            print(devices, flush=True)
            print(str(datetime.now().strftime("%m/%d/%Y, %H:%M:%S")) +
                  ' -> ==================================', flush=True)
            time.sleep(15)
    except:
        print("Error in get_devices", flush=True)
        traceback.print_exc()


def build_message():
    return str("{:.2f}".format(forced_color[0])) + "," + str("{:.2f}".format(forced_color[1])) + "," + str("{:.2f}".format(forced_color[2])) + "," + str(
        "{:.2f}".format(hsv[0])) + "," + str("{:.2f}".format(hsv[1])) + "," + str("{:.2f}".format(hsv[2])) + "," + str("{:.2f}".format(lerp_modifer)) + ","


def send_message_to_devices():
    message = build_message()

    # socketio.emit('data', message)

    for device in devices:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.sendto(bytes(message, "utf-8"), (device, UDP_PORT))


def process():
    try:
        global forced_color
        while True:
            if send_capture == False:
                if vid != None:
                    stop_capture()

                cv2.destroyAllWindows()
                send_message_to_devices()
                time.sleep(0.25)
            else:
                if vid == None:
                    start_capture()
                ret, frame = vid.read()
                frame = cv2.resize(frame, (CAPTURE_WIDTH, CAPTURE_HEIGHT))

                data = np.reshape(frame, (CAPTURE_WIDTH, CAPTURE_HEIGHT, 3))
                data = np.float32(data)

                criteria = (cv2.TERM_CRITERIA_EPS +
                            cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
                flags = cv2.KMEANS_RANDOM_CENTERS
                compactness, labels, centers = cv2.kmeans(
                    data, 1, None, criteria, 10, flags)

                color_array = [int(centers[0].astype(np.int32)[2]), int(
                    centers[0].astype(np.int32)[1]), int(centers[0].astype(np.int32)[0])]

                forced_color = color_array
                send_message_to_devices()

                del ret
                del frame
                del data
                del criteria
                del flags
                del compactness
                del labels
                del centers
                del color_array
    except:
        print("Error with the process", flush=True)
        traceback.print_exc()


def signal_handler(signal, frame):
    global get_devices_thread
    global api_thread
    global process_thread

    print("Killing threads...", flush=True)
    get_devices_thread.kill()
    api_thread.kill()
    process_thread.kill()
    time.sleep(3)
    print("Exiting...", flush=True)
    sys.exit(0)


if __name__ == '__main__':
    global get_devices_thread
    global api_thread
    global process_thread

    signal.signal(signal.SIGINT, signal_handler)

    get_devices_thread = threading.Thread(target=lambda: get_devices())
    api_thread = threading.Thread(target=lambda: api.run(
        host="0.0.0.0", port=HTTP_PORT, debug=True, use_reloader=False))
    process_thread = threading.Thread(target=lambda: process())

    # get_devices_thread.daemon = True
    api_thread.daemon = True
    # process_thread.daemon = True

    get_devices_thread.start()
    api_thread.start()
    process_thread.start()
