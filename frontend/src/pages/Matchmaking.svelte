<script lang="ts">
	import type { API_WS_SPEC } from "sgt3-common/src/api"
	import { onDestroy } from "svelte"
	import { push } from "svelte-spa-router"

	type MESSAGE_SPEC = API_WS_SPEC.Match.RES

	let queue_status = "Idle"
	let searching = false
	let socket: WebSocket

	function findMatch(): void {
		searching = true
		queue_status = "Connecting to lobby..."

		const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
		socket = new WebSocket(`${protocol}//${window.location.host}/api/v1/match/ws`)

		socket.onmessage = (event) => {
			const data: MESSAGE_SPEC = JSON.parse(event.data)

			if (data.status === "waiting") {
				queue_status = data.message ?? "Searching for opponent..."
			} else if (data.status === "matched") {
				queue_status = "Match found! Entering room..."
				socket.close()

				// Automatically redirect players to their new game room
				push(`/match/${data.game_id}`)
			}
		}

		socket.onerror = () => {
			queue_status = "Matchmaking connection error."
			searching = false
		}
	}

	onDestroy(() => {
		if (socket) socket.close()
	})
</script>

<div>
	{#if !searching}
		<button on:click={findMatch}>Find Online Match</button>
	{:else}
		<p>{queue_status}</p>
	{/if}
</div>
