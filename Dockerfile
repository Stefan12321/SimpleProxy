FROM node:20.9.0 AS base
WORKDIR /app

FROM base AS build-app
COPY package*.json ./
RUN npm install && npm install -g crx-cli
COPY . .
RUN npm run build

FROM scratch AS app
COPY --from=build-app /app/build/selfproxy /selfproxy/
ENTRYPOINT [ "/bin/app" ]