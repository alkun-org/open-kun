/**
 * Prayer times based on calculation
 * source: PrayTimes.org
 * Original developer: Hamid Zarrabi-Zadeh
 * url: http://praytimes.org/code/git/?a=tree&p=PrayTimes&hb=HEAD&f=v2/js
 */

import { makeBayan } from "https://raw.githubusercontent.com/alkun-org/open-kun/main/javascript/lib/bayan_util.js";

/* API */
export function main (request) {
    let body = request.body;

	if (body.setting) { // remap some variables
		let s = body.setting;
		if (s.adjustment) s.adjust = s.adjusment;
		if (s.timeOffset) s.offset = s.timeOffset;
		s.format = (s.militaryTime === true) ? "24h" : "12h";
	}

    const times = new PrayerTimes(body.setting || {})
        .getTimes(body.coordinate, body.date,
            body.timezone || 0,
            body.dst || 0);

	body = {
		times: times
	};
    return makeBayan(request, {body: body});
}


/* Implementation */
const TIMES = ["Imsak", "Fajr", "Sunrise", "Dhuhr", "Asr", "Sunset", "Maghrib", "Isha", "Midnight"];

const METHODS = {
    MWL: {
        name: "Muslim World League",
        params: { Fajr:18, Maghrib:"0 min", Isha:17, Midnight:"Standard" }
    },
    ISNA: {
        name: "Islamic Society of North America (ISNA)",
        params: { Fajr:15, Maghrib:"0 min", Isha:15, Midnight:"Standard" }
    },
    Egypt: {
        name: "Egyptian General Authority of Survey",
        params: { Fajr:19.5, Maghrib:"0 min", Isha:17.5, Midnight:"Standard" }
    },
    Makkah: { // Fajr was 19 degrees before 1430 hijri
        name: "Umm Al-Qura University, Makkah",
        params: { Fajr:18.5, Maghrib:"0 min", Isha:"90 min", Midnight:"Standard" }
    },
    Karachi: {
        name: "University of Islamic Sciences, Karachi",
        params: { Fajr:18, Maghrib:"0 min", Isha:18, Midnight:"Standard" }
    },
    Tehran: { // Isha is not explicitly specified in this method
        name: "Institute of Geophysics, University of Tehran",
        params: { Fajr:17.7, Isha:14, Maghrib:4.5, Midnight:"Jafari" }
    },
    Jafari: {
        name: "Shia Ithna-Ashari, Leva Institute, Qum",
        params: { Fajr:16, Isha:14, Maghrib:4, Midnight:"Jafari" }
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
            Imsak    : "10 min",
            Dhuhr    : "0 min",
            Asr      : "Standard",
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
			Imsak: 5, Fajr: 5, Sunrise: 6, Dhuhr: 12,
			Asr: 13, Sunset: 18, Maghrib: 18, Isha: 18
		};
    
		for (let i=1 ; i <= this.numIterations; i++) this.computePrayerTimes(times, ctx);
		this.adjustTimes(times, ctx);

		// add Midnight time
		times.Midnight = (this.cfg.Midnight == "Jafari") ?
				times.Sunset+ this.timeDiff(times.Sunset, times.Fajr)/ 2 :
				times.Sunset+ this.timeDiff(times.Sunset, times.Sunrise)/ 2;

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

    	//sun angle for Sunset/Sunrise
		const angle = 0.0347* Math.sqrt(ctx.elev); // an approximation
		const riseSetAngle = 0.833 + angle;
    
		times.Imsak   = this.sunAngleTime(this.eval(this.cfg.Imsak), times.Imsak, ctx, "ccw");
		times.Fajr    = this.sunAngleTime(this.eval(this.cfg.Fajr), times.Fajr, ctx, "ccw");
		times.Sunrise = this.sunAngleTime(riseSetAngle, times.Sunrise, ctx, "ccw");
		times.Dhuhr   = this.midDay(times.Dhuhr, ctx);
		times.Asr     = this.asrTime(times.Asr, ctx);
		times.Sunset  = this.sunAngleTime(riseSetAngle, times.Sunset, ctx);
		times.Maghrib = this.sunAngleTime(this.eval(this.cfg.Maghrib), times.Maghrib, ctx);
		times.Isha    = this.sunAngleTime(this.eval(this.cfg.Isha), times.Isha, ctx);
	}

	adjustTimes(times, ctx) {
		for (let i in times)
			times[i] += ctx.tz - ctx.lon / 15;

		if (this.cfg.highLats != "None") this.adjustHighLats(times);

		if (this.isMin(this.cfg.Imsak))
			times.Imsak = times.Fajr- this.eval(this.cfg.Imsak)/ 60;
		if (this.isMin(this.cfg.Maghrib))
			times.Maghrib = times.Sunset+ this.eval(this.cfg.Maghrib)/ 60;
		if (this.isMin(this.cfg.Isha))
			times.Isha = times.Maghrib+ this.eval(this.cfg.Isha)/ 60;
        times.Dhuhr += this.eval(this.cfg.Dhuhr)/ 60;
	}

	/* adjust times for locations in higher latitudes */
	adjustHighLats(times) {
		const nightTime = this.timeDiff(times.Sunset, times.Sunrise);

		times.Imsak = this.adjustHLTime(times.Imsak, times.Sunrise, this.eval(this.cfg.Imsak), nightTime, "ccw");
		times.Fajr  = this.adjustHLTime(times.Fajr, times.Sunrise, this.eval(this.cfg.Fajr), nightTime, "ccw");
		times.Isha  = this.adjustHLTime(times.Isha, times.Sunset, this.eval(this.cfg.Isha), nightTime);
		times.Maghrib = this.adjustHLTime(times.Maghrib, times.Sunset, this.eval(this.cfg.Maghrib), nightTime);
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
        let factor = { Standard: 1, Hanafi: 2 }[this.cfg.Asr];
		factor = factor || this.eval(this.cfg.Asr);

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
