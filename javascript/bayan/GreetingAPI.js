/**
 * Example Bayan API
 * Only export Path handlers
 * Use makeBayan for standardized Bayan Object
 */

import { makeBayan } from "https://raw.githubusercontent.com/alkun-org/open-kun/main/javascript/lib/bayan_util.js";

/* "/" ponts to handler main (default) */
export function main (request) {
    const body = {
        text: "Marhaba!"
    };
    return makeBayan(request, {body: body});
}

/* "sunnah" points to handler sunnah  */
export function sunnah (request) {
    const body = {
        text: "Assalam Alaykum!"
    };
    return makeBayan({request, body: body});
}

/* "sunnah/morning" points to handler sunnah_morning  */
export function sunnah_morning (request) {
    const body = {
        text: "Assalam Alaykum, Sabah Al Khair!"
    };
    return makeBayan(request, {body: body});
}