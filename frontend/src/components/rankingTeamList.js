import React, { Component } from 'react';
import Api from '../api';

import TeamList from './teamList';
import PaginationControl from './paginationControl';

const SUCCESS_TIMEOUT = 2000

class RankingTeamList extends TeamList {

    render() {
        const { props, state }  = this;

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
                    <tr key={ team.id }>
                        <td>{ team.mu }</td>
                        <td>{ team.name }</td>
                        <td>{ team.users.join(", ") }</td>
                        <td>{ team.bio }</td>
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