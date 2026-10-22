<script lang="ts">
	import type { API_RES_SPEC } from "sgt3-common/src/api"
	import { push } from "svelte-spa-router"

	let error = $state(false)

	async function handleSingleplayer() {
		error = false
		try {
			const response = await fetch("/api/v1/game", {
				method: "POST",
			})

			if (!response.ok) throw new Error("Request failed")

			const res: API_RES_SPEC.Game.POST = await response.json()
			push(`/game/${res.game_id}`)
		} catch {
			error = true
		}
	}

	function handleMultiplayer() {
		push("/match")
	}
</script>

<div id="home-page">
	<h1>Welcome</h1>

	<p class="subtitle">Please select a mode to get started:</p>

	<div class="actions">
		<button onclick={handleSingleplayer}>Singleplayer</button>
		<button onclick={handleMultiplayer}>Multiplayer</button>
	</div>

	<p id="error-message" hidden={!error}>Unexpected error, please try again.</p>
</div>

<style>
	#home-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: fit-content;
		gap: 2rem;
	}
</style>
