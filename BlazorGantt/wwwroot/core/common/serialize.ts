export default function serialize(data: object | string) {
	if (typeof data === "string" || typeof data === "number") {
		return data;
	}

	let result = "";

	for (const key in data) {
		let serialized = "";
		if (data.hasOwnProperty(key)) {
			if (typeof data[key] === "string") {
				serialized = encodeURIComponent(data[key]);
			} else if (typeof data[key] === "number") {
				serialized = data[key];
			} else {
				serialized = encodeURIComponent(JSON.stringify(data[key]));
			}
			serialized = key + "=" + serialized;

			if (result.length) {
				serialized = "&" + serialized;
			}
			result += serialized;
		}
	}
	return result;
}
