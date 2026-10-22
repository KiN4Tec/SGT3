export type UserRecord = {
	player_id: string
	username: string
	password_hash: string
}

export function bufToHex(buffer: Uint8Array): string {
	return [...buffer].map((b) => b.toString(16).padStart(2, "0")).join("")
}

export function hexToBuf(hex_string: string) {
	const matches = hex_string.match(/.{1,2}/g)
	if (!matches) return null
	return new Uint8Array(matches.map((byte) => parseInt(byte, 16)))
}
