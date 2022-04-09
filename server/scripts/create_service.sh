#!/usr/bin/env bash

sudo systemctl disable ledsync
sudo systemctl stop ledsync

sudo cp ./scripts/ledsync.service /etc/systemd/system/

sudo systemctl start ledsync
sudo systemctl enable ledsync