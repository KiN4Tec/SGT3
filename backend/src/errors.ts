export function unsupportedMediaType() {
	return new Response(null, {
		status: 415,
		headers: {
			Accept: "application/json",
		},
	})
}

export function unauthorized(error?: string) {
	return new Response(error, { status: 401 })
}

export function gameNotFound() {
	return new Response(
		JSON.stringify({
			error: "game_not_found",
			message: "Start a new game by calling POST on /game",
		}),
		{ status: 404 }
	)
}
