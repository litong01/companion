#!/bin/bash

if [[ $1 != '' ]]; then
    docker rm -f osmdapp
else
    docker run --name osmdapp -d -p 8080:80 \
      -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro \
      -v $(pwd)/src/root:/www/data nginx:latest
fi