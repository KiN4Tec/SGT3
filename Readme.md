<h1 align="center"> A Serverless Game of Tic-Tac-Toe </h1>

This game is a simple proof-of-concept of making a real-time, "serverless," application/game.

The frontend is built on Vite + Svelte and runs in Github Pages
While the backend is built on Hono + Wrangler and runs in Cloudflare Workers

All the API specifications (including WebSockets) are in the [API Specifications.md](doc/API%20Specifications.md)

To run the application just run

```shell
docker compose up
```

To start a development environment, you can use VSCode DevContainers and run

```shell
docker compose up --watch
```
