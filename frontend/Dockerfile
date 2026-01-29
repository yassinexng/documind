FROM node:20-alpine

ENV NODE_ENV=development

RUN addgroup -g 1001 appuser
RUN adduser -u 1001 -G appuser -s /bin/sh -D appuser

WORKDIR /app

RUN chown appuser:appuser /app

USER appuser

COPY --chown=appuser:appuser package*.json ./

RUN npm install

COPY --chown=appuser:appuser . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]