import { playComputerMove } from "@/game"
import { JWTPayload } from "@/middleware/dualAuth"
import { GAME_ID_LENGTH, BOARD_SIDE_LENGTH } from "@/env"

import { GameState, initializeBoard, CellState } from "sgt3-common"
import { API_RES_SPEC } from "sgt3-common/src/api"

import { Context } from "hono"
import { env } from "cloudflare:workers"
import { bufToHex } from "@/utils"

type RES_SPEC = API_RES_SPEC.Game.POST

export function GET(c: Context): Response {
	return c.json({
		available_routes: {
			"/game": ["POST"],
			"/game/:id": ["GET", "PATCH"],
		},
	})
}

export async function POST(c: Context): Promise<Response> {
	// Get and verify request
	const token = c.get("jwtPayload") as JWTPayload
	const player_id = token["player_id"]

	// Create a new game
	const random_buffer = new ArrayBuffer(GAME_ID_LENGTH)
	const game_id = bufToHex(crypto.getRandomValues(new Uint8Array(random_buffer))).slice(
		0,
		GAME_ID_LENGTH
	)
	const player_symbol = Math.round(Math.random()) ? CellState.EX : CellState.OH
	const game_state: GameState = {
		board: initializeBoard(BOARD_SIDE_LENGTH),
		player_x_id: player_symbol === CellState.EX ? player_id : null,
		player_o_id: player_symbol === CellState.OH ? player_id : null,
		current_turn: Math.round(Math.random()) ? CellState.EX : CellState.OH,
		winner: null,
	}

	// Play computer move
	const computer_symbol = player_symbol === CellState.EX ? CellState.OH : CellState.EX
	if (game_state.current_turn === computer_symbol) {
		game_state.board[playComputerMove(game_state.board)!] = computer_symbol
		game_state.current_turn = player_symbol
	}

	// Save game
	try {
		await env.SGT3_Board_States_Cache.put(game_id, JSON.stringify(game_state))
	} catch {
		return c.json({ error: "database_inaccessible" }, 500)
	}

	// Send response
	const res: RES_SPEC = {
		game_id,
	}
	return c.json(res, 201)
}
