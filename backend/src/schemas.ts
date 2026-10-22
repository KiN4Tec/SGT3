import z from "zod"

import { GAME_ID_LENGTH } from "@/env"

const Schema = {
	Auth: {
		ALL: z.object({
			token: z
				.string({ error: "token_must_be_string" })
				.nonoptional({ error: "token_is_required" }),
		}),
	},
	Game: {
		ID: {
			GET: z.object({
				id: z
					.string({ error: "game_id_must_be_string" })
					.length(GAME_ID_LENGTH, {
						error: `game_id_length_must_be_exactly_${GAME_ID_LENGTH}`,
					})
					.nonoptional({ error: "id_is_required" }),
			}),
			PATCH: {
				params: z.object({
					id: z
						.string({ error: "id_must_be_string" })
						.length(GAME_ID_LENGTH, {
							error: `id_length_must_be_exactly_${GAME_ID_LENGTH}`,
						})
						.nonoptional({ error: "id_is_required" }),
				}),
				body: z.object({
					played_cell: z
						.number({ error: "played_cell_must_be_number" })
						.int({ error: "played_cell_must_be_integer" })
						.nonnegative({ error: `played_cell_must_be_nonnegative` })
						// Max is checked after retrieving board size from cache
						.nonoptional({ error: "played_cell_is_required" }),
				}),
			},
		},
	},
	Match: {
		ID: {
			GET: z.object({
				id: z
					.string({ error: "id_must_be_string" })
					.length(GAME_ID_LENGTH, {
						error: `id_length_must_be_exactly_${GAME_ID_LENGTH}`,
					})
					.nonoptional({ error: "id_is_required" }),
			}),
			WS: z.object({
				played_cell: z
					.number({ error: "played_cell_must_be_number" })
					.int({ error: "played_cell_must_be_integer" })
					.nonnegative({ error: `played_cell_must_be_nonnegative` })
					// Max is checked after retrieving board size from cache
					.nonoptional({ error: "played_cell_is_required" }),
			}),
		},
	},
	Player: {
		POST: z.object({
			username: z
				.string({ error: "username_must_be_string" })
				.min(3, { error: "username_length_under_3" })
				.max(18, { error: "username_length_over_18" })
				.regex(/^[a-zA-Z0-9]+$/)
				.nonoptional({ error: "username_is_required" }),

			password: z
				.string({ error: "password_must_be_string" })
				.min(8, { error: "password_length_must_be_between_8_and_128" })
				.max(128, { error: "password_length_must_be_between_8_and_128" })
				.nonoptional({ error: "password_is_required" }),
		}),
	},
}

export default Schema
