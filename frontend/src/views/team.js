import React, { Component } from 'react';
import Api from '../api';

import TeamCard from '../components/teamCard';
import Floater from 'react-floater';

class YesTeam extends Component {

    constructor(props) {
        super();

        this.state = {
            team: {
                name:'',
                id:0,
                team_key:'',
                auto_accept_ranked:false,
                auto_accept_unranked:false,
                bio:'',
                avatar:'',
                users:[],
                verified_users:[],
                mit: false,
                student: false,
                high_school: false,
                international: true,
            },
            'up':'Update Info'
        };

        this.changeHandler = this.changeHandler.bind(this);
        this.checkHandler = this.checkHandler.bind(this);
        this.updateTeam = this.updateTeam.bind(this);
        this.uploadProfile = this.uploadProfile.bind(this);
    }

    leaveTeam() {
        Api.leaveTeam(function(success) {
            if (success) window.location.reload();
        });
    }

    changeHandler(e) {
        var id = e.target.id;
        var val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;

        if (!id) id = e.target.parentElement.id;

        if (id === 'international') val = !val;

        this.setState(function(prevState, props) {
            prevState.team[id] = val;
            return prevState;
        });
    }

    checkHandler(e) {
        var correct = e.target.id;
        if (correct === "") correct = e.target.parentElement.parentElement.id;

        this.setState(function(prevState, props) {
            prevState.team[correct] = !prevState.team[correct];
            return prevState;
        });
    }

    updateTeam() {
        console.log(this.state.team)
        this.setState({'up':'<i class="fa fa-circle-o-notch fa-spin"></i>'});
        Api.updateTeam(this.state.team, function(response) {
            if (response) this.setState({'up':'<i class="fa fa-check"></i>'});
            else this.setState({'up':'<i class="fa fa-times"></i>'});
            setTimeout(function() {
                this.setState({'up':'Update Info'});
            }.bind(this),2000);
        }.bind(this));
    }

    uploadProfile(e) {
        var reader = new FileReader();
        reader.onloadend = () => this.setState(function(prevState, props) {
            prevState.team.bio = reader.result;
            return prevState;
        });
        reader.readAsDataURL(e.target.files[0]);
    }

    componentDidMount() {
        Api.getUserTeam(function(new_state) {
            this.setState({ team:new_state });
        }.bind(this));
    }

    render() {
        return (
            <div>
                <div className="col-md-8">
                    <div className="card">
                        <div className="header">
                            <h4 className="title">Tournament Eligibilty</h4>
                        </div>
                        <div className="content">
                            <ResumeStatus team={this.state.team} />
                            <p>We need to know a little about your team in order to determine which tournaments you are is eligible for.
                                Check all boxes that apply to your team. We will verify student status for all teams that qualify for the finals.
                            </p>
                            <EligibiltyOptions change={this.changeHandler} team={this.state.team} update={this.updateTeam} up_but={this.state.up} />
                        </div>
                    </div>

                    <div className="card">
                        <div className="header">
                            <h4 className="title">Team</h4>
                        </div>
                        <div className="content">
                            <div className="row">
                                <div className="col-md-7">
                                    <div className="form-group">
                                        <label>Team Name (static)</label>
                                        <input type="text" className="form-control" readOnly value={ this.state.team.name } />
                                    </div>
                                </div>
                                <div className="col-md-5">
                                    <div className="form-group">
                                        <label>Secret Key (static)</label>
                                        <input type="text" className="form-control" readOnly value={ this.state.team.team_key } />
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6">
                                    <label id="auto_accept_unranked" className="center-row"><input type="checkbox" checked={ this.state.team.auto_accept_unranked } onChange={this.changeHandler} className="form-control center-row-start" /> Auto-accept scrimmages.</label>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label>Team Avatar URL</label>
                                        <input type="text" id="avatar" className="form-control" onChange={this.changeHandler} value={ this.state.team.avatar } />
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label>Team Bio</label>
                                        <textarea rows={5} className="form-control" placeholder="Put your team bio here." onChange={this.changeHandler} id="bio" value={ this.state.team.bio } />
                                    </div>
                                </div>
                            </div>
                            
                            <button type="button" onClick={ this.updateTeam } className="btn btn-info btn-fill pull-right" dangerouslySetInnerHTML={{__html:this.state.up }}></button>
                            <button type="button" onClick={ this.leaveTeam } style={{marginRight:'10px'}} className="btn btn-danger btn-fill pull-right">Leave Team</button>
                            <div className="clearfix" />
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <TeamCard team={ this.state.team } />
                </div>
            </div>
        );
    }
}

class NoTeam extends Component {
    constructor() {
        super();
        this.state = {team_name:"", secret_key:"", team_join_name:"", joinTeamError:false, createTeamError:false};

        this.joinTeam = this.joinTeam.bind(this);
        this.createTeam = this.createTeam.bind(this);
        this.changeHandler = this.changeHandler.bind(this);
    }

    changeHandler(e) {
        var id = e.target.id;
        var val = e.target.value;
        this.setState(function(prevState, props) {
            prevState[id] = val;
            return prevState;
        });
    }

    joinTeam() {
        Api.joinTeam(this.state.secret_key, this.state.team_join_name, this.joinCallback);
    }

    joinCallback=(success) => {
        this.setState({joinTeamError: success});
        if (success) {
                window.location.reload();
        }
    }

    createTeam() {
        Api.createTeam(this.state.team_name, this.createCallback);
    }

    createCallback=(success) => {
        console.log(success)
        this.setState({createTeamError: !success});
        if (success) {
                window.location.reload();
        }
    }

    renderError(type, data) {
        if (data === true) {
            let message = ""
            if (type === "createTeamError") {
                message = "Sorry, this team name is already being used."
            } else if (type === "joinTeamError") {
                message = "Sorry, that team name and secret key combination is not valid."
            }

            return(
                <p style={{color: '#FF4A55'}}> { message } </p>
            )
        }
    }

    render() {
        return (
            <div className="col-md-12">
                    <div className="card">
                        <div className="header">
                            <h4 className="title">Create a Team</h4>
                        </div>
                        <div className="content">
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label>Team Name</label>
                                        <input type="text" className="form-control" id="team_name" onChange={this.changeHandler} />
                                    </div>
                                </div>
                            </div>
                            { this.renderError("createTeamError", this.state.createTeamError) }
                            <button type="button" className="btn btn-info btn-fill pull-right" onClick={ this.createTeam }>Create</button>
                            <div className="clearfix" />
                        </div>
                    </div>

                    <div className="card">
                        <div className="header">
                            <h4 className="title">Join a Team</h4>
                        </div>
                        <div className="content">
                            <div className="row">
                                <div className="col-md-8">
                                    <div className="form-group">
                                        <label>Team Secret Key</label>
                                        <input type="text" className="form-control" id="secret_key" onChange={this.changeHandler} />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>Team Name</label>
                                        <input type="text" className="form-control" id="team_join_name" onChange={this.changeHandler} />
                                    </div>
                                </div>
                            </div>
                            { this.renderError("joinTeamError", this.state.joinTeamError) }
                            <button type="button" className="btn btn-info btn-fill pull-right" onClick={ this.joinTeam }>Join</button>
                            <div className="clearfix" />
                        </div>
                    </div>

                </div>
        );
    }
}

// pass team in props.team
class ResumeStatus extends Component {
    render() {

        var resumestring;

        var unverified_users = this.props.team.users.filter( ( el ) => !this.props.team.verified_users.includes( el ) );

        console.log(this.props.team);

        if (this.props.team.verified_users.length === this.props.team.users.length) {
            resumestring = (<div><p style={{color:'green'}}>Everyone on your team has uploaded a resume!</p></div>);
        } else {
            resumestring = (<div><p style={{color:'red', fontWeight: 'bold'}}>Not everyone on your team has uploaded a resume, so you are currently not eligible for the qualifying or final tournaments.
    Users who have not yet uploaded a resume: {unverified_users.join(", ")}</p>
            </div>);
        }

        return resumestring;
    }
}

// pass change handler in props.change and team in props.team
class EligibiltyOptions extends Component {
    render() {
        return (
            <div className="row" style={{marginTop:'1em'}}>
                <div className="col-md-12">
                    <div className="form-group" style={{display: "flex"}}>
                        <label>Full-time Students</label>
                        <Floater content={
                            <div>
                            <p>Teams must consist entirely of active students to be eligible for the Seeding, Qualifying, and Final Tournaments. If you are unsure about whether you are an active student, read more about eligibilty under <a href="http://2020.battlecode.org/tournaments">tournaments</a> or reach out to one of Teh Devs on Discord or over email.</p></div> } showCloseButton={true}>
                             <i className="pe-7s-info pe-fw" />
                        </Floater>
                        <input type="checkbox" className="form-control" onChange={this.props.change} style={{width: "20px", height: "20px", margin: "0 0 0 10px" }} id="student" checked={this.props.team.student} />
                    </div>
                    <div className="form-group" style={{display: "flex"}}>
                        <label>US Students</label>
                        <Floater content={
                            <div>
                            <p>Teams consisting entirely of US students compete in the US Qualifying Tournament. If a team has at least one non-US competitor, it will compete in the International Qualifying Tournament. A US student is a student who attends a school in the United States.</p></div> } showCloseButton={true}>
                             <i className="pe-7s-info pe-fw" />
                        </Floater>
                        <input type="checkbox" className="form-control" onChange={this.props.change} style={{width: "20px", height: "20px", margin: "0 0 0 10px" }} id="international" checked={!this.props.team.international} />
                    </div>
                    <div className="form-group" style={{display: "flex"}}>
                        <label>First-time MIT Students</label>
                        <Floater content={
                            <div>
                            <p>Teams of only active MIT students who have never competed in Battlecode before (that is, never submitted a bot in previous years) are eligible for the Newbie Tournament.</p></div> } showCloseButton={true}>
                             <i className="pe-7s-info pe-fw" />
                        </Floater>
                        <input type="checkbox" className="form-control" onChange={this.props.change} style={{width: "20px", height: "20px", margin: "0 0 0 10px" }} id="mit" checked={this.props.team.mit} />
                    </div>
                    <div className="form-group" style={{display: "flex"}}>
                        <label>High School Students</label>
                        <Floater content={
                            <div>
                            <p>Teams of only high school (and earlier) students are eligible for the High School Tournament.</p></div> } showCloseButton={true}>
                             <i className="pe-7s-info pe-fw" />
                        </Floater>
                        <input type="checkbox" className="form-control" onChange={this.props.change} style={{width: "20px", height: "20px", margin: "0 0 0 10px" }} id="high_school" checked={this.props.team.high_school} />
                    </div>
                     <button type="button" onClick={ this.props.update } className="btn btn-info btn-fill pull-right" dangerouslySetInnerHTML={{__html:this.props.up_but }}></button>
                </div>
            </div>
        )
    }
}

class Team extends Component {
    constructor() {
        super();
        this.state = { 'team': false }
    }

    componentDidMount() {
        Api.getUserTeam(function(new_state) {
            this.setState({ team:new_state });
        }.bind(this));
    }

    render() {
        return (
            <div className="content">
                <div className="content">
                    <div className="container-fluid">
                        <div className="row">
                            { this.state.team === null && <NoTeam /> }
                            { this.state.team && <YesTeam team={ this.state.team }/> }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
export default Team;