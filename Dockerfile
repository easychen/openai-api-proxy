FROM --platform=$TARGETPLATFORM node:18-alpine3.15
EXPOSE 9000
RUN mkdir -p /data/api
COPY src/app.js /data/api/app.js
COPY src/fetchsse.js /data/api/fetchsse.js
COPY package.json /data/api/package.json
RUN npm install --prefix /data/api
CMD ["node", "/data/api/app.js"]