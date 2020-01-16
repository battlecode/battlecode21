import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import Api from '../api';

import TeamCard from '../components/teamCard';
import PerfCard from '../components/perfCard';



class RankCard extends Component {
	constructor() {
        super()
        this.state = {
        	ranking: null
        }
    }

	componentDidMount() {
		Api.getTeamRanking(this.props.teamId, this.setRanking)
	}

	setRanking = (ranking_data) => {
		this.setState({ranking: ranking_data.ranking})
	}

	hi = (data) => {
		console.log(data)
	}

	render() {
		const {ranking} = this.state
		const rankStr = ranking || "-"
		const rankStyle = (ranking) ? {} : {visibility: "hidden"}
		return (
			<div className="card">
				<div className="content">
					<div className="col-2-row col-2-row-skinny">
						<label>rank</label>
						<h1 style={rankStyle}>{rankStr}</h1>
					</div>
					<br></br>
					<p style={{textAlign: 'center'}}>
						μ: {this.props.team.mu.toFixed(2)},
						σ: {this.props.team.sigma.toFixed(2)}
					</p>
				</div>
			</div>
		)
	}
}

class WinsCard extends Component {
	constructor(props) {
		super(props);
		this.state = {}
	}

	render() {
		const {wins, draws, losses} = this.state
		return(
			<div className="card">
				<div className="content">
					<div className="col-2-row">
						<div className="row-items-box items-box-center items-box-skinny">
							<label>wins</label>
							<h1>{this.props.wins}</h1>
						</div>
						<div className="row-items-box items-box-center items-box-skinny">
							<label>losses</label>
							<h1>{this.props.losses}</h1>
						</div>
					</div>
				</div>
			</div>
		)
	}
}

class TeamInfo extends Component {
	state = {
		team: null,
		wins: 0,
		losses: 0,
	};

	componentDidMount() {
		const teamId = this.props.match.params.team_id;
		//get team info by id
		Api.getTeamById(teamId, this.setTeam)

		Api.getOtherTeamWinStats(teamId, (data) => {
	      	this.setState({wins: data[0], losses: data[1]})
    	})
	}

	setTeam = (team_data) => {
		this.setState({team: team_data})
	}

	render() {
		const team = this.state.team;
		if (team !== null) {
			return(
				<div className="content">
					<div className="container-fluid">
						<div className="row">
							<TeamCard team={team}/>
						</div>
						<div className="row">
							<div className="col-md-3">
								<div className="container-fluid">
									<div className="row">
										<RankCard teamId={team.id} team={team}/>
									</div>
								</div>
							</div>
							<div className="col-md-3">
								<div className="container-fluid">
									<div className="row">
										<WinsCard wins={this.state.wins} losses={this.state.losses}/>
									</div>
								</div>
							</div>
							<div className="col-md-6">
								<div className="container-fluid">
									<div className="row">
										<PerfCard team={team.id}/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)
		} else {
			return null
		}
	}
}

export default TeamInfo;