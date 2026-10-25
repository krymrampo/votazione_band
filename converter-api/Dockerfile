FROM mwader/ydls:latest

USER root
RUN apk add --no-cache nodejs

WORKDIR /app
COPY --chown=nobody:nobody server.mjs ./server.mjs

ENV PORT=8080
ENV YDLS_PORT=8081
ENV LISTEN=127.0.0.1:8081
EXPOSE 8080
USER nobody

ENTRYPOINT ["node"]
CMD ["/app/server.mjs"]
