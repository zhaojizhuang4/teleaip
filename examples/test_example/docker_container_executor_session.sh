#!/usr/bin/env bash

/usr/bin/docker run --rm \
-w /root/test_handler \
-v $PWD:/root/test_handler \
-v /dev:/dev \
-v /var/run/docker.sock:/var/run/docker.sock \
-v /etc/hadoop-configuration-for-jobs:/hadoop-configuration-for-jobs   \
--name container_e34_1551104269365_0213_01_000004 \
docker.io/openpai/hadoop-run:v0.10.0 \
bash -c 'cp -r /docker/* /usr/bin/  && cp /hadoop-configuration-for-jobs/* $HADOOP_CONF_DIR/  && bash "/root/test_handler/launch_container.sh"'
