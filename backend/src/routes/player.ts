import { hashPassword, verifyPassword } from "@/middleware/dualAuth"
import { unauthorized } from "@/errors"
import { UserRecord, bufToHex } from "@/utils"
import Schema from "@/schemas"

import { API_REQ_SPEC, API_RES_SPEC } from "sgt3-common/src/api"

import { Context } from "hono"
import { setCookie } from "hono/cookie"
import { sign } from "hono/jwt"
import { env } from "cloudflare:workers"

const SCHEMA = Schema.Player.POST
type REQ_SPEC = API_REQ_SPEC.Player.POST
type RES_SPEC = API_RES_SPEC.Player.POST

export function GET(c: Context): Response {
	return c.json({
		available_routes: {
			"/player": ["POST"],
		},
	})
}

export async function POST(c: Context) {
	// Get and verify request
	const body = await c.req.json().catch(() => null)
	const req = SCHEMA.safeParse(body)
	if (!req.success) return c.json({ error: req.error.issues[0].message }, 400)
	const data: REQ_SPEC = req.data

	// Collect user info
	const username = data.username
	const password = data.password

	const encoded_username = new TextEncoder().encode(username)
	const hashed_username = await crypto.subtle.digest("SHA-256", encoded_username)
	const player_id = bufToHex(new Uint8Array(hashed_username))

	let user_record: UserRecord | null
	try {
		user_record = await env.sgt3_d1
			.prepare("SELECT * FROM players WHERE player_id = ?")
			.bind(player_id)
			.first()
	} catch {
		return c.json({ error: "database_inaccessible" }, 500)
	}

	const is_new_player = !user_record
	if (is_new_player) {
		// --- SIGN UP ---
		try {
			const password_hash = await hashPassword(password)
			await env.sgt3_d1
				.prepare(
					"INSERT INTO players (player_id, username, password_hash) VALUES (?, ?, ?)"
				)
				.bind(player_id, username, password_hash)
				.run()
		} catch {
			return c.json({ error: "database_inaccessible" }, 500)
		}
	} else {
		// --- SIGN IN ---
		try {
			const is_valid = await verifyPassword(user_record!.password_hash, password)
			if (!is_valid) return unauthorized("invalid_password")
		} catch {
			return c.json({ error: "invalid_password_hash" }, 500)
		}
	}

	// Generate and send JWT token (valid for 7 days)
	const token = await sign(
		{
			player_id,
			username,
			exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
		},
		env.JWT_SECRET
	)

	setCookie(c, "token", token, {
		httpOnly: true,
		secure: true,
		sameSite: "Strict",
		path: "/",
		maxAge: 60 * 60 * 24 * 7, // 1 week expiration
	})

	const res: RES_SPEC = {
		player_id,
		token,
		is_new_player,
	}
	return c.json(res, is_new_player ? 201 : 200)
}
