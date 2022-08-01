/* Bayan Utilities */

/**
 * Make new Bayan object
 * @param {object} request - request object
 * @param {object} param
 * @param {string=} param.identifier - Give an identifier as your message reference
 * @param {string=} param.inLanguage - in which language?
 * @param {string=} param.apiKey - API key
 * @param {string=} param.url - Bayan API URL
 * @param {string=} param.status - Status URL / text
 * @param {object=} param.body - Body object
 * @return {object} - Bayan object
 * 
 * @example
 * makeBayan(request, {status: "/status/ok"});
 */
export function makeBayan(request, {
	identifier,
	inLanguage = "en-US",
	apiKey,
	url,
	status = "/status/ok",
	body
	} = {}) {

	if (!request) request = {};

	return {
		identifier: request.identifier || identifier,
		inLanguage: request.inLanguage || inLanguage,
		url: request.url || url,
		dateSent: new Date().toISOString(),
		status: status || "/status/ok",
		body: body
	}
}
