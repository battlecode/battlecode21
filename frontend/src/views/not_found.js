import React, { Component } from 'react';

class NotFound extends Component {
	
    render() {
    	const soupStyle = {
		    paddingBottom: "0",
	    	fontSize: "100px",
	    	marginBottom: "-30px",
		}

    	// display one of three random soup emojis :)
    	const rand = Math.floor(Math.random() * 3)
    	let soup_emoji = ""
    	switch (rand) {
    		case 0:
    			soup_emoji = "🍲"
    			break
    		case 1:
    			soup_emoji = "🥘"
    			break
    		case 2:
    			soup_emoji = "🍜"
    			break    			
    	}

        return (
            <div className="content">
                <p className="text-center" style={soupStyle}> {soup_emoji} </p>
                <h1 className="text-center">404 error</h1>
                <h5 className="text-center">Sorry, we couldn't find the page you were looking for!</h5>
            </div>
        );
    }
}

export default NotFound;