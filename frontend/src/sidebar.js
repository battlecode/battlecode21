import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import Api from './api';


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
        this.state = {on_team:null};
    }

    componentDidMount() {
        Api.getUserTeam(function(e) {
            this.setState({on_team:(e !== null)});
            window.init_right_menu();
        }.bind(this));
    }

    render() {
        return (
            <div className="sidebar" data-color="space">
                <div className="sidebar-wrapper">
                    <div className="logo">
                        <a href="#" className="simple-text">VOYAGE</a>
                    </div>
                    <ul className="nav nav-pills nav-stacked">
                        <NLink to={`${process.env.PUBLIC_URL}/home`}><p style={{fontWeight: "inherit", textTransform: "none", fontSize: "inherit"}}><i className="pe-7s-home pe-fw" />Home</p></NLink>
                        <NLink to={`${process.env.PUBLIC_URL}/docs`}><p style={{fontWeight: "inherit", textTransform: "none", fontSize: "inherit"}}><i className="pe-7s-note2 pe-fw" />Docs</p></NLink>
                        <NLink to={`${process.env.PUBLIC_URL}/updates`}><p style={{fontWeight: "inherit", textTransform: "none", fontSize: "inherit"}}><i className="pe-7s-bell pe-fw" />Updates</p></NLink>
                        <NLink to={`${process.env.PUBLIC_URL}/search`}><p style={{fontWeight: "inherit", textTransform: "none", fontSize: "inherit"}}><i className="pe-7s-search pe-fw" />Search</p></NLink>
                        
                        <br />
                        
                        <NLink to={`${process.env.PUBLIC_URL}/team`}><p style={{fontWeight: "inherit", textTransform: "none", fontSize: "inherit"}}><i className="pe-7s-users pe-fw" />Team</p></NLink>
                        { this.state.on_team && <NLink to={`${process.env.PUBLIC_URL}/ide`}><p style={{fontWeight: "inherit", textTransform: "none", fontSize: "inherit"}}><i className="pe-7s-pen pe-fw" />IDE</p></NLink> }
                        { this.state.on_team && <NLink to={`${process.env.PUBLIC_URL}/scrimmaging`}><p style={{fontWeight: "inherit", textTransform: "none", fontSize: "inherit"}}><i className="pe-7s-joy pe-fw" />Scrimmaging</p></NLink> }
                        <NLink to={`${process.env.PUBLIC_URL}/replay`}><p style={{fontWeight: "inherit", textTransform: "none", fontSize: "inherit"}}><i className="pe-7s-monitor pe-fw" />Replay</p></NLink>
                    </ul>
                </div>
            </div>
        );
    }
}

export default SideBar;
