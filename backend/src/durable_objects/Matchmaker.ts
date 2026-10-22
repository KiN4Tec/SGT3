import { GAME_ID_LENGTH } from "@/env"
import { BOARD_SIDE_LENGTH } from "@/env"
import { bufToHex } from "@/utils"

import { GameState, initializeBoard, CellState } from "sgt3-common"

import { DurableObject } from "cloudflare:workers"
import { API_WS_SPEC } from "sgt3-common/src/api"

type MESSAGE_SPEC = API_WS_SPEC.Match.RES

export class Matchmaker extends DurableObject {
	constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
		super(ctx, env)
	}

	async fetch(request: Request): Promise<Response> {
		const incoming_player_id = request.headers.get("X-Player-ID")
		if (!incoming_player_id) return new Response("", { status: 500 })
		const username = request.headers.get("X-Username")
		if (!username) return new Response("", { status: 500 })

		// Check if no one is already waiting
		const player1_id = await this.ctx.storage.get<string | null>("waiting_player_id")
		if (!player1_id) {
			const pair = new WebSocketPair()
			const [client, server] = Object.values(pair)
			server.serializeAttachment({ incoming_player_id })
			this.ctx.acceptWebSocket(server)

			await this.ctx.storage.put("waiting_player_id", incoming_player_id)

			const message: MESSAGE_SPEC = {
				status: "waiting",
				message: "Looking for an opponent...",
			}
			server.send(JSON.stringify(message))
			return new Response(null, {
				status: 101,
				headers: {
					Upgrade: "websocket",
				},
				webSocket: client,
			})
		}

		// Make sure the players aren't matching themselves
		if (incoming_player_id === player1_id) {
			return new Response(null, {
				status: 101,
				headers: {
					Upgrade: "websocket",
				},
				webSocket: this.ctx.getWebSockets()[0],
			})
		}

		// Start a new WebSocket
		const pair = new WebSocketPair()
		const [client, server] = Object.values(pair)
		this.ctx.acceptWebSocket(server)
		const player2_id = incoming_player_id

		// Clear the queue
		await this.ctx.storage.put("waiting_player_id", null)

		// Generate a unique game room ID for this match
		const random_buffer = new ArrayBuffer(GAME_ID_LENGTH)
		const game_id = bufToHex(crypto.getRandomValues(new Uint8Array(random_buffer))).slice(
			0,
			GAME_ID_LENGTH
		)
		const player1_symbol = Math.round(Math.random()) ? CellState.EX : CellState.OH
		const game_state: GameState = {
			board: initializeBoard(BOARD_SIDE_LENGTH),
			player_x_id: player1_symbol === CellState.EX ? player1_id : player2_id,
			player_o_id: player1_symbol === CellState.OH ? player1_id : player2_id,
			current_turn: Math.round(Math.random()) ? CellState.EX : CellState.OH,
			winner: null,
		}

		// Save game
		try {
			await this.env.SGT3_Board_States_Cache.put(game_id, JSON.stringify(game_state))
		} catch {
			server.close(500, "database_inaccessible")
			return new Response(
				JSON.stringify({ status: "error", error: "database_inaccessible" }),
				{ status: 500 }
			)
		}

		// Notify both players they have been matched and give them the game ID
		const message: MESSAGE_SPEC = { status: "matched", game_id: game_id }
		for (const client of this.ctx.getWebSockets()) {
			client.send(JSON.stringify(message))
		}

		return new Response(null, {
			status: 101,
			headers: {
				Upgrade: "websocket",
			},
			webSocket: client,
		})
	}

	async webSocketMessage(_ws: WebSocket, _message: string | ArrayBuffer) {
		return
	}

	async webSocketClose(ws: WebSocket, _code: number, _reason: string, _was_clean: boolean) {
		// If the waiting player disconnects while searching, clear the queue
		const waiting_player_id = await this.ctx.storage.get<string | null>("waiting_player_id")
		if (waiting_player_id && ws.deserializeAttachment().player_id === waiting_player_id) {
			await this.ctx.storage.put<string | null>("waiting_player_id", null)
		}
	}

	async webSocketError(ws: WebSocket, error: unknown) {
		console.error("Matchmaker WebSocket error:", error)
	}
}
