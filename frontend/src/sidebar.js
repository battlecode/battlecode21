import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import Api from './api';
import $ from 'jquery';


class NLink extends Component {
    render() {
        return (
            <li><NavLink {...this.props} activeStyle={{ opacity:1, fontWeight:800 }} /></li>
        );
    }
}

class SideBar extends Component {
    constructor() {
        super();
        this.state = {on_team:null, logged_in: null,  user: {}, league: {}};
    }

    componentDidMount() {
        Api.loginCheck((logged_in) => {
            this.setState({ logged_in });
            Api.getUserProfile(function (u) {
                console.log(u);
                this.setState({ user: u });
                if (this.state.user.is_staff == true)
                {
                    console.log("user is staff");
                    // var is_staff_msg = document.getElementById("is_staff_msg");
                    // is_staff_msg.innerHTML = "Staff";
                }
            }.bind(this))
        });

        Api.getUserTeam(function(e) {
            this.setState({on_team:(e !== null)});
            $(document).ready(function() {
                console.log("sidebar guy called")
                window.init_right_menu();
            });
        }.bind(this));

        Api.getLeague(function (l) {
            this.setState({ league: l});
        }.bind(this));
    }

    isSubmissionEnabled() {
        if (this.state.user.is_staff == true) {
          return true;
        }
        if (this.state.league.game_released == true) {
          return true;
        }
        return false;
    }

    // for icon options below, see https://themes-pixeden.com/font-demos/7-stroke/

    render() {
        return (
            <div className="sidebar" data-color="space"> {/* data-color is defined in light-bootstrap-dashboard.css */}
                <div className="sidebar-wrapper">
                    <div className="logo">
                        <a href="#" className="simple-text">Battlecode</a>
                    </div>
                    <ul className="nav nav-pills nav-stacked">
                        <NLink to={`${process.env.PUBLIC_URL}/home`}><p style={{fontWeight: "inherit", textTransform: "none", fontSize: "inherit"}}><i className="pe-7s-home pe-fw" />Home</p></NLink>
                        <NLink to={`${process.env.PUBLIC_URL}/getting-started`}><p style={{fontWeight: "inherit", textTransform: "none", fontSize: "inherit"}}><i className="pe-7s-sun pe-fw" />Getting Started</p></NLink>
                        <NLink to={`${process.env.PUBLIC_URL}/resources`}><p style={{fontWeight: "inherit", textTransform: "none", fontSize: "inherit"}}><i className="pe-7s-note2 pe-fw" />Resources</p></NLink>
                        <NLink to={`${process.env.PUBLIC_URL}/updates`}><p style={{fontWeight: "inherit", textTransform: "none", fontSize: "inherit"}}><i className="pe-7s-bell pe-fw" />Updates</p></NLink>
                        <br />
                        <NLink to={`${process.env.PUBLIC_URL}/tournaments`}><p style={{fontWeight: "inherit", textTransform: "none", fontSize: "inherit"}}><i className="pe-7s-medal pe-fw" />Tournaments</p></NLink>
                        <NLink to={`${process.env.PUBLIC_URL}/rankings`}><p style={{fontWeight: "inherit", textTransform: "none", fontSize: "inherit"}}><i className="pe-7s-graph1 pe-fw" />Rankings</p></NLink>
                        {/*<NLink to={`${process.env.PUBLIC_URL}/search`}><p style={{fontWeight: "inherit", textTransform: "none", fontSize: "inherit"}}><i className="pe-7s-search pe-fw" />Search</p></NLink>*/}
                        
                        <br />
                        
                        { this.state.logged_in && <NLink to={`${process.env.PUBLIC_URL}/team`}><p style={{fontWeight: "inherit", textTransform: "none", fontSize: "inherit"}}><i className="pe-7s-users pe-fw" />Team</p></NLink>}
                        { this.state.on_team && <NLink to={`${process.env.PUBLIC_URL}/submissions`}><p style={{fontWeight: "inherit", textTransform: "none", fontSize: "inherit"}}><i className="pe-7s-up-arrow pe-fw" />Submissions</p></NLink> }
                        {/*{ this.state.on_team && <NLink to={`${process.env.PUBLIC_URL}/ide`}><p style={{fontWeight: "inherit", textTransform: "none", fontSize: "inherit"}}><i className="pe-7s-pen pe-fw" />IDE</p></NLink> }*/}
                        { (this.state.on_team && this.isSubmissionEnabled()) && <NLink to={`${process.env.PUBLIC_URL}/scrimmaging`}><p style={{fontWeight: "inherit", textTransform: "none", fontSize: "inherit"}}><i className="pe-7s-joy pe-fw" />Scrimmaging</p></NLink> }
                        {/*<NLink to={`${process.env.PUBLIC_URL}/replay`}><p style={{fontWeight: "inherit", textTransform: "none", fontSize: "inherit"}}><i className="pe-7s-monitor pe-fw" />Replay</p></NLink>*/}
                        <br />
                    </ul>
                </div>
            </div>
        );
    }
}

export default SideBar;
