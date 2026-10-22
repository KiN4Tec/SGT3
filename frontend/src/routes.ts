import Login from "./pages/Login.svelte"
import Home from "./pages/Home.svelte"
import Singleplayer from "./pages/Singleplayer.svelte"
import Matchmaking from "./pages/Matchmaking.svelte"
import Multiplayer from "./pages/Multiplayer.svelte"
import NotFound from "./pages/NotFound.svelte"

export const routes = {
	"/": Login,
	"/home": Home,
	"/game/:id": Singleplayer,
	"/match": Matchmaking,
	"/match/:id": Multiplayer,

	"*": NotFound, // Catch-all fallback for undefined paths
}
