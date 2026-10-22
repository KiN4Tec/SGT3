import { JWTPayload } from "@/middleware/dualAuth"

import { Context } from "hono"
import { env } from "cloudflare:workers"

export async function GET(c: Context): Promise<Response> {
	// Extract player ID from the verified JWT payload
	const payload = c.get("jwtPayload") as JWTPayload
	const player_id = payload.player_id
	const username = payload.username

	// Use a fixed ID (singleton) so all players connect to the exact same matchmaker queue instance
	const id = env.MATCHMAKER.idFromName("global-matchmaking-lobby")
	const stub = env.MATCHMAKER.get(id)

	const newHeaders = new Headers(c.req.raw.headers)
	newHeaders.set("X-Player-ID", player_id)
	newHeaders.set("X-Username", username)

	const modified_req = new Request(c.req.raw, { headers: newHeaders })
	return await stub.fetch(modified_req)
}
