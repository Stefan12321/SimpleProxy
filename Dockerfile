FROM ubuntu:22.04
RUN apt-get update \
  && apt-get install -y git \
  && apt-get clean
FROM node:latest
RUN git clone https://github.com/Stefan12321/SimpleProxy
WORKDIR ./SimpleProxy
RUN npm init && npm install