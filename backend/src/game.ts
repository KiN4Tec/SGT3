import { CellState, getEmptyCells } from "sgt3-common"

export function playComputerMove(board: CellState[]): number | null {
	const empty_cells = getEmptyCells(board)

	if (empty_cells.length === 0) {
		return null // No moves possible
	}

	const played_cell_idx = Math.floor(Math.random() * empty_cells.length)
	return empty_cells[
		played_cell_idx === empty_cells.length ? empty_cells.length - 1 : played_cell_idx
	]
}
