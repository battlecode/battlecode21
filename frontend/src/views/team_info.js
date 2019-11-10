import React, { Component } from 'react';
import Api from '../api';

import { Link } from 'react-router-dom';

class TeamInfo extends Component {
	state = {
		team: null,
	};

	componentDidMount() {
		const teamId = this.props.match.params.team_id;
		//get team info by id
		Api.getTeamById(teamId, this.setTeam)
		Api.getTeamRanking(teamId, this.setRanking)
	}
	test = (data) => {
		console.log("hiiii")
		console.log(data)
	}

	setTeam = (team_data) => {
		console.log(team_data)
		this.setState({team: team_data})
	}

	setRanking = (ranking_data) => {
		console.log("hello there")
		this.setState({ranking: ranking_data.ranking})
	}

	renderHelperRanking(ranking) {
		console.log(ranking)
		if (ranking !== undefined) {
			return (
				<div className="content" style={{minHeight: 'auto'}}>
                    <div className="header text-center">
           				<h3 className="title">
           				    <small style={{paddingRight: '10px'}}>Rank</small> { ranking }
           				</h3>				
      				</div>
		        </div>
			)
		} else {
			return (
				<div className="content" style={{minHeight: 'auto'}}>
                    <div className="header text-center">
           				<h3 className="title">
           				    <small style={{paddingRight: '10px'}}> </small> 
           				</h3>				
      				</div>
		        </div>
			)
		}
	}

	renderHelperDescription(team) {
		if (team.bio !== "") {
			return (
				<p className="description text-center"><br/>{ team.bio }</p>
			)
		} else {
			return ""
		}
	}

	render() {
		const team = this.state.team;
		if (team !== null) {
			const avatar_image_str = team.avatar === "" ? '<img className="avatar border-gray" src={team.avatar } alt="Team Avatar" />' : ''
			return(
	            <div className="content">
	                <div className="card card-user">
	                    <div className="image">
	                    </div>
	                    <div className="content" style={{minHeight: 'auto'}}>
	                        <div className="author">
	                        	{ team.avatar !== "" ? <img className="avatar border-gray" src={team.avatar } alt="Team Avatar" /> : '' }
	                            <h4 className="title">{ team.name }<br />
	                                <small>{ team.users.join(", ") }</small>
	                            </h4>
	                        </div>
	                        { this.renderHelperDescription(team) }
			                
			                { this.renderHelperRanking(this.state.ranking) }

			                <div className="container-fluid">
			                    <div style={{paddingBottom: '20px'}} className="row">
			                        
			                        <div className="col-md-4">
			                        	<div className="">
			                                <div className="header">
			                       				<h4 className="title">{ team.wins } 
			                       					<small style={{paddingLeft: '20px'}}>Wins</small>
			                       				</h4>
			                  				</div>
		                  				</div>
			                        </div>
			                        <div className="col-md-4">
			                        	<div className="">
			                                <div className="header">
			                       				<h4 className="title">{ team.draws } 
			                       					<small style={{paddingLeft: '20px'}}>Draws</small>
			                       				</h4>
			                  				</div>
		                  				</div>
			                        </div>
			                        <div className="col-md-4">
			                        	<div className="">
			                                <div className="header">
			                       				<h4 className="title">{ team.losses } 
			                       					<small style={{paddingLeft: '20px'}}>Losses</small>
			                       				</h4>
			                  				</div>
		                  				</div>
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