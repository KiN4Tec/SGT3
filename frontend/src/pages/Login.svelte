<script lang="ts">
	import type { API_REQ_SPEC } from "sgt3-common/src/api"
	import { push } from "svelte-spa-router"

	let username = $state("")
	let password = $state("")
	let status: "idle" | "submitting" | "error" = $state("idle")

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault() // Prevents browser page reload
		status = "submitting"
		try {
			const req: API_REQ_SPEC.Player.POST = { username, password }
			const response = await fetch("/api/v1/player", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(req),
			})

			if (!response.ok) throw new Error("Login failed")
			push("/home")
		} catch {
			status = "error"
		}
	}
</script>

<div id="home-page">
	<h1>Welcome</h1>

	<p class="subtitle">Sign in with your account</p>

	<form onsubmit={handleSubmit}>
		<label for="username">Username</label>
		<input
			id="username"
			name="username"
			type="text"
			bind:value={username}
			minlength="3"
			maxlength="18"
			pattern="[a-zA-Z0-9]+"
			required
		/>

		<label for="password">Password</label>
		<input
			id="password"
			name="password"
			type="password"
			bind:value={password}
			minlength="3"
			maxlength="18"
			required
		/>

		<button type="submit" disabled={status === "submitting"}>
			{status === "submitting" ? "Logging in..." : "Login"}
		</button>

		{#if status === "error"}
			<p class="error">Something went wrong. Please try again.</p>
		{/if}
	</form>
</div>

<style lang="scss">
	#home-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: fit-content;
		gap: 2rem;
	}

	.error {
		color: red;
	}

	form {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		font-size: 20px;

		label {
			margin: 1em;
		}

		input {
			padding: 0.7em 0.7em;
			font-size: 18px;

			border-radius: 0.5em;
			border: 2px solid oklch(62.053% 0.16551 255.493);

			background-color: oklch(97.245% 0.0138 248.156);
			color: oklch(32.318% 0.03277 250.621);
		}

		button {
			margin: 2.5em 0;
			padding: 0.7em 3em;
			font-size: 20px;
			font-weight: 600;

			border-radius: 999px;

			background-color: oklch(67.336% 0.12755 251.77);
			color: oklch(33.316% 0.02679 255.15);

			cursor: pointer;
		}
	}
</style>
