# MP3 Converter Service

Small authenticated HTTP wrapper around the `mwader/ydls` Docker image. It
accepts a YouTube URL and streams back an MP3; downloads are not stored.

## Deploy on Railway

1. Create a Railway project from this GitHub repository.
2. Set the service Root Directory to `/converter-api`.
3. Add `CONVERTER_API_KEY` as a secret with at least 32 random characters.
4. Generate a public domain for the service.
5. Set these Production variables in Vercel:
   - `MP3_BACKEND_URL`: the Railway service origin, for example
     `https://your-service.up.railway.app`.
   - `MP3_BACKEND_API_KEY`: the same secret as `CONVERTER_API_KEY`.

The browser calls only the Vercel endpoint. Vercel forwards the request with
the secret header and streams the MP3 response back to the browser. The service
accepts one active conversion at a time and has a four-minute timeout.
It rejects live videos and videos longer than 10 minutes, stops output above
50 MiB and does not retain converted files.

`GET /health` is public for the platform health check. `POST /download`
requires `Authorization: Bearer <CONVERTER_API_KEY>` and JSON `{ "url": "..." }`.
