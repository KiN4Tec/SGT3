<script lang="ts">
	import { CellState, parseBoard } from "sgt3-common"

	let props: {
		side_length: number
		board_state: string
		on_cell_click: (cell_number: number) => void
	} = $props()

	let board = $derived(parseBoard(props.board_state))
</script>

<table class="Board">
	<tbody>
		{#each { length: props.side_length } as _, row_idx}
			<tr>
				{#each { length: props.side_length } as _, col_idx}
					{@const cell_idx = row_idx * props.side_length + col_idx}
					<td>
						<button
							title={`Cell ${cell_idx}`}
							disabled={board[cell_idx] !== CellState.Empty}
							class:ex={board[cell_idx] === CellState.EX}
							class:oh={board[cell_idx] === CellState.OH}
							onclick={() => props.on_cell_click(cell_idx)}
						></button>
					</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>

<style lang="scss">
	.Board {
		background-color: rgb(236, 237, 242);
		border-radius: 24px;

		button {
			min-width: 100px;
			height: 100px;
			margin: 20px;
			padding: 0;
			font-size: 48px;

			border: none;
			border-radius: 24px;

			// Neomorphic Buttons

			background: linear-gradient(145deg, #f0f0f0, #cacaca);
			box-shadow:
				8px 8px 12px #c3c3c3,
				-8px -8px 12px #fdfdfd;

			&:hover {
				transform: none;
			}

			&:active:not(.ex):not(.oh) {
				background: linear-gradient(145deg, #cacaca, #f0f0f0);
			}

			&.ex {
				cursor: default;

				background: linear-gradient(145deg, #cb4848, #f25656);
				box-shadow:
					5px 5px 10px #c54646,
					-5px -5px 10px #ff5a5a;

				&::after {
					content: "X";
					color: #810202;
				}
			}

			&.oh {
				cursor: default;

				background: linear-gradient(145deg, #35d18d, #3ff8a8);
				box-shadow:
					5px 5px 10px #33ca89,
					-5px -5px 10px #43ffb1;

				&::after {
					content: "O";
					color: #02814e;
				}
			}
		}
	}
</style>
