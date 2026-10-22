# Rules

The API structure is as follows:

```yaml
/api/v1
|---/player   POST
|---/game     POST
|   |---/:id  GET, PATCH
|---/match    WS
|   |---/:id  WS
```

1. All json keys must be in lower_case_with_underscores unless noted otherwise.
2. All variables inside a path are indicated with a colon (e.g., `/:id`) for documentation puposes only and should not be included in the actual call unless said otherwise. (e.g., `GET /api/v1/game/examplegameid`)
3. All paths marked with "WS" can be connected to by appending `/ws` to the path and using a standard WebSocket request followed by the server responding with a `101 Switching Protocols` (e.g., `/api/v1/match/ws`)
4. **Important**: all routes with methods other than `GET` are authenticated calls and a JWT must be provided by either using the `token` field (when using cURL for example) or through a `token` cookie (set automatically in the browser by the server as a secure http-only cookie) **except if not explicitly specified**.
5. **Important**: all `WS` calls are authenticated calls and a JWT must be provided **only** via a `token` cookie (set automatically in the browser by the server as a secure http-only cookie)
6. See [[API Specifications#/api/v1]]

---

# Routes

All routes start with:

## /api/v1

The root of the API.

### GET

Does not take any input and lists the available routes with their allowed methods, for example:

```json
{
	"available_routes": {
		"/player": ["POST"],
		"/game": ["POST"],
		"/game/:id": ["GET", "PATCH"],
		"/match/ws": ["WS"],
		"/match/:id/ws": ["WS"]
	}
}
```

#### Note

This also applies to all the routes with no `GET` or `WS` method specified.
For example, a `GET` request on `/game` will yield this output:

```json
{
	"available_routes": {
		"/game": ["POST"],
		"/game/:id": ["GET", "PATCH"]
	}
}
```

---

## /player

Sign-in and Sign-up route

### POST

Takes a username and a password as input, for example:

```json
{
	"username": "my_username",
	"password": "my_secret_passowrd"
}
```

If the `username` does not exists, then the account gets created with `201 Created`, else a `200 OK` is returned. And a JWT will get returned in both cases (sign-up/sign-in) with a `Set-Cookie: token=examplejwt; Secure; HttpOnly` header:

```json
{
	"player_id": "exampleplayerid", // may not be the same as the username
	"token": "examplejwt",
	"is_new_player": false
}
```

---

## /game

Singleplayer games route

### POST

Creates a new singleplayer game with the example following response:

```json
{
	"game_id": "examplegameid"
}
```

Then the client should redirect itself to `GET /api/v1/game/:id` (e.g., `GET /api/v1/game/examplegameid`)

---

## /game/:id

Singleplayer game interaction subroute

### GET

Takes a game id as input, for example:

```http
GET /api/v1/game/examplegameid
```

And returns the current state of the requested game, for example:

```jsonc
{
	"board": "XO-X--O--",
	"player_symbol": "X",
	"current_turn": "X",
	"winner": null, // "X" or "O" in case of a winner and "-" in case of a draw
}
```

### PATCH

Takes a game id in the path and the played move as the input body, for example:

```json
{
	"played_cell": 5
}
```

And returns the current state of the game, for example:

```json
{
	"board": "XO-XXOO--",
	"current_turn": "X",
	"winner": null
}
```

#### Errors

If the requested game was not found, the following message will be sent by the server with a `404 Not Found` regardless of the method:

```json
{
	"error": "game_not_found",
	"message": "Start a new game by calling POST on /api/v1/game"
}
```

---

## /match/ws

Multiplayer games route

### WebSocket

Opening a WebSocket to this route immediately joins the player to a multiplayer queue and the server matches the players using whichever method seems best (e.g., immediate match, skill-based matchmaking, delayed matchmaking, etc.) And once a match was created, players are sent a message like this:

```json
{
	"status": "matched",
	"game_id": "examplegameid"
}
```

Then the client should redirect itself to `GET /api/v1/game/:id` (e.g., `GET /api/v1/game/examplegameid`)

---

## /match/:id

Multiplayer game interaction subroute

### WebSocket

Opening a WebSocket to this route connects the player to the match with the id indicated by `:id` and the server starts off with a message like this:

```jsonc
{
	"board": "---------",
	"player_symbol": "X", // And the other player as "O"
	"current_turn": "X",
	"winner": null,
}
```

Then every played move is done by the player with the `current_turn` sending the following message to the server:

```json
{
	"played_cell": 5
}
```

Then the server must send the current state of the game to all the players in it, for example:

```jsonc
{
	"board": "XO-XXOO--",
	"current_turn": "X",
	"winner": null, // "X" or "O" in case of a winner and "-" in case of a draw
}
```

If the game was singleplayer, then the result is returned with the played computer move by the server.
But if it was a multiplayer game, then the result is returned with an indicator of the opponent turn, and the client must call GET every 3 seconds on the same path to get the current game state and check whether the opponent made their move.

#### Errors

If the requested game was not found, the following message will be sent by the server with a `404 Not Found` regardless of the method:

```json
{
	"error": "game_not_found",
	"message": "Start a new game by calling POST on /api/v1/game"
}
```
