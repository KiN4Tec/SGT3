import { BOARD_SIDE_LENGTH } from "@/env"
import { gameNotFound, unauthorized } from "@/errors"
import Schema from "@/schemas"

import { CellState, checkWinner, GameState, invertCell, serializeBoard } from "sgt3-common"

import { DurableObject } from "cloudflare:workers"

const WS_REQ_SCHEMA = Schema.Match.ID.WS

export class GameRoom extends DurableObject {
	constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
		super(ctx, env)
	}

	async fetch(request: Request): Promise<Response> {
		const game_id = request.headers.get("X-Game-ID")
		if (!game_id) return new Response("", { status: 500 })
		const player_id = request.headers.get("X-Player-ID")
		if (!player_id) return new Response("", { status: 500 })
		const username = request.headers.get("X-Username")
		if (!username) return new Response("", { status: 500 })

		// Retrieve game state
		const cached_game = await this.env.SGT3_Board_States_Cache.get(game_id)
		if (!cached_game) return gameNotFound()
		const game: GameState = JSON.parse(cached_game)
		this.ctx.storage.put("game_state", game)
		this.ctx.storage.put("game_id", game_id)

		// Get and verify player symbol
		let player_symbol
		if (player_id === game.player_x_id) player_symbol = CellState.EX
		else if (player_id === game.player_o_id) player_symbol = CellState.OH
		else return unauthorized("not_your_game")

		// Send game state
		const sent_game = {
			board: serializeBoard(game.board),
			current_turn: game.current_turn,
			player_symbol,
			winner: game.winner,
		}

		// TODO: accept or keep only one websocket per player
		const pair = new WebSocketPair()
		const [client, server] = Object.values(pair)
		this.ctx.acceptWebSocket(server)
		server.serializeAttachment({ player_id })

		server.send(JSON.stringify(sent_game))
		return new Response(null, {
			status: 101,
			headers: {
				Upgrade: "websocket",
			},
			webSocket: client,
		})
	}

	// Triggered when the player sends a move over the WebSocket
	async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
		// Verify Request
		let data
		try {
			const json = JSON.parse(message as string)
			const req = WS_REQ_SCHEMA.safeParse(json)
			if (!req.success) {
				ws.send(
					JSON.stringify({
						error: req.error.issues[0].message,
					})
				)
				return
			}
			data = req.data
		} catch {
			ws.send(JSON.stringify({ error: "invalid_json" }))
			return
		}

		// Get saved state
		const attachment = ws.deserializeAttachment() as { player_id: string }
		const player_id = attachment?.player_id

		const game = await this.ctx.storage.get<GameState>("game_state")
		const game_id = await this.ctx.storage.get<string>("game_id")
		if (!game || !game_id) {
			console.error("Uninitialized game state, id: ", game_id ?? this.ctx.id)
			if (ws) ws.close()
			return
		}

		// Verify and update the board
		if (
			data.played_cell >= game.board.length ||
			game.board[data.played_cell] !== CellState.Empty
		) {
			return ws.send(
				JSON.stringify({
					error: "invalid_move",
					message: "played_cell must point to an empty cell on the board.",
				})
			)
		}

		if (game.winner !== null) {
			ws.send(JSON.stringify({ error: "game_already_finished" }))
			return
		}

		const player_symbol = player_id === game.player_x_id ? CellState.EX : CellState.OH
		if (player_symbol !== game.current_turn)
			return ws.send(JSON.stringify({ error: "not_your_turn" }))

		// Save updated state
		game.board[data.played_cell] = player_symbol
		game.current_turn = invertCell(game.current_turn)
		game.winner = checkWinner(BOARD_SIDE_LENGTH, game.board)
		await this.ctx.storage.put("game_state", game)
		this.env.SGT3_Board_States_Cache.put(game_id, JSON.stringify(game))

		// Broadcast the updated state to all connected clients in this room
		const sent_game = {
			message: game.winner
				? game.winner === CellState.Empty
					? "Draw"
					: `Player ${player_symbol} Wins`
				: undefined,
			board: serializeBoard(game.board),
			current_turn: game.current_turn,
			winner: game.winner,
		}
		for (const client of this.ctx.getWebSockets()) {
			client.send(JSON.stringify(sent_game))
		}
	}

	async webSocketClose(_ws: WebSocket, _code: number, _reason: string, _was_clean: boolean) {
		return
	}

	async webSocketError(ws: WebSocket, error: unknown) {
		console.error("WebSocket error:", error)
	}
}
