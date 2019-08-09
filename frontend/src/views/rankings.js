import React, { Component } from 'react';
import Api from '../api';

import TeamList from '../components/teamList';
import RankingTeamList from '../components/rankingTeamList';


class Rankings extends Component {
    state = {
      teams: null,
      teamLimit: 0,
      teamPage: 1,
      input: '',
    };

    componentDidMount() {
      const { input } = this.state;
      Api.searchTeamRanking(input, 1, this.onDataLoad);
    }

    handleChange = (e) => {
      const { input } = this.state;
      this.setState({ input: e.target.value });
    }

    onDataLoad = (data) => {
      this.setState(data);
    }

    getTeamPage = (page) => {
      const { state } = this;
      if (page !== state.teamPage && page >= 0 && page <= state.teamLimit) {
        Api.searchTeamRanking(state.input, page, this.onDataLoad);
      }
    }

    search = (e) => {
      const { input } = this.state;
      e.preventDefault();
      Api.searchTeamRanking(input, 1, this.onDataLoad);
    }

    render() {
      const { state } = this;
      return (
        <div className="content">
          <div className="container-fluid row">
            <div className="col-md-12">
              <div className="card">
                <div className="content">
                  <form className="input-group" onSubmit={this.search}>
                    <input type="text" className="form-control" onChange={this.handleChange} placeholder="Search for a Team or User..." />
                    <span className="input-group-btn">
                      <button className="btn btn-default" type="submit" value="Submit">Go!</button>
                    </span>
                  </form>
                </div>
              </div>
            </div>
            <div className="col-md-12">
              <RankingTeamList
                teams={state.teams}
                page={state.teamPage}
                pageLimit={state.teamLimit}
                onPageClick={this.getTeamPage}
              />
            </div>
          </div>
        </div>
      );
    }
}

export default Rankings;
