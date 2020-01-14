import React, { Component } from 'react';

class UpdateCard extends Component {
    /*
    a card that displays the time when its content was last updated
    default is to just show "time when it loaded" which is not automatically 
    updated/so not really ideal
    */

    constructor(props) {
        super(props);
        this.state = {'update_date': new Date()}; 
    }

    timeSince() {
        var seconds = Math.floor((new Date() - this.state.update_date) / 1000);

        var interval = Math.floor(seconds / 86400);
        if (interval > 1) return "Updated " + interval + " days ago.";
        interval = Math.floor(seconds / 3600);
        if (interval > 1) return "Updated " + interval + " hours ago.";
        interval = Math.floor(seconds / 60);
        if (interval > 1) return "Updated " + interval + " minutes ago.";
        //if (seconds <= 15) return "Just updated." 
        return "Updated " + Math.floor(seconds) + " seconds ago.";
    }

    getFooter() {
        return(
            <div className="footer">
                <hr />
                <div className="stats">
                    <i className="fa fa-history" /> { this.timeSince() }
                </div>
            </div>
        )
    }
}

export default UpdateCard