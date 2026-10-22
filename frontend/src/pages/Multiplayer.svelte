<script lang="ts">
	import { onDestroy, onMount } from "svelte"
	import { CellState } from "sgt3-common"

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
	let socket: WebSocket

	function loadGame(): void {
		const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
		socket = new WebSocket(`${protocol}//${window.location.host}/api/v1/match/${game_id}/ws`)
		socket.onmessage = updateGame
	}

	function updateGame(event: MessageEvent): void {
		const data = JSON.parse(event.data)
		board = data.board
		current_turn = data.current_turn
		player_symbol = data.player_symbol ?? player_symbol
		winner = data.winner
	}

	function onCellClick(cell_number: number): void {
		if (board[cell_number] !== "-" || winner !== null) {
			return
		}
		socket.send(JSON.stringify({ played_cell: cell_number }))
	}

	onMount(() => loadGame())
	onDestroy(() => {
		if (socket) socket.close()
	})
</script>

<div id="multiplayer-page">
	<h1>Multiplayer</h1>

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

	<p class="win-message" hidden={winner === null}>
		{#if winner === CellState.Empty}
			Draw
		{:else}
			<span
				class:me={winner === player_symbol}
				class:opp={winner !== player_symbol}
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
