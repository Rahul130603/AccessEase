FROM node:24-alpine

WORKDIR /app
COPY --chown=node:node server/ ./server/
COPY --chown=node:node dist/ ./dist/
RUN mkdir /app/data && chown node:node /app/data
USER node
ENV PORT=8080 BIND_HOST=0.0.0.0 ADMIN_CREDENTIAL_FILE=/run/secrets/admin_auth PLATFORM_DATA_DIR=/app/data

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
CMD ["node", "server/admin.mjs"]
