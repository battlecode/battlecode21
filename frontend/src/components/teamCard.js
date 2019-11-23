import React, { Component } from 'react';
import Avatar from '../components/avatar';
import Api from '../api';

class TeamCard extends Component {
	constructor(props) {
		super(props)

		const dummyArr = []

		this.props.team.users.forEach(user => {
			dummyArr.push({})
			Api.getProfileByUser(user, )
		})

		this.state = {
			users: dummyArr
		}
	}

	/* add user to state array, should never change length of users */
	setUser = (user_data) => {
		const users = this.state.users
		users.slice(1).concat([user_data])
		this.setState({users: users})
	} 

	render() {
		const team = this.props.team
		//team.users.
		return (
			<div className="card card-user">
			    <div className="image">
			    </div>
			    <div className="content" style={{minHeight: "190px"}}>
			        <div className="author">
			            <Avatar data={team}/>
			            <h4 className="title">{ team.name }<br />
			                <small>{ team.users.join(", ") }</small>
			            </h4>
			        </div>
			        <br />
			        <p className="description text-center">{ team.bio }</p>
			    </div>
			</div>
		)
	}
}

export default TeamCard

// <div className="card card-user">
//     <div className="image">
//     </div>
//     <div className="content">
//         <div className="author">
//             <img className="avatar border-gray" src={ this.state.team.avatar===''?'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==':this.state.team.avatar } alt="Team Avatar" />
//             <h4 className="title">{ this.state.team.name }<br />
//                 <small>{ this.state.team.users.join(", ") }</small>
//             </h4>
//         </div>
//         <p className="description text-center">{ this.state.team.bio }</p>
//     </div>
// </div>


// <div className="card card-user">
// 	                    <div className="image">
// 	                    </div>
// 	                    <div className="content" style={{minHeight: 'auto'}}>
// 	                        <div className="author">
// 	                        	{ team.avatar !== "" ? <img className="avatar border-gray" src={team.avatar } alt="Team Avatar" /> : '' }
// 	                            <h4 className="title">{ team.name }<br />
// 	                                <small>{ team.users.join(", ") }</small>
// 	                            </h4>
// 	                        </div>
// 	                        { this.renderHelperDescription(team) }
			                
// 			                { this.renderHelperRanking(this.state.ranking) }

// 			                <div className="container-fluid">
// 			                    <div style={{paddingBottom: '20px'}} className="row">
			                        
// 			                        <div className="col-md-4">
// 			                        	<div className="">
// 			                                <div className="header">
// 			                       				<h4 className="title">{ team.wins } 
// 			                       					<small style={{paddingLeft: '20px'}}>Wins</small>
// 			                       				</h4>
// 			                  				</div>
// 		                  				</div>
// 			                        </div>
// 			                        <div className="col-md-4">
// 			                        	<div className="">
// 			                                <div className="header">
// 			                       				<h4 className="title">{ team.draws } 
// 			                       					<small style={{paddingLeft: '20px'}}>Draws</small>
// 			                       				</h4>
// 			                  				</div>
// 		                  				</div>
// 			                        </div>
// 			                        <div className="col-md-4">
// 			                        	<div className="">
// 			                                <div className="header">
// 			                       				<h4 className="title">{ team.losses } 
// 			                       					<small style={{paddingLeft: '20px'}}>Losses</small>
// 			                       				</h4>
// 			                  				</div>
// 		                  				</div>
// 			                        </div>
// 			                    </div>
// 			                </div>
// 						</div>  