/* Bayan Utilities */

/**
 * Make new Bayan object
 * @param {object} param
 * @param {string=} param.version - Bayan version
 * @param {string=} param.id - give Bayan an Id as your reference
 * @param {string=} param.language - Bayan language
 * @param {string=} param.apiKey - Bayan language
 * @param {string=} param.path - Bayan API path
 * @param {string=} param.statusPath - Status path
 * @param {string=} param.statusText - Status detail text
 * @param {object=} param.body - Body object
 * @return {object} - Bayan object
 * 
 * @example
 * makeBayan({id: "test123"});
 */
export function makeBayan({
	version = "bayan/1.0",
	id,
	language = "en-US",
	apiKey,
	path,
	statusPath = "status/ok",
	statusText,
	body
	} = {}) {					// argument is optional

	return {
		header: {
			version: "bayan/1.0",
			id: id,
			time: Date.now(),
			language: language,
			statusPath: statusPath || "status/ok",
			statusText: statusText
		},
		body: body
	}
}

