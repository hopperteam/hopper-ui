FROM node:12-alpine AS builder

COPY src /app/src
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
COPY tsconfig.json /app/tsconfig.json
COPY webpack.config.js /app/webpack.config.js
WORKDIR /app
RUN npm install . 
RUN npm run-script build

FROM lucaschimweg/hopper-testimage AS tester
COPY --from=builder /app/.build /app/.build
COPY test /app/test
WORKDIR /app
RUN npx http-server .build -p 80 & cd test && npm install && npm run-script build && npm run-script test && kill $!

FROM nginx:alpine AS runner
COPY --from=builder /app/.build /usr/share/nginx/html
COPY docker-starter.sh /docker-starter.sh
CMD [ "/docker-starter.sh" ]
