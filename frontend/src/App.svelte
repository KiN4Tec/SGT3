<script lang="ts">
	import Router from "svelte-spa-router";
	import { routes } from "./routes";
</script>

<main id="app">
	<div id="center">
		<!-- svelte-spa-router automatically manages the hash portion of the URL -->
		<Router {routes} />
	</div>
</main>

<style lang="scss">

	#app {
		display: flex;
		text-align: center;
		flex-direction: column;

		min-height: 100svh;
		margin: 0 auto;
	}

	#center {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		place-content: center;
		place-items: center;
		gap: 25px;

		@media (max-width: 1024px) {
			padding: 32px 20px 24px;
			gap: 18px;
		}
	}

</style>