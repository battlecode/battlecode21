import React, { Component } from 'react';
import Api from '../api';
import { NavLink } from 'react-router-dom';

class Tournament extends Component {
    render() {
        return (<div>
<p dangerouslySetInnerHTML={{__html: this.props.blurb}}>
            </p>
                        <h5 className="mb-0">
                            <button className="btn btn-default btn-block collapsed" type="button" data-toggle="collapse" data-target={ '#' + this.props.name + '0'}>
                                { this.props.name.charAt(0).toUpperCase() + this.props.name.slice(1) } Tournament Bracket
                            </button>
                        </h5>
                    <div id={ this.props.name + '0' } className="collapse" data-parent={ '#' + this.props.name } style={{ 'margin-top':'-1em' }}>
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
                                        Battlecode 2020 will consist of seven tournaments throughout the month! We stream and commentate all tournaments online. We ~might~ also have some extra (for-fun) tournaments.
                                    </p>
                                    <p>
                                        <ul>
                                            <li>
                                                <b>Sprint Tournament: 1/14.</b> One week after spec release, you're given a chance to win small prizes in this tournament. The goal is to get an idea of the meta-game, and a chance to test your bot prototypes.
                                            </li>
                                            <li>
                                                <b>Seeding Tournament: 1/21.</b> One week after the Sprint Tournament, this tournament determines your positioning in the Qualifying Tournament.
                                            </li>
                                            <li>
                                                <b>International Qualifying Tournament: 1/24.</b>                                           This tournament determines the <i>4 international teams</i> that will qualify for the Final Tournament.
                                                 </li>
                                            <li>
                                                <b>US Qualifying Tournament: 1/28.</b>                                           This tournament determines the <i>12 US-based teams</i> that will qualify for the Final Tournament.
                                                 </li>
                                            <li>
                                                <b>Newbie Tournament: 1/30.</b> The top newbie teams compete for a smaller prize pool. The final match between the top 2 teams will be run at the Final Tournament.
                                            </li>
                                            <li>
                                                <b>High School Tournament: 1/30.</b> The top high school teams compete for a smaller prize pool. Like the Newbie Tournament, the final match will be run at the Final Tournament.
                                            </li>
                                            <li>
                                                <b>Final Tournament: 2/1.</b> The top 16 teams, as determined by the qualifying tournaments, compete for glory, fame and a big prize pool. The tournament will take place live, at 7 pm in MIT's 32-155 (and will of course be streamed online). All finalist teams will be invited to MIT.
                                            </li>
                                        </ul>
                                        The deadline to submit code for each tournament is 7 pm EST <i>the day before</i> the tournament. For the Final Tournament, the deadline to submit code is 7 pm EST on 1/29 (same as for Newbie and High School). This page will be updated with the brackets for each of the tournaments.
                                       </p> 


                                </div>
                            </div>


                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Tournament Format</h4>
                                </div>
                                <div className="content">
                                    <p>

Scrimmage rankings will be used to determine seeds for the Sprint and Seeding Tournaments. For all other tournaments, results from the previous tournament will be used to seed teams (where ties will be broken by the incoming seed in the previous tournament).
</p><p>
Tournaments will be in a <a href='https://en.wikipedia.org/wiki/Double-elimination_tournament'>double elimination</a> format, with the exception of the Sprint Tournament, which is single elimination. The Final Tournament will start with a blank slate (any losses from the Qualifying Tournament are reset).
</p>
<p>
Even if you miss earlier tournaments, you can participate in later tournaments (except the Final Tournament). 
This includes the Qualifying Tournament — you can participate even if you miss every other tournament (but your seed will be worse than the seed of everyone who participated in the Seeding Tournament).
</p>
<p>
Each match within a tournament will consist of 3 games on 3 different maps, and the team that wins the most games will advance. 
                                    </p>


                                </div>
                            </div>




                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Prizes and Reimbursements</h4>
                                </div>
                                <div className="content">
                                    <p>

The total prize pool is $30,000. Small prizes will be given out to top teams in the Sprint, Newbie and High School Tournaments, while most of the prize pool will be handed out to top teams in the Final Tournament. We will also probably give out smaller prize sums for various, to-be-determined achievements. Any team that is eligible to participate in a tournament is eligible to win prizes in said tournament.
</p><p>
We will invite all finalist teams to the final tournament at MIT. We will reimburse the cost of travel up to a reasonable cost, with a cap of $2,000 per team, and we will provide accommodation for everyone who is not from the Boston area. All finalists will also be invited to a fancy dinner on 1/31, the day before the Final Tournament.
                                    </p>

                                </div>
                            </div>



                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Eligibility Rules</h4>
                                </div>
                                <div className="content">
                                    <p>
Anyone is welcome to participate in Battlecode! Anyone can write a bot, create a team and participate in the rankings by scrimmaging other teams. Any team can also participate in the Sprint tournament and compete for prizes. For the rest of the tournaments, however, we can only consider teams of all full-time students. More details follow below.
</p><p>
Teams must consist entirely of active students to be eligible for the Seeding, Qualifying, and Final Tournaments. An active student is a person who is currently enrolled as a full-time student in an eligible undergraduate degree or certificate program. As an exception, we consider those transitioning immediately after high school and formally committed to such a program to be active students, including those taking gap years or in compulsory military service. Active students also include those who are currently in high school. 

</p><p>
Teams of only active MIT students who have never competed in Battlecode (that is, never submitted a bot) are eligible for the Newbie Tournament. Teams of only high school (and earlier) students are eligible for the High School Tournament.

</p><p>
Teams consisting entirely of US students compete in the US Qualifying Tournament. If a team has at least one non-US competitor, it will compete in the International Qualifying Tournament. A US student is a student who attends a school in the United States.

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
