import React, { Component } from 'react';
import Api from '../api';

class Tournament extends Component {
    render() {
        return (
            <div className="accordion" id={ this.props.name }>
                <div className="card">
                    <div className="card-header">
                        <h5 className="mb-0">
                            <button className="btn btn-default btn-block collapsed" type="button" data-toggle="collapse" data-target={ '#' + this.props.name + '0'}>
                                { this.props.name.charAt(0).toUpperCase() + this.props.name.slice(1) } Tournament Bracket
                            </button>
                        </h5>
                    </div>
                    <div id={ this.props.name + '0' } className="collapse" data-parent={ '#' + this.props.name } style={{ 'margin-top':'-1em' }}>
                        <div className="card-body">
                            <iframe title={ this.props.challonge } src={"https://challonge.com/" + this.props.challonge + "/module"} width="100%" height="400px" frameborder="0" scrolling="auto" allowtransparency="true"></iframe>
                        </div>
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
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Tournament Schedule</h4>
                                </div>
                                <div className="content">
                                    <p>
                                        Battlecode 2020 will consist of six tournaments:
                                    </p>
                                    <p>
                                        <ul>
                                            <li>
                                                <b>Sprint Tournament.</b> January smth. Everyone is eligible. Deadline to submit code: 8pm smth.
                                            </li>
                                            <li>
                                                <b>Seeding Tournament.</b> January smth. Everyone is eligible. Deadline to submit code: 8pm smth.
                                            </li>
                                            <li>
                                                <b>Qualifying Tournament.</b> January smth. Everyone is eligible. 
                                            </li>
                                            <li>
                                                <b>Newbie Tournament.</b> January smth. Everyone is eligible.
                                            </li>
                                            <li>
                                                <b>High School Tournament.</b> January smth. Everyone is eligible.
                                            </li>
                                            <li>
                                                <b>Final Tournament.</b> January smth. Everyone is eligible.
                                            </li>
                                        </ul>

                                        This page will be updated with the brackets for each of the tournaments.
                                       </p> 

<p>
Even if you miss earlier tournaments, you can participate in later tournaments (except the Final Tournament). 
This includes the Qualifying Tournament - you can participate even if you miss every other tournament.
</p>

                                </div>
                            </div>
{/* 
                            { this.state.tournaments.map(t => 
                                <Tournament name={ t.name } challonge={ t.challonge } />
                            )} */}

                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Tournament Format</h4>
                                </div>
                                <div className="content">
                                    <p>
Scrimmage rankings will be used to determine seeds for the Sprint and Seeding Tournaments. For all other tournaments, results from the previous tournament will be used to seed teams.
</p><p>
Tournaments will be in a double elimination format, with the exception of the Sprint Tournament, which is single elimination. The Final Tournament will start with a blank slate (any losses from the Qualifying Tournament are reset).
</p><p>
Each match within a tournament will consist of 3 games on 3 different maps, and the team that wins the most games will advance. 

                                    </p>

                                </div>
                            </div>

                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Eligibility Rules</h4>
                                </div>
                                <div className="content">
                                    <p>
Teams must consist entirely of active students to be eligible for the Seeding, Qualifying, and Final Tournaments. An active student is a person who is currently enrolled as a full-time student in an eligible degree or certificate program. As an exception, we consider those transitioning immediately after high school and formally committed to such a program to be active students, including those taking gap years or in compulsory military service.
</p><p>
Active students also include those who are currently in high school (or some equivalent of secondary education or lower). Active MIT students who have never competed in Battlecode before (submitted a bot) are eligible for the Newbie Tournament. U.S. high school students and earlier are eligible for the High School Tournament.

</p><p>
Teams consisting entirely of US students compete in the US Qualifying Tournament. If your team has at least one non-US competitor, your team will compete in the International Qualifying Tournament. A US student is a student who attends a school in the United States.

</p><p>
If your team does not consist of active students, you may still compete in Battlecode for fun! All teams are allowed to scrimmage, and compete in the Sprint Tournament or any other bonus tournaments we may decide to hold. Contact us if you are unsure of your eligibility.



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