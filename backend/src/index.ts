import { Hono } from "hono"

import { dualAuthMiddleware } from "@/middleware/dualAuth"

import { GameRoom } from "@/durable_objects/GameRoom"
import { Matchmaker } from "@/durable_objects/Matchmaker"

const app_v1 = new Hono<{ Bindings: CloudflareBindings }>()
{
	app_v1.get("/", (await import("@/routes/index")).GET)
	{
		app_v1.post("/player", (await import("@/routes/player")).POST)
	}
	{
		app_v1.get("/game", (await import("@/routes/game/index")).GET)
		app_v1.post("/game", dualAuthMiddleware, (await import("@/routes/game/index")).POST)
		{
			app_v1.get("/game/:id", (await import("@/routes/game/[id]/index")).GET)
			app_v1.patch(
				"/game/:id",
				dualAuthMiddleware,
				(await import("@/routes/game/[id]/index")).PATCH
			)
		}
	}
	{
		app_v1.get("/match/ws", dualAuthMiddleware, (await import("@/routes/match/ws")).GET)
		{
			app_v1.get(
				"/match/:id/ws",
				dualAuthMiddleware,
				(await import("@/routes/match/[id]/ws")).GET
			)
		}
	}
}

const app = new Hono<{ Bindings: CloudflareBindings }>()
app.route("/api/v1", app_v1)

export { GameRoom, Matchmaker }
export default app
