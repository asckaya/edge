const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function encodeUtf8Base64(input: string): string {
	const bytes = new TextEncoder().encode(input);
	let output = "";

	for (let index = 0; index < bytes.length; index += 3) {
		const first = bytes[index];
		const second = bytes[index + 1];
		const third = bytes[index + 2];
		const chunk = ((first ?? 0) << 16) | ((second ?? 0) << 8) | (third ?? 0);

		output += BASE64_ALPHABET[(chunk >> 18) & 63];
		output += BASE64_ALPHABET[(chunk >> 12) & 63];
		output += second === undefined ? "=" : BASE64_ALPHABET[(chunk >> 6) & 63];
		output += third === undefined ? "=" : BASE64_ALPHABET[chunk & 63];
	}

	return output;
}
