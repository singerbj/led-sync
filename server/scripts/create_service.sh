#!/usr/bin/env bash

sudo cp ledsync.service /etc/systemd/system/

systemctl start ledsync
systemctl enable ledsync