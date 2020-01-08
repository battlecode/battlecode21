import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Switch, Route } from 'react-router';

import Home from './views/home';
import NotFound from './views/not_found';
//import Docs from './views/docs';
import GettingStarted from './views/getting-started';
import Scrimmaging from './views/scrimmaging';
import Tournaments from './views/tournaments';
import Updates from './views/updates';
import Search from './views/search';
import Team from './views/team';
import Issues from './views/issues';
import Debugging from './views/debugging';
import Staff from './views/staff';
import Rankings from './views/rankings';
//import IDE from './views/ide';
import Account from './views/account';
import Resources from './views/resources';
//import ReplayViewer from './views/replay';
import LoginRegister from './views/login';
import Register from './views/register';
import VerifyUser from './views/VerifyUser';
import PasswordForgot from './views/passwordForgot';
import PasswordChange from './views/passwordChange';
import Submissions from './views/submissions';
import TeamInfo from './views/teamInfo';
import Footer from './footer';
import NavBar from './navbar';
import SideBar from './sidebar';
import Api from './api';

class App extends Component {
  constructor() {
    super();
    this.state = { logged_in: null ,
      user: {},
      league: {}};
    
  }

  componentDidMount() {
    Api.loginCheck((logged_in) => {
      this.setState({ logged_in });
      
      Api.getUserProfile(function (u) {
        this.setState({ user: u });
      }.bind(this));
      
      Api.getLeague(function (l) {
        console.log(l);
        this.setState({ league: l});
      }.bind(this));
    });
  }

  isSubmissionEnabled()
  {
      if (this.state.user.is_staff === true) {
          return true;
      }
      if (this.state.league.game_released === true) {
          return true;
      }
      return false;
  }

  userIsStaff() {
    return (this.state.user.is_staff === true)
  }

  render() {

    // direct to home page, should always be visible
    let homeElems = [
      <Route exact path={`${process.env.PUBLIC_URL}/`} component={Home} />,
      <Route path={`${process.env.PUBLIC_URL}/home`} component={Home} />
    ]

    // should only be visible to logged in users
    let loggedInElems = []
    if (this.state.logged_in) {
      loggedInElems = [
        <Route path={`${process.env.PUBLIC_URL}/team`} component={Team} />,
        <Route path={`${process.env.PUBLIC_URL}/account`} component={Account} />,
        <Route path={`${process.env.PUBLIC_URL}/password_forgot`} component={Home} />,
        <Route path={`${process.env.PUBLIC_URL}/password_change`} component={Home} />,
        <Route path={`${process.env.PUBLIC_URL}/login`} component={Home} />,
        <Route path={`${process.env.PUBLIC_URL}/register`} component={Home} />
      ]
    }

    // should be visible to all users
    let nonLoggedInElems = [
      <Route path={`${process.env.PUBLIC_URL}/updates`} component={Updates} />,
      <Route path={`${process.env.PUBLIC_URL}/search`} component={Search} />,
      <Route path={`${process.env.PUBLIC_URL}/tournaments`} component={Tournaments} />,
      <Route path={`${process.env.PUBLIC_URL}/getting-started`} component={GettingStarted} />,
      <Route path={`${process.env.PUBLIC_URL}/common-issues`} component={Issues} />,
      <Route path={`${process.env.PUBLIC_URL}/debugging`} component={Debugging} />,
      <Route path={`${process.env.PUBLIC_URL}/resources`} component={Resources} />,
      <Route path={`${process.env.PUBLIC_URL}/rankings/:team_id`} component={TeamInfo} />,
      <Route path={`${process.env.PUBLIC_URL}/rankings`} component={Rankings} />,
        <Route path={`${process.env.PUBLIC_URL}/scrimmaging`} component={Scrimmaging} />,
        <Route path={`${process.env.PUBLIC_URL}/submissions`} component={Submissions} />
      <Route path="*" component={NotFound} />
    ]

    let staffElems = []
    if (this.userIsStaff()) {
      staffElems = [
        <Route path={`${process.env.PUBLIC_URL}/staff`} component={Staff} />,
      ]
    }

    // should only be visible if user is staff or submissions are enabled
    // let gameElems = []
    // if (this.isSubmissionEnabled()) {
    //   gameElems = [
    //     <Route path={`${process.env.PUBLIC_URL}/scrimmaging`} component={Scrimmaging} />,
    //     <Route path={`${process.env.PUBLIC_URL}/submissions`} component={Submissions} />
    //   ]
    // }

    return (
      <div className="wrapper">
          <SideBar />
          <div className="main-panel">
            <NavBar />
            <Switch>
              { homeElems }
              { gameElems }
              { staffElems }
              { loggedInElems }
              { nonLoggedInElems }
            </Switch>
            <Footer />
          </div>
        </div>
    )
  }
}

class BeforeLoginApp extends Component {
  constructor() {
    super();
    this.state = { logged_in: null };
  }

  componentDidMount() {
    Api.loginCheck((logged_in) => {
      this.setState({ logged_in });
    });
  }

  render() {
    if (this.state.logged_in) {
      return (
        <App />
      );
    } if (this.state.logged_in === false) {
      return (
        <Switch>
          <Route path={`${process.env.PUBLIC_URL}/password_forgot`} component={PasswordForgot} />
          <Route path={`${process.env.PUBLIC_URL}/password_change`} component={PasswordChange} />
          <Route path={`${process.env.PUBLIC_URL}/login`} component={LoginRegister} />
          <Route path={`${process.env.PUBLIC_URL}/register`} component={Register} />
          <Route path={`${process.env.PUBLIC_URL}/team`} component={LoginRegister} />,
          <Route path={`${process.env.PUBLIC_URL}/account`} component={LoginRegister} />
          <Route path="*" component={App} />
        </Switch>
      );
    }
    return <div />;
  }

}

ReactDOM.render((
  <BrowserRouter>
    <BeforeLoginApp />
  </BrowserRouter>
), document.getElementById('root'));
