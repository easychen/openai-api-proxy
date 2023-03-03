FROM --platform=$TARGETPLATFORM node:18-alpine3.15
EXPOSE 8088
RUN mkdir -p /data/api
COPY app.js /data/api/app.js
COPY fetchsse.js /data/api/fetchsse.js
COPY package.json /data/api/package.json
RUN npm install --prefix /data/api
CMD ["node", "/data/api/app.js"]