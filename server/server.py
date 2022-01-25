#!/usr/bin/env python

from turtle import color
import cv2
import socket
from flask import Flask, request, jsonify, json, send_from_directory
import threading
import time
import numpy as np
import os
import colorsys

CAPTURE_WIDTH = 480
CAPTURE_HEIGHT = 270
HTTP_PORT = 3000
WS_PORT = 1336
UDP_PORT = 1337
DIRECTORY = "build"
HOSTNAME = socket.gethostname()
try:
    LOCAL_IP = socket.gethostbyname(HOSTNAME + ".local")
except:
    LOCAL_IP = socket.gethostbyname(HOSTNAME)

WS_CONNECTIONS = set()

send_capture = False
vid = None
forced_color = [100, 100, 100]
capture_color = [0, 0, 0]
devices = []

# HTTP
api = Flask(__name__, static_url_path='', static_folder='build')

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
            print("Setting capture on")
            return json.dumps(forced_color)
        else:
            send_capture = False
            forced_color = request.json
            print("Setting forced_color: " + str(forced_color))
            return json.dumps(forced_color)

def testDevice(source):
    print("Testing with device " + str(source))
    cap = cv2.VideoCapture(source) 
    if cap is None or not cap.isOpened():
        raise Exception('Warning: unable to open video source: ' + str(source))

def start_capture():
    print('starting capturing')

    global vid
    try:
        testDevice(3)
        vid = cv2.VideoCapture(3)
        print("Capturing with device 3")
    except:
        try:
            testDevice(2)
            vid = cv2.VideoCapture(2)
            print("Capturing with device 2")
        except:
            try:
                testDevice(1)
                vid = cv2.VideoCapture(1)
                print("Capturing with device 1")
            except:
                try:
                    testDevice(0)
                    vid = cv2.VideoCapture(0)
                    print("Capturing with device 0")
                except:
                    print("Error getting video capture.")   
            
    vid.set(3, CAPTURE_WIDTH)
    vid.set(4, CAPTURE_HEIGHT)

def stop_capture():
    print('stopping capturing')

    try:
        global vid
        vid.release()
        vid = None
    except:
        print("Error closing video capture.")

def get_devices():
    while True:
        print("getting devices...")
        global devices
        temp_devices = []
        
        subnet = ".".join("192.168.181.4".split(".")[0:3]) + ".*"
        os.popen("nmap -sn '" + subnet + "'")

        for device in os.popen("arp -a | grep 'esp' | awk '{print $2}' | sed 's/^.//;s/.$//'"):
            formatted_device = device = device[:-1] 
            temp_devices.append(formatted_device)
        devices = temp_devices

        print(devices)
        time.sleep(15)

def process():
    global forced_color
    while True:
        if send_capture == False:
            if vid != None:
                stop_capture()

            cv2.destroyAllWindows()
            for device in devices:
                sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                message = str(forced_color[0]) + "," + str(forced_color[1]) + "," + str(forced_color[2]) + ","
                sock.sendto(bytes(message, "utf-8"), (device, UDP_PORT))
            time.sleep(0.25)
        else:
            if vid == None:
                start_capture()
            ret, frame = vid.read()
            frame = cv2.resize(frame, (CAPTURE_WIDTH, CAPTURE_HEIGHT))

            data = np.reshape(frame, (CAPTURE_WIDTH, CAPTURE_HEIGHT, 3))
            data = np.float32(data)

            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
            flags = cv2.KMEANS_RANDOM_CENTERS
            compactness, labels, centers = cv2.kmeans(data, 1, None, criteria, 10, flags)

            color_array = [int(centers[0].astype(np.int32)[2]), int(centers[0].astype(np.int32)[1]), int(centers[0].astype(np.int32)[0])]
            
            # increase saturation
            print(0, color_array)
            color_array_decimal = [color_array[0] / 255, color_array[1] / 255, color_array[2] / 255]
            print(1, color_array_decimal)
            hsv = colorsys.rgb_to_hsv(color_array_decimal[0], color_array_decimal[1], color_array_decimal[2])
            print(2, hsv)
            new_saturation = hsv[1] * 1.5
            if new_saturation > 1:
                new_saturation = 1
            print(3, new_saturation)
            rgb = colorsys.hsv_to_rgb(hsv[0], new_saturation, hsv[2])
            print(4, rgb)
            color_array = [int(rgb[0] * 255), int(rgb[1] * 255), int(rgb[2] * 255)]
            print(5, color_array)
            print("=======================")

            forced_color = color_array
            for device in devices:
                sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                message = str(color_array[0]) + "," + str(color_array[1]) + "," + str(color_array[2]) + ","
                sock.sendto(bytes(message, "utf-8"), (device, UDP_PORT))

            del ret
            del frame
            del data
            del criteria
            del flags
            del compactness
            del labels
            del centers
            del color_array

if __name__ == '__main__':
    threading.Thread(target=lambda: get_devices()).start()
    threading.Thread(target=lambda: api.run(host=str(LOCAL_IP), port=HTTP_PORT)).start()
    threading.Thread(target=lambda: process()).start()
    
   


            


