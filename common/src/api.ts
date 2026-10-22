import { CellState } from "."

export declare namespace API_REQ_SPEC {
	export namespace Game {
		export namespace ID {
			export type PATCH = {
				played_cell: number
			}
		}
	}

	export namespace Player {
		export type POST = {
			username: string
			password: string
		}
	}
}

export declare namespace API_RES_SPEC {
	export namespace Game {
		export type POST = {
			game_id: string
		}

		export namespace ID {
			export type GET = {
				board: string
				player_symbol?: CellState
				current_turn: CellState
				winner: CellState | null
			}
			export type PATCH = {
				message: string
				board: string
				winner: CellState | null
			}
		}
	}

	export namespace Player {
		export type POST = {
			player_id: string
			token: string
			is_new_player: boolean
		}
	}
}

export declare namespace API_WS_SPEC {
	export namespace Match {
		export type RES = { message?: string } & (
			| { status: "waiting" }
			| {
					status: "matched"
					game_id: string
			  }
		)

		export namespace ID {
			export type PATCH = {
				played_cell: number
			}
		}
	}
}
