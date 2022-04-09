#!/usr/bin/env bash

systemctl disable ledsync
systemctl stop ledsync

sudo cp ledsync.service /etc/systemd/system/

systemctl start ledsync
systemctl enable ledsync