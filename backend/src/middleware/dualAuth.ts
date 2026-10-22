import { Context, Next } from "hono"
import { getCookie } from "hono/cookie"
import { verify } from "hono/jwt"

import Schema from "@/schemas"
import { bufToHex, hexToBuf } from "@/utils"
import { unauthorized, unsupportedMediaType } from "@/errors"
import { createMiddleware } from "hono/factory"

export type JWTPayload = {
	["player_id"]: string
	["username"]: string
}

export const dualAuthMiddleware = createMiddleware(async (c: Context, next: Next) => {
	// Get token from cookies
	let token: string | undefined = getCookie(c, "token")

	// Get token from body if cookie does not exist
	if (!token) {
		const body = await c.req.raw
			.clone()
			.json()
			.catch(() => null)
		if (!body) return unsupportedMediaType()

		const req = Schema.Auth.ALL.safeParse(body)
		if (!req.success) return c.json({ error: req.error }, 401)
		token = req.data.token
	}

	// Verify token
	try {
		const payload = await verify(token, c.env.JWT_SECRET, "HS256")
		c.set("jwtPayload", payload)
		return next()
	} catch {
		return unauthorized("invalid_token")
	}
})

export async function hashPassword(password: string, provided_salt?: string): Promise<string> {
	const encoder = new TextEncoder()

	// Use provided salt if available, otherwise generate a new one
	const salt = provided_salt
		? hexToBuf(provided_salt)
		: crypto.getRandomValues(new Uint8Array(16))
	if (!salt) throw "Invalid Salt"

	const key_material = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		{ name: "PBKDF2" },
		false,
		["deriveBits", "deriveKey"]
	)

	const derived_bits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt: salt,
			iterations: 100000, // Maximum standard/safe iteration limit
			hash: "SHA-256",
		},
		key_material,
		256 // 256-bit output
	)

	const salt_hex = bufToHex(salt)
	const hash_hex = bufToHex(new Uint8Array(derived_bits))

	return `${salt_hex}:${hash_hex}`
}

export async function verifyPassword(
	storedHash: string,
	passwordAttempt: string
): Promise<boolean> {
	const [salt_hex, original_hash_hex] = storedHash.split(":")

	const attempt_result = await hashPassword(passwordAttempt, salt_hex)
	const [, attempt_hash_hex] = attempt_result.split(":")

	return original_hash_hex === attempt_hash_hex
}
