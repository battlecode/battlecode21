import React from 'react';

import TeamList from './teamList';
import PaginationControl from './paginationControl';

import { Redirect, Link } from 'react-router-dom';

const SUCCESS_TIMEOUT = 2000

class RankingTeamList extends TeamList {

    showTeamPage = (teamID) => {
        //this.props.history.push(`${process.env.PUBLIC_URL}/rankings/${teamID}`)
        //this.setState({showTeamID: teamID});
        if (!this.props.canRequest) {
            this.props.history.push(`${process.env.PUBLIC_URL}/rankings/${teamID}`);
        }
        //this.router.transitionTo('/')
    }

    render() {
        const { props, state }  = this;

        // if(state.showTeamID !== null) {
        //     return ( <Redirect to={`${process.env.PUBLIC_URL}/team/${state.showTeamID}`}/> );
        // }

        if (!props.teams) {
            return null;
        } else if (props.teams.length === 0) { 
            return (
                <div className="card">
                    <div className="header">
                        <h4 className="title">No Teams Found!</h4>
                        <br/>
                    </div> 
                </div>
            )
        }
        else {
            const teamRows = props.teams.map(team => {
                let buttonContent = "Request";
                if (state.pendingRequests[team.id]) {
                    buttonContent = <i className="fa fa-circle-o-notch fa-spin"></i>;
                } else if (state.successfulRequests[team.id]) {
                    buttonContent = <i className="fa fa-check"></i>;
                }
                return (
                    <tr key={ team.id } onClick={() => this.showTeamPage(team.id) }>
                            <td>{ team.score === -1000000 ? "N/A" : Math.round(team.score) }</td>
                            <td>{ team.name }</td>
                            <td>{ team.users.join(", ") }</td>
                            <td>{ team.bio }</td>
                            <td>{ team.student ? "✅" : "🛑"}{(team.student && team.international) ? "🌍" : "🇺🇸"}{(team.student && team.mit) ? "🐥" : ""}{(team.student && team.high_school) ? "HS" : ""}</td>
                            <td>{ team.auto_accept_unranked ? "Yes" : "No"}</td>
                            {props.canRequest && (
                                <td><button className="btn btn-xs" onClick={() => this.onTeamRequest(team.id)}>{buttonContent}</button>  </td>
                            )}
                    </tr>
                )
            })

            return (
                <div>
                    <div className="card">
                        <div className="header">
                            <h4 className="title">Rankings</h4>
                        </div>
                        <div className="content table-responsive table-full-width">
                            <table className="table table-striped">
                                <thead>
                                <tr>
                                    <th>Score</th>
                                    <th>Team</th>
                                    <th>Users</th>
                                    <th>Bio</th>
                                    <th>Eligibility</th>
                                    <th>Auto-Accept</th>
                                </tr>
                                </thead>
                                <tbody>
                                    {teamRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <PaginationControl 
                        page={props.page} 
                        pageLimit={props.pageLimit} 
                        onPageClick={props.onPageClick}
                    />            
                </div>
            );
        }
    }
}

export default RankingTeamList;
