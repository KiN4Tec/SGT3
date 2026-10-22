import { playComputerMove } from "@/game"
import { gameNotFound, unsupportedMediaType } from "@/errors"
import { JWTPayload } from "@/middleware/dualAuth"
import Schema from "@/schemas"

import { CellState, checkWinner, GameState, invertCell, serializeBoard } from "sgt3-common"

import { Context } from "hono"
import { env } from "cloudflare:workers"
import { BOARD_SIDE_LENGTH } from "@/env"

const GET_SCHEMA = Schema.Game.ID.GET

const PATCH_PARAMS_SCHEMA = Schema.Game.ID.PATCH.params
const PATCH_BODY_SCHEMA = Schema.Game.ID.PATCH.body

export async function GET(c: Context): Promise<Response> {
	const req = GET_SCHEMA.safeParse(c.req.param())
	if (!req.success) return c.json({ error: req.error.issues[0].message }, 400)

	const game_id = req.data.id
	const cached_state = await env.SGT3_Board_States_Cache.get(game_id)
	if (!cached_state) return gameNotFound()

	const game_state: GameState = JSON.parse(cached_state)
	return c.json({
		board: serializeBoard(game_state.board),
		player_symbol: game_state.player_x_id !== null ? CellState.EX : CellState.OH,
		current_turn: game_state.current_turn,
		winner: game_state.winner,
	})
}

export async function PATCH(c: Context): Promise<Response> {
	// Get and verify request body
	const req_body = await c.req.json().catch(() => null)
	if (!req_body) return unsupportedMediaType()

	const body = PATCH_BODY_SCHEMA.safeParse(req_body)
	if (!body.success) return c.json({ error: body.error.issues[0].message }, 400)
	const data = body.data

	// Get and verify request params
	const params = PATCH_PARAMS_SCHEMA.safeParse(c.req.param())
	if (!params.success) return c.json({ error: params.error.issues[0].message }, 400)
	const game_id = params.data.id

	// Retrieve game from cache
	const game_state = await env.SGT3_Board_States_Cache.get<GameState>(game_id, { type: "json" })
	if (!game_state) return gameNotFound()

	const player_symbol = game_state.player_x_id !== null ? CellState.EX : CellState.OH
	const player_id = game_state.player_x_id || game_state.player_o_id

	// Get and verify player_id
	const token = c.get("jwtPayload") as JWTPayload
	if (player_id !== token["player_id"]) return c.json({ error: "not_your_game" }, 403)

	// Check if game already finished
	if (game_state.winner !== null)
		return c.json(
			{
				error: "game_already_finished",
				winner: game_state.winner,
			},
			400
		)

	// Check and play human move
	if (
		data.played_cell >= game_state.board.length ||
		game_state.board[data.played_cell] !== CellState.Empty
	) {
		return c.json(
			{
				error: "invalid_move",
				message: "played_cell must point to an empty cell on the board.",
			},
			400
		)
	}
	game_state.board[data.played_cell] = player_symbol

	// Play computer move if winner was not decided yet
	let winner = checkWinner(BOARD_SIDE_LENGTH, game_state.board)
	if (winner === null) {
		const played_computer_move = playComputerMove(game_state.board)! // Safety: No winner means empty cells still available
		game_state.board[played_computer_move] = invertCell(player_symbol)
		winner = checkWinner(BOARD_SIDE_LENGTH, game_state.board)
	}
	game_state.winner = winner

	// Finalize and send response
	try {
		await env.SGT3_Board_States_Cache.put(game_id, JSON.stringify(game_state))
	} catch {
		return c.json({ error: "database_inaccessible" }, 500)
	}

	return c.json({
		message: winner
			? winner === CellState.Empty
				? "Draw"
				: `Player ${winner} wins`
			: undefined,
		board: serializeBoard(game_state.board),
		winner,
	})
}
