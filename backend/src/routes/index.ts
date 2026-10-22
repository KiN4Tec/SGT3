import { Context } from "hono"

export function GET(c: Context): Response {
	return c.json({
		available_routes: {
			"/player": ["POST"],
			"/game": ["POST"],
			"/game/:id": ["GET", "PATCH"],
			"/match/ws": ["WS"],
			"/match/:id/ws": ["WS"],
		},
	})
}
