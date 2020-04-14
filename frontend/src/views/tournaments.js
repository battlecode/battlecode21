import React, { Component } from 'react';
import Api from '../api';
import { NavLink } from 'react-router-dom';

class Tournament extends Component {
    render() {
        return (<div>
<p dangerouslySetInnerHTML={{__html: this.props.blurb}}>
            </p>
                        <h5 className="mb-0">
                            <button className="btn btn-default btn-block collapsed" type="button" data-toggle="collapse" data-target={ '#' + this.props.name.replace(' ','') + '0'}>
                                { this.props.name.charAt(0).toUpperCase() + this.props.name.slice(1) } Tournament Bracket
                            </button>
                        </h5>
                    <div id={ this.props.name.replace(' ','') + '0' } className="collapse" data-parent={ '#' + this.props.name } style={{ 'margin-top':'-1em' }}>
                        <div className="card-body">
                            <iframe title={ this.props.challonge } src={this.props.challonge + "/module"} width="100%" height="400px" frameborder="0" scrolling="auto" allowtransparency="true"></iframe>
                        </div>
                    </div>
                    </div>
        );
    }
}

class Tournaments extends Component {
    constructor() {
        super();
        this.state = {'tournaments':[]};
    }

    componentDidMount() {
        Api.getTournaments(function(t) {
            this.setState({tournaments:t});
        }.bind(this));
    }

    render() {
        return (
            <div className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-12">
            <div className="accordion" id={ this.props.name }>
                <div className="card">
                                <div className="header">
                                    <h4 className="title">Tournaments</h4>
                                </div>

                                <div className="content">
            <p>To view the replays
            associated with a particular match, click on "Attachments" next to it (while hovering over the match).
    </p>
                            { this.state.tournaments.map(t => 
                                <Tournament name={ t.name } challonge={ t.bracket_link } blurb = {t.blurb} />
                            )}
                                </div>
                                </div>
                                </div>


                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Tournament Schedule</h4>
                                </div>
                                <div className="content">

                                    <p>
                                        Battlehack 2020 will consist of one tournament at the end of the week-long event! We will stream and commentate this tournament.
                                    </p>
                                    <p>
                                        The deadline to submit code for this final tournament is <b>Wednesday, April 22nd at 8 pm EDT</b>.
                                       </p> 


                                </div>
                            </div>


                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Tournament Format</h4>
                                </div>
                                <div className="content">
                                    <p>
                                        Battlehack 2020 tournament info coming soon!
                                    </p>
                                </div>
                            </div>




                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Prizes</h4>
                                </div>
                                <div className="content">
                                    <p>
                                        Final prize amounts are coming soon! Prizes will include rewards for some L33t h4ck3rs...
                                    </p>

                                </div>
                            </div>



                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Eligibility Rules</h4>
                                </div>
                                <div className="content">
                                    <p>
Anyone is welcome to participate in Battlecode! Anyone can write a bot, create a team and participate in the tournament. 
</p><p>
Eligibility for certain prize categories is coming soon...
</p><p>
Contact us on <a href='https://discordapp.com/channels/386965718572466197/650097270804709436'>Discord</a> or at <a href='mailto:battlecode@mit.edu'>battlecode@mit.edu</a> if you are unsure of your eligibility.
                                    </p>

                                </div>
                            </div>


                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Tournaments;
