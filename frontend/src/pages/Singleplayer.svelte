<script lang="ts">
	import { onMount } from "svelte"

	import { CellState } from "sgt3-common"
	import type { API_REQ_SPEC, API_RES_SPEC } from "sgt3-common/src/api"

	import Board from "../components/Board.svelte"

	const BOARD_SIDE_LENGTH = 3
	const BOARD_SIZE = BOARD_SIDE_LENGTH * BOARD_SIDE_LENGTH

	let { params = {} } = $props()

	// svelte-ignore state_referenced_locally
	let game_id: string = params.id
	let player_symbol: CellState = $state(CellState.Empty)

	let board = $state("-".repeat(BOARD_SIZE))
	// svelte-ignore state_referenced_locally
	let current_turn: CellState = $state(player_symbol)
	let winner: CellState | null = $state(null)

	async function loadGame(): Promise<void> {
		const res = await fetch(`/api/v1/game/${game_id}`)
		const res_data: API_RES_SPEC.Game.ID.GET = await res.json()
		board = res_data.board
		player_symbol = res_data.player_symbol ?? player_symbol
		current_turn = res_data.current_turn
		winner = res_data.winner
	}

	async function onCellClick(cell_number: number): Promise<void> {
		if (board[cell_number] !== "-" || winner !== null) return

		const req: API_REQ_SPEC.Game.ID.PATCH = { played_cell: cell_number }
		const res = await fetch(`/api/v1/game/${game_id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(req),
		})

		const res_data: API_RES_SPEC.Game.ID.PATCH = await res.json()
		board = res_data.board
		winner = res_data.winner
	}

	onMount(() => loadGame())
</script>

<div id="singleplayer-page">
	<h1>Singleplayer</h1>

	<p class="subtitle" hidden={winner !== null}>
		You are:
		<span
			class:ex={player_symbol === CellState.EX}
			class:oh={player_symbol === CellState.OH}
			id="player-symbol"
		></span>
	</p>
	<p class="subtitle" hidden={winner !== null}>
		<span
			class:player_turn={current_turn !== CellState.Empty && current_turn === player_symbol}
			class:opponent_turn={current_turn !== CellState.Empty && current_turn !== player_symbol}
			class:ex={current_turn === CellState.EX}
			class:oh={current_turn === CellState.OH}
			id="turn-indicator"
		></span>
		Turn
	</p>

	<p id="win-message" hidden={winner === null}>
		{#if winner === CellState.Empty}
			Draw
		{:else}
			<span
				class:me={winner === player_symbol}
				class:opp={winner !== player_symbol}
				class:ex={winner === CellState.EX}
				class:oh={winner === CellState.OH}
				id="winner-symbol"
			></span>
			Won
		{/if}
	</p>

	<div class="Board">
		<Board side_length={BOARD_SIDE_LENGTH} board_state={board} on_cell_click={onCellClick} />
	</div>
</div>

<style lang="scss">
	.Board {
		margin-top: 3em;
	}

	#win-message {
		font-size: 2rem;
	}

	#turn-indicator,
	#player-symbol,
	#winner-symbol {
		&.ex:after {
			color: rgb(216, 75, 75);
		}

		&.oh:after {
			color: rgb(75, 192, 216);
		}
	}

	#player-symbol {
		&:after {
			content: "Loading";
		}

		&.ex:after {
			content: "X";
		}

		&.oh:after {
			content: "O";
		}
	}

	#turn-indicator {
		&:after {
			content: "Loading";
		}

		&.player_turn:after {
			content: "Your";
		}

		&.opponent_turn:after {
			content: "Opponent's";
		}
	}

	#winner-symbol {
		&.me:after {
			content: "You";
		}

		&.opp:after {
			content: "Opponent";
		}
	}
</style>
