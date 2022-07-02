/**
 * Prayer times based on calculation
 * source: PrayTimes.org
 * Original developer: Hamid Zarrabi-Zadeh
 * url: http://praytimes.org/code/git/?a=tree&p=PrayTimes&hb=HEAD&f=v2/js
 */

import { makeBayan } from "https://raw.githubusercontent.com/alkun-org/open-kun/main/javascript/lib/bayan_util.js";

/* API */
export function main (ask) {
    let body = ask.body;
    const times = new PrayerTimes(body.config || {})
        .getTimes(body.coordinate, body.date,
            body.timezone || 0,
            body.dst || 0);

	body = {
		times: times
	};
    return makeBayan({body: body});
}


/* Implementation */
const TIMES = ["imsak", "fajr", "sunrise", "dhuhr", "asr", "sunset", "maghrib", "isha", "midnight"];

const METHODS = {
    MWL: {
        name: "Muslim World League",
        params: { fajr:18, maghrib:"0 min", isha:17, midnight:"Standard" }
    },
    ISNA: {
        name: "Islamic Society of North America (ISNA)",
        params: { fajr:15, maghrib:"0 min", isha:15, midnight:"Standard" }
    },
    Egypt: {
        name: "Egyptian General Authority of Survey",
        params: { fajr:19.5, maghrib:"0 min", isha:17.5, midnight:"Standard" }
    },
    Makkah: { // fajr was 19 degrees before 1430 hijri
        name: "Umm Al-Qura University, Makkah",
        params: { fajr:18.5, maghrib:"0 min", isha:"90 min", midnight:"Standard" }
    },
    Karachi: {
        name: "University of Islamic Sciences, Karachi",
        params: { fajr:18, maghrib:"0 min", isha:18, midnight:"Standard" }
    },
    Tehran: { // isha is not explicitly specified in this method
        name: "Institute of Geophysics, University of Tehran",
        params: { fajr:17.7, isha:14, maghrib:4.5, midnight:"Jafari" }
    },
    Jafari: {
        name: "Shia Ithna-Ashari, Leva Institute, Qum",
        params: { fajr:16, isha:14, maghrib:4, midnight:"Jafari" }
    }
};

/**
 * Prayer times generator
 * @class
 * @example
 * let times = new PrayerTimes({method:"ISNA"}).getTimes("3.140853, 101.693207", "2022-07-01", 8);
 */
export class PrayerTimes {

    /**
     * Create object
     * @class
     * @param {object} param
     * @param {string=} param.method - Predefined settings from METHODS
     * @param {object=} param.adjust - Change any parameters here
     * @param {object=} param.offset - Apply offset to calculated times
     * @param {string=} param.format - Result format in either "24h" or "12h", omit will return float times
     */
    constructor({
        method = "MWL",
        adjust,
        offset,
        format = "24h"
        } = {}) {

        this.cfg = Object.assign({
            imsak    : "10 min",
            dhuhr    : "0 min",
            asr      : "Standard",
            highLats : "NightMiddle"
        }, METHODS[method].params);

        if (adjust !== undefined) Object.assign(this.cfg, adjust); 
        if (format !== undefined) this.cfg.format = format;
        this.offset = offset;
        this.numIterations = 1;
    }

    /**
     * Get times
     * @param {string|number[]} coord - Coordinate, eg: "latitude,longitude"
     * @param {string|number[]} date - ISO 8601 string, eg: 2022-07-01
     * @param {number} timezone - Timezone hours
     * @param {number} dst - Daylight Saving Time, 0 or 1
     * @return {object} - Generated times
     */
    getTimes(coord, date, timezone, dst) {
        /* initialize */
        let offset = {};
        for (let i in TIMES) offset[TIMES[i]] = 0;
        if (this.offset !== undefined) Object.assign(offset, this.offset);

        if (typeof coord === "string") coord = coord.split(",").map(Number);
        if (typeof date === "string") date = date.split("-").map(Number);

        let ctx = {
		    lat: 1 * coord[0],
		    lon: 1 * coord[1],
		    elev: coord[2] ? 1 * coord[2] : 0,
            dt: date,
            tz: 1 * timezone + (1 * dst ? 1 : 0)
        };
        if (typeof x === "string") x = x.split(",").map(Number);

        // get julian date
        ctx.jDate = this.julian(ctx.dt[0], ctx.dt[1], ctx.dt[2]) - ctx.lon / (15 * 24);

        // compute prayer times
		// default times
		let times = {
			imsak: 5, fajr: 5, sunrise: 6, dhuhr: 12,
			asr: 13, sunset: 18, maghrib: 18, isha: 18
		};
    
		for (let i=1 ; i <= this.numIterations; i++) this.computePrayerTimes(times, ctx);
		this.adjustTimes(times, ctx);

		// add midnight time
		times.midnight = (this.cfg.midnight == "Jafari") ?
				times.sunset+ this.timeDiff(times.sunset, times.fajr)/ 2 :
				times.sunset+ this.timeDiff(times.sunset, times.sunrise)/ 2;

	    // apply offsets to the times
		for (let i in times) times[i] += offset[i] / 60;

        if (this.cfg.format !== undefined) { // 12h / 24h
            for (let i in times) times[i] = this.formatTime(times[i]);
        }

        return times;
	}

	/* convert float time to the given format */
	formatTime(time) {
		if (isNaN(time)) return undefined;
		const suffixes = ["am", "pm"];

		time = DMATH.fixHour(time + 0.5 / 60);  // add 0.5 minutes to round
		const hours = Math.floor(time);
		const minutes = Math.floor((time - hours) * 60);
		const suffix = (this.cfg.format == "12h") ? suffixes[hours < 12 ? 0 : 1] : "";
		const hour = (this.cfg.format == "24h") ? this.twoDigitsFormat(hours) : ((hours + 12 - 1) % 12 + 1);
		return hour + ":" + this.twoDigitsFormat(minutes) + (suffix ? " " + suffix : "");
	}

	/* compute prayer times at given julian date */
	computePrayerTimes(times, ctx) {
	    // convert hours to day portions
		for (let i in times) times[i] /= 24;

    	//sun angle for sunset/sunrise
		const angle = 0.0347* Math.sqrt(ctx.elev); // an approximation
		const riseSetAngle = 0.833 + angle;
    
		times.imsak   = this.sunAngleTime(this.eval(this.cfg.imsak), times.imsak, ctx, "ccw");
		times.fajr    = this.sunAngleTime(this.eval(this.cfg.fajr), times.fajr, ctx, "ccw");
		times.sunrise = this.sunAngleTime(riseSetAngle, times.sunrise, ctx, "ccw");
		times.dhuhr   = this.midDay(times.dhuhr, ctx);
		times.asr     = this.asrTime(times.asr, ctx);
		times.sunset  = this.sunAngleTime(riseSetAngle, times.sunset, ctx);
		times.maghrib = this.sunAngleTime(this.eval(this.cfg.maghrib), times.maghrib, ctx);
		times.isha    = this.sunAngleTime(this.eval(this.cfg.isha), times.isha, ctx);
	}

	adjustTimes(times, ctx) {
		for (let i in times)
			times[i] += ctx.tz - ctx.lon / 15;

		if (this.cfg.highLats != "None") this.adjustHighLats(times);

		if (this.isMin(this.cfg.imsak))
			times.imsak = times.fajr- this.eval(this.cfg.imsak)/ 60;
		if (this.isMin(this.cfg.maghrib))
			times.maghrib = times.sunset+ this.eval(this.cfg.maghrib)/ 60;
		if (this.isMin(this.cfg.isha))
			times.isha = times.maghrib+ this.eval(this.cfg.isha)/ 60;
        times.dhuhr += this.eval(this.cfg.dhuhr)/ 60;
	}

	/* adjust times for locations in higher latitudes */
	adjustHighLats(times) {
		const nightTime = this.timeDiff(times.sunset, times.sunrise);

		times.imsak = this.adjustHLTime(times.imsak, times.sunrise, this.eval(this.cfg.imsak), nightTime, "ccw");
		times.fajr  = this.adjustHLTime(times.fajr, times.sunrise, this.eval(this.cfg.fajr), nightTime, "ccw");
		times.isha  = this.adjustHLTime(times.isha, times.sunset, this.eval(this.cfg.isha), nightTime);
		times.maghrib = this.adjustHLTime(times.maghrib, times.sunset, this.eval(this.cfg.maghrib), nightTime);
	}

	/* adjust a time for higher latitudes */
	adjustHLTime(time, base, angle, night, direction) {
		const portion = this.nightPortion(angle, night);
		const timeDiff = (direction == "ccw") ?
			this.timeDiff(time, base):
			this.timeDiff(base, time);
		if (isNaN(time) || timeDiff > portion)
			time = base + (direction == "ccw" ? -portion : portion);
		return time;
	}

	/* convert Gregorian date to Julian day
	Ref: Astronomical Algorithms by Jean Meeus */
	julian(year, month, day) {
		if (month <= 2) {
			year -= 1;
			month += 12;
		};
		const a = Math.floor(year / 100);
		const b = 2 - a + Math.floor(a / 4);
		return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
	}

	/* compute mid-day time */
	midDay(time, ctx) {
		const eqt = this.sunPosition(ctx.jDate + time).equation;
		const noon = DMATH.fixHour(12 - eqt);
		return noon;
	}

    /* compute the time at which sun reaches a specific angle below horizon */
	sunAngleTime(angle, time, ctx, direction) {
		const decl = this.sunPosition(ctx.jDate + time).declination;
		const noon = this.midDay(time, ctx);
		const t = 1/15 * DMATH.arccos((-DMATH.sin(angle) - DMATH.sin(decl) * DMATH.sin(ctx.lat)) /
				(DMATH.cos(decl) * DMATH.cos(ctx.lat)));

        return noon + (direction == "ccw" ? -t : t);
	}

	/* compute asr time */
	asrTime(time, ctx) {
        // get shadow factor
        let factor = { Standard: 1, Hanafi: 2 }[this.cfg.asr];
		factor = factor || this.eval(this.cfg.asr);

        // compute
        const decl = this.sunPosition(ctx.jDate + time).declination;
		const angle = -DMATH.arccot(factor + DMATH.tan(Math.abs(ctx.lat - decl)));
        return this.sunAngleTime(angle, time, ctx);
	}

	/* compute declination angle of sun and equation of time
	Ref: http://aa.usno.navy.mil/faq/docs/SunApprox.php */
	sunPosition(jd) {
		const D = jd - 2451545.0;
		const g = DMATH.fixAngle(357.529 + 0.98560028* D);
		const q = DMATH.fixAngle(280.459 + 0.98564736* D);
		const L = DMATH.fixAngle(q + 1.915* DMATH.sin(g) + 0.020* DMATH.sin(2*g));

		const R = 1.00014 - 0.01671* DMATH.cos(g) - 0.00014* DMATH.cos(2*g);
		const e = 23.439 - 0.00000036* D;

		const RA = DMATH.arctan2(DMATH.cos(e)* DMATH.sin(L), DMATH.cos(L))/ 15;
		const eqt = q/15 - DMATH.fixHour(RA);
		const decl = DMATH.arcsin(DMATH.sin(e)* DMATH.sin(L));

		return {declination: decl, equation: eqt};
	}

	/* the night portion used for adjusting times in higher latitudes */
	nightPortion(angle, night) {
		const method = this.cfg.highLats;
		const portion = 1/2 // MidNight
		if (method == "AngleBased") portion = 1/60 * angle;
		if (method == "OneSeventh") portion = 1/7;
		return portion * night;
	}

	/* convert given string into a number */
	eval(str) {
		return 1 * (str + "").split(/[^0-9.+-]/)[0];
	}

	/* detect if input contains "min" */
	isMin(arg) {
		return (arg+ "").indexOf("min") != -1;
	}

	/* compute the difference between two times */
	timeDiff(time1, time2) {
		return DMATH.fixHour(time2 - time1);
	}

	/* add a leading 0 if necessary */
	twoDigitsFormat(num) {
		return (num <10) ? "0"+ num : num;
	}

}

/* Degree-Based Math */
const DMATH = {
	dtr: function(d) { return (d * Math.PI) / 180.0; },
	rtd: function(r) { return (r * 180.0) / Math.PI; },

	sin: function(d) { return Math.sin(this.dtr(d)); },
	cos: function(d) { return Math.cos(this.dtr(d)); },
	tan: function(d) { return Math.tan(this.dtr(d)); },

	arcsin: function(d) { return this.rtd(Math.asin(d)); },
	arccos: function(d) { return this.rtd(Math.acos(d)); },
	arctan: function(d) { return this.rtd(Math.atan(d)); },

	arccot: function(x) { return this.rtd(Math.atan(1/x)); },
	arctan2: function(y, x) { return this.rtd(Math.atan2(y, x)); },

	fixAngle: function(a) { return this.fix(a, 360); },
	fixHour:  function(a) { return this.fix(a, 24 ); },

	fix: function(a, b) {
		a = a- b* (Math.floor(a/ b));
		return (a < 0) ? a+ b : a;
	}
};
