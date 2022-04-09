#!/usr/bin/env bash

sudo systemctl disable ledsync
sudo systemctl stop ledsync

sudo cp ledsync.service /etc/systemd/system/

sudo systemctl start ledsync
sudo systemctl enable ledsync