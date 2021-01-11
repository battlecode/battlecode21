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
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">2021 Tournament Schedule</h4>
                                </div>
                                <div className="content">
                                    <p>
                                        Battlecode 2021 will consist of seven tournaments throughout the month! We stream and commentate all tournaments online. 
                                    </p>
                                    <p>
                                        <ul>
                                            <li>
                                                <b>Sprint Tournament 1: 1/12.</b> One week after spec release, you're given a chance to win small prizes in this tournament. The goal is to get an idea of the meta-game, and a chance to test your bot prototypes.
                                            </li>
                                            <li>
                                                <b>Sprint Tournament 2: 1/19.</b> One week after the Sprint Tournament 1, you're given another chance to win small prizes, test the metagame, and make changes.
                                            </li>
                                            <li>
                                                <b>International Qualifying Tournament: 1/26.</b>                                           This tournament determines the <i>4 international teams</i> that will qualify for the Final Tournament.
                                                 </li>
                                            <li>
                                                <b>US Qualifying Tournament: 1/26.</b>
                                                This tournament determines the <i>12 US-based teams</i> that will qualify for the Final Tournament.
                                                 </li>
                                            <li>
                                                <b>Newbie Tournament: 1/28.</b> The top newbie teams compete for a smaller prize pool. The final match between the top 2 teams will be run at the Final Tournament.
                                            </li>
                                            <li>
                                                <b>High School Tournament: 1/28.</b> The top high school teams compete for a smaller prize pool. Like the Newbie Tournament, the final match will be run at the Final Tournament.
                                            </li>
                                            <li>
                                                <b>Final Tournament: 1/30.</b> The top 16 teams, as determined by the qualifying tournaments, compete for glory, fame and a big prize pool. The tournament will take place live, and will be streamed online for 2021. There will not be a component on MIT campus this year.
                                            </li>
                                        </ul>
                                        The deadline to submit code for each non-final tournament is 7 pm EST <i>the day before</i> the tournament. 
                                       </p> 


                                </div>
                            </div>

                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Tournament Results</h4>
                                </div>
                                <div className="content">
                                </div>
                            </div>

                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Tournament Format</h4>
                                </div>
                                <div className="content">
                                    <p>
                                        Scrimmage rankings will be used to determine seeds for the Sprint and Seeding Tournaments. For all other tournaments, results from the previous tournament will be used to seed teams (where ties will be broken by the scrimmage ranking right before the tournament).
                                    </p>
                                    <p>
                                        Tournaments will be in a <a href='https://en.wikipedia.org/wiki/Double-elimination_tournament'>double elimination</a> format, with the exception of both Sprint Tournaments, which are single elimination. The Final Tournament will start with a blank slate (any losses from the Qualifying Tournament are reset).
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
                                    <h4 className="title">Prizes</h4>
                                </div>
                                <div className="content">
                                    <p>
                                        Thanks to our gold sponsor, Five Rings!
                                        <ul>
                                            <li><b>1st Place prize:</b> to whosoever has the highest rating at the end (hacks not allowed). Smaller prizes for subsequent placers.</li>
                                            <li>Smaller prizes for top placers in other non-final (newbie, high school, sprint) tournaments.</li>                                           
                                            <li><b>More prizes???</b> TBA, maybe 👀
                                                <ul>
                                                    <li>Historically, we have given out prizes for creative strategies, major bugs found, and other game-specific topics. Have fun with your strategies, write-ups, and overall participation in Battlecode!</li>
                                                </ul>
                                            </li>
                                        </ul>
                                    </p>
                                </div>
                            </div>



                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Eligibility Rules</h4>
                                </div>
                                <div className="content">
                                    <p>
                                        Anyone is welcome to participate in Battlecode! Anyone can write a bot, create a team and participate in the tournament. More eligibility details can be found <a href="https://battlecode.org#about">here</a>.
                                    </p>
                                    
                                    <p>
                                        Only current full-time students (both college and high school) are eligible for prizes.
                                    </p>
                                    
                                    <p>
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
