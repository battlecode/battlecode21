import React, { Component } from 'react';

/* a component for displaying a user or teams avatar (used on team and user pages)
 * props: data — either user or team, used to get avatar or seed for random generation.
 *				 if data does not have either name or username defined, empty avatar will be returned */
class Avatar extends Component {

	// seeded random numbers bc this isn't part of math.random in js
	seededRNG(seed, min = 0, max = 1, depth = 0) {
		//hashing seed to try to remove correlation
		const hashSeed = (seed * 2654435761) % Math.pow(2,32)
		// see softwareengineering.stackexchange.com/questions/260969
		const modSeed = (hashSeed * 9301 + 49297) % 233280
		const rand = modSeed / 233280
		const randBound = min + rand * (max - min)
		
		// run this 3 times to remove correlation!
		if (depth == 2) {
			return min + rand * (max - min)
		} else {
			return this.seededRNG(randBound, min, max, depth + 1)
		}
	}

	// converts colors from HSV to RGB encoding
	// adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB_alternative
	HSVtoRGB(hsv) {

		const func = (n, hsv) => {
			let k = (n + hsv[0] / 60) % 6
			return Math.round((hsv[2] - hsv[2]*hsv[1]*Math.max(Math.min(k, 4-k, 1), 0)) * 255)
		} 
		return [func(5, hsv), func(3, hsv), func(1, hsv)]
	}


	// converts colors from RGB to hex string ('#xxxxxx')
	RGBtoHex(rgb) {
		const hex = (comp) => {
			var str = comp.toString(16)
			return str.length == 1 ? '0' + str : str
		}
		return `#${hex(rgb[0])}${hex(rgb[1])}${hex(rgb[2])}`
	}

	render() {
		const data = this.props.data
		const avatar = data.avatar
		if (avatar) {
			// avatar is defined
			return ( <img className="avatar border-gray" src={ avatar } alt="Avatar" /> )
		} else {
			if (!data.name && !data.username){
				// data not fully loaded, return placeholder
				return ( <div className="avatar border-gray" style={ {display: 'inline-block'} }></div> )
			}

			// no avatar, create a random one. which must always be same for this entity
			// random number derived from hash of str defines HSV color (rand°, 100%, 100%)
			// second random number is transparent "accent color"
			
			const seedStr = this.stringHash(data.name ? data.name : data.username)
			const num = Math.floor(this.seededRNG(seedStr, 0, 361))
			console.log(num)
			const colorStr = this.RGBtoHex(this.HSVtoRGB([num, 1, 1]))
			const num2 = Math.floor(this.seededRNG(data.id, 0, 361))
			const colorStr2 = this.RGBtoHex(this.HSVtoRGB([num2, 1, 1])) + "50"

			const gradStr = `linear-gradient(45deg, ${colorStr}, ${colorStr2})`

			return ( <div className="avatar border-gray" style={ {background: gradStr, display: 'inline-block'} }></div> )
		}

	}

	// gives numerical hash for string (stackoverflow.com/questions/7616461/)
	stringHash(str) {
		let hash = 0, chr

		if (str.length === 0) return hash

		for (let i = 0; i < str.length; i++) {
			chr = str.charCodeAt(i)
			hash = ((hash << 5) - hash) + chr
			hash |= 0 // Convert to 32bit integer
		}

		return Math.abs(hash)
	}
}

export default Avatar