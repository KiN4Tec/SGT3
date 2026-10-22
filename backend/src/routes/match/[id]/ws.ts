import { JWTPayload } from "@/middleware/dualAuth"

import Schema from "@/schemas"

import { Context } from "hono"
import { env } from "cloudflare:workers"

const GET_SCHEMA = Schema.Match.ID.GET

export async function GET(c: Context): Promise<Response> {
	const req = GET_SCHEMA.safeParse(c.req.param())
	if (!req.success) {
		console.error(req.error.issues[0].message)
		return c.json({ error: req.error.issues[0].message }, 400)
	}
	const game_id = req.data.id

	const payload = c.get("jwtPayload") as JWTPayload
	const player_id = payload.player_id
	const username = payload.username

	const id = env.GAME_ROOM.idFromName(game_id)
	const stub = env.GAME_ROOM.get(id)

	const new_headers = new Headers(c.req.raw.headers)
	new_headers.set("X-Game-ID", game_id)
	new_headers.set("X-Player-ID", player_id)
	new_headers.set("X-Username", username)

	const modified_req = new Request(c.req.raw, { headers: new_headers })
	return stub.fetch(modified_req)
}
