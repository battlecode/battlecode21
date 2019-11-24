import React, { Component } from 'react';
import Avatar from '../components/avatar';
import Api from '../api';

class TeamCard extends Component {
	constructor(props) {
		super(props)

		this.setupUsers()
	}

	// don't want to make ajax calls before component is mounted!
	componentDidMount() {
		this.getUserData()
	}

	setupUsers() {
		const dummyArr = []
		this.props.team.users.forEach(user => {
			dummyArr.push({username: user})
		})

		this.state = {
			users: dummyArr
		}
	}

	getUserData() {
		this.props.team.users.forEach(user => {
			Api.getProfileByUser(user, this.setUser)
		})
	}

	/* add user to state array, should never change length of users */
	setUser = (user_data) => {
		const users = this.state.users

		// find current index of user in the array
		let user_index = 0
		for (var i = 0; i < users.length; i++) {
			if (users[i].username === user_data.username) {
				user_index = i
			}
		}

		const newUsers = users.slice(0, user_index).concat([user_data]).concat(users.slice(user_index + 1))
		this.setState({users: newUsers})
	} 

	render() {
		if (this.state.users.length === 0 && this.props.team.users) {
			this.setupUsers()
			this.getUserData()
		}

		const team = this.props.team
		
		const userDivs = this.state.users.map((user) => {
			return (<div className="small-user-list"> <Avatar data={user} /> <small>{user.username}</small></div>)
		})

		return (
			<div className="card card-user">
			    <div className="image">
			    </div>
			    <div className="content" style={{minHeight: "190px"}}>
			        <div className="author">
			            <Avatar data={team}/>
			            <h4 className="title">{ team.name }<br />
			                <div className="users-box">{userDivs}</div>
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