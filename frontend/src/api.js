import $ from 'jquery';
import * as Cookies from 'js-cookie';

//const URL = 'https://2020.battlecode.org';
//const URL = 'http://localhost:8000'; // DEVELOPMENT
// do not change URL here!! rather, for development, change it in ../.env.development
const URL = process.env.REACT_APP_BACKEND_URL;
const DONOTREQUIRELOGIN = false; // set to true for DEVELOPMENT
const LEAGUE = 0;
const PAGE_LIMIT = 10;

class Api {
  
  //----SUBMISSIONS----

  //uploads a new submission to the google cloud bucket
  static newSubmission(submissionfile, callback){
    // submissionfile.append('_method', 'PUT');
    console.log('newSubmission')
    // get the url from the real api
    $.post(`${URL}/api/${LEAGUE}/submission/`, {
      team: Cookies.get('team_id')
    }).done((data, status) => {
      console.log(data['upload_url'])
      $.ajax({
        url: data['upload_url'], 
        method: "PUT",
        data: submissionfile,
        processData: false,
        contentType: false
      })
    }).fail((xhr, status, error) => {
      console.log(error)
      callback('there was an error', false);
    });
  }

  static downloadSubmission(submissionId, fileNameAddendum, callback) {
    $.get(`${URL}/api/${LEAGUE}/submission/${submissionId}/retrieve_file/`).done((data, status) => {
      // have to use fetch instead of ajax here since we want to download file
      fetch(data['download_url']).then(resp => resp.blob())
      .then(blob => {
        //code to download the file given by the url
        const objUrl = window.URL.createObjectURL(blob);
        const aHelper = document.createElement('a');
        aHelper.style.display = 'none';
        aHelper.href = objUrl;
        aHelper.download = `${fileNameAddendum}_battlecode_source.zip`;
        document.body.appendChild(aHelper);
        aHelper.click();
        window.URL.revokeObjectURL(objUrl);
      })
    }).fail((xhr, status, error) => {
      console.log(error)
      callback('there was an error', false);
    });
  }

  static getTeamSubmissions(callback) {
    $.get(`${URL}/api/${LEAGUE}/teamsubmission/${Cookies.get("team_id")}/`).done((data, status) => {
        callback(data);
    });
  }

    static getSubmission(id, callback, callback_data) {
    $.get(`${URL}/api/${LEAGUE}/submission/${id}/`).done((data, status) => {
        callback(callback_data, data);
    });
  }


  static getCompilationStatus(callback) {
    $.get(`${URL}/api/${LEAGUE}/teamsubmission/${Cookies.get("team_id")}/team_compilation_status/`).done((data, status) => {
        callback(data);
    });
  }

  //----TEAM STATS---

  static getUpcomingDates(callback) {
    const newState = [
      { id: 0, date: 'hi', data: 'message' },
      { id: 1, date: '24', data: 'message2' },
    ];

    callback(newState);
  }

  static getTeamMuHistory(callback) {
   //const data = [10, 12, 14, 10, 28, 32, 25, 32];

    callback([]);
  }

  static getTeamWinStats(callback) {
    this.getUserTeam((team) => {
      const stats = [team.wins, team.losses];
      callback(stats);
    });
  }


  //get data for team with team_id
  static getTeamById(team_id, callback) {
    if ($.ajaxSettings && $.ajaxSettings.headers) {
      delete $.ajaxSettings.headers.Authorization;
    } // we should not require valid login for this. 

    $.get(`${URL}/api/${LEAGUE}/team/${team_id}/`).done((data, status) => {
        callback(data);
    });

    $.ajaxSetup({
      headers: { Authorization: `Bearer ${Cookies.get('token')}` },
    });
  }

  //calculates rank of given team, with tied teams receiving the same rank
  //i.e. if mu is 10,10,1 the ranks would be 1,1,3
  static getTeamRanking(team_id, callback) {
    if ($.ajaxSettings && $.ajaxSettings.headers) {
      delete $.ajaxSettings.headers.Authorization;
    } // we should not require valid login for this. 

    const requestUrl = `${URL}/api/${LEAGUE}/team/${team_id}/ranking/`
    $.get(requestUrl).done((data, status) => {
      callback(data);
    })

    $.ajaxSetup({
      headers: { Authorization: `Bearer ${Cookies.get('token')}` },
    });
  }

  //----GENERAL INFO----

  static getLeague(callback) {
    $.get(`${URL}/api/league/${LEAGUE}/`).done((data, status) => {
      Cookies.set('league_url', data.url);
      console.log((data.url));
      $.get(data.url).done((data, success) => {
        callback(data);
      }).fail((xhr, status, error) => {
        console.log(error);
      });
    });
  }

  static getUpdates(callback) {
    if ($.ajaxSettings && $.ajaxSettings.headers) {
      delete $.ajaxSettings.headers.Authorization;
    } // we should not require valid login for this. 
    $.get(`${URL}/api/league/${LEAGUE}/`, (data, success) => {
      for (let i = 0; i < data.updates.length; i++) {
        const d = new Date(data.updates[i].time);
        data.updates[i].date = d.toLocaleDateString();
        data.updates[i].time = d.toLocaleTimeString();
      }

      callback(data.updates);
    });
    $.ajaxSetup({
      headers: { Authorization: `Bearer ${Cookies.get('token')}` },
    });
  }

  //----SEARCHING----

  static search(query, callback) {
    const encodedQuery = encodeURIComponent(query);
    const teamUrl = `${URL}/api/${LEAGUE}/team/?search=${encodedQuery}&page=1`;
    const userUrl = `${URL}/api/user/profile/?search=${encodedQuery}&page=1`;
    $.get(teamUrl, (teamData) => {
      $.get(userUrl, (userData) => {
        const teamLimit = parseInt(teamData.count / PAGE_LIMIT, 10) + !!(teamData.count % PAGE_LIMIT);
        const userLimit = parseInt(userData.count / PAGE_LIMIT, 10) + !!(userData.count % PAGE_LIMIT);
        callback({
          users: userData.results,
          userLimit,
          userPage: 1,
          teams: teamData.results,
          teamLimit,
          teamPage: 1,
        });
      });
    });
  }
  static searchTeamRanking(query, page, callback) {
    const encQuery = encodeURIComponent(query);
    const teamUrl = `${URL}/api/${LEAGUE}/team/?ordering=-mu&search=${encQuery}&page=${page}`;
    if ($.ajaxSettings && $.ajaxSettings.headers) {
      delete $.ajaxSettings.headers.Authorization;
    } // we should not require valid login for this. 
    $.get(teamUrl, (teamData) => {
      const teamLimit = parseInt(teamData.count / PAGE_LIMIT, 10) + !!(teamData.count % PAGE_LIMIT);
      callback({
        query,
        teams: teamData.results,
        teamLimit,
        teamPage: page,
      });
    });
    $.ajaxSetup({
      headers: { Authorization: `Bearer ${Cookies.get('token')}` },
    }); // re-add the authorization info
  }

  static searchTeam(query, page, callback) {
    const encQuery = encodeURIComponent(query);
    const teamUrl = `${URL}/api/${LEAGUE}/team/?search=${encQuery}&page=${page}`;
    $.get(teamUrl, (teamData) => {
      const teamLimit = parseInt(teamData.count / PAGE_LIMIT, 10) + !!(teamData.count % PAGE_LIMIT);
      callback({
        query,
        teams: teamData.results,
        teamLimit,
        teamPage: page,
      });
    });
  }

  static searchUser(query, page, callback) {
    const encQuery = encodeURIComponent(query);
    const userUrl = `${URL}/api/user/profile/?search=${encQuery}&page=${page}`;
    $.get(userUrl, (userData) => {
      callback({
        userPage: page,
        users: userData.results,
      });
    });
  }

  //---TEAM INFO---

  static getUserTeam(callback) {
    $.get(`${URL}/api/userteam/${encodeURIComponent(Cookies.get('username'))}/${LEAGUE}/`).done((data, status) => {
      Cookies.set('team_id', data.id);
      Cookies.set('team_name', data.name);

      $.get(`${URL}/api/${LEAGUE}/team/${data.id}/`).done((data, status) => {
        callback(data);
      });
    }).fail((xhr, status, error) => {
      // possibly dangerous???
      callback(null);
    });
  }

  // updates team
  static updateTeam(params, callback) {
    $.ajax({
      url: `${URL}/api/${LEAGUE}/team/${Cookies.get('team_id')}/`,
      data: JSON.stringify(params),
      type: 'PATCH',
      contentType: 'application/json',
      dataType: 'json',
    }).done((data, status) => {
      callback(true);
    }).fail((xhr, status, error) => {
      callback(false);
    });
  }

  //----USER FUNCTIONS----

  static createTeam(team_name, callback) {
    $.post(`${URL}/api/${LEAGUE}/team/`, { name: team_name }).done((data, status) => {
      Cookies.set('team_id', data.id);
      Cookies.set('team_name', data.name);
      callback(true);
    }).fail((xhr, status, error) => {
      callback(false);
    });
  }

  static joinTeam(secret_key, team_name, callback) {
    $.get(`${URL}/api/${LEAGUE}/team/?search=${encodeURIComponent(team_name)}`, (team_data, team_success) => {
      if (team_data.results.length === 0) return callback(false);
      $.ajax({
        url: `${URL}/api/${LEAGUE}/team/${team_data.results[0].id}/join/`,
        type: 'PATCH',
        data: { team_key: secret_key },
      }).done((data, status) => {
        Cookies.set('team_id', data.id);
        Cookies.set('team_name', data.name);
        callback(true);
      }).fail((xhr, status, error) => {
        callback(false);
      });
    });
  }

  static leaveTeam(callback) {
    $.ajax({
      url: `${URL}/api/${LEAGUE}/team/${Cookies.get('team_id')}/leave/`,
      type: 'PATCH',
    }).done((data, status) => {
      callback(true);
    }).fail((xhr, status, error) => {
      callback(false);
    });
  }

  static getUserProfile(callback) {
    Api.getProfileByUser(Cookies.get('username'), Api.setUserUrl(callback))
  }

  // essentially like python decorator, wraps 
  // sets user url before making call to that endpoint and passing on to callback
  static setUserUrl(callback) {
  	return function (data) {
  		Cookies.set('user_url', data.url);
  		$.get(data.url).done((data, success) => {
        callback(data);
      }).fail((xhr, status, error) => {
        console.log(error);
      });
  	}
  }

  static getProfileByUser(username, callback) {
  	console.log("update called")
  	if ($.ajaxSettings && $.ajaxSettings.headers) {
      delete $.ajaxSettings.headers.Authorization;
    } // we should not require valid login for this. 
    
    $.get(`${URL}/api/user/profile/${username}/`).done((data, status) => {
    	callback(data);
    }).fail((xhr, status, error) => {
        console.log(error);
    });

    $.ajaxSetup({
      headers: { Authorization: `Bearer ${Cookies.get('token')}` },
    });

  }

  static updateUser(profile, callback) {
    $.ajax({
      url: Cookies.get('user_url'),
      data: JSON.stringify(profile),
      type: 'PATCH',
      contentType: 'application/json',
      dataType: 'json',
    }).done((data, status) => {
      callback(true);
    }).fail((xhr, status, error) => {
      callback(false);
    });
  }

  //----SCRIMMAGING----

  static acceptScrimmage(scrimmage_id, callback) {
    $.ajax({
      url: `${URL}/api/${LEAGUE}/scrimmage/${scrimmage_id}/accept/`,
      method: 'PATCH',
    }).done((data, status) => {
      callback(true);
    }).fail((xhr, status, error) => {
      callback(false);
    });
  }

  static rejectScrimmage(scrimmage_id, callback) {
    $.ajax({
      url: `${URL}/api/${LEAGUE}/scrimmage/${scrimmage_id}/reject/`,
      method: 'PATCH',
    }).done((data, status) => {
      callback(true);
    }).fail((xhr, status, error) => {
      callback(false);
    });
  }

  static getScrimmageRequests(callback) {
    this.getAllTeamScrimmages((scrimmages) => {
      const requests = scrimmages.filter((scrimmage) => {
        if (scrimmage.status !== 'pending') {
          return false;
        }
        if (scrimmage.blue_team === scrimmage.red_team) {
          return true;
        }
        return scrimmage.requested_by !== parseInt(Cookies.get('team_id'), 10);
      }).map((scrimmage) => {
        const { blue_team, red_team } = scrimmage;
        return {
          id: scrimmage.id,
          team_id: scrimmage.requested_by,
          team: (Cookies.get('team_name') === red_team) ? blue_team : red_team,
        };
      });
      callback(requests);
    });
  }

  static requestScrimmage(teamId, callback) {
    $.post(`${URL}/api/${LEAGUE}/scrimmage/`, {
      red_team: Cookies.get('team_id'),
      blue_team: teamId,
      ranked: false,
    }).done((data, status) => {
      callback(teamId, true);
    }).fail(() => {
      callback(teamId, false);
    });
  }

  static getAllTeamScrimmages(callback) {
    $.get(`${URL}/api/${LEAGUE}/scrimmage/`, (data, succcess) => {
      callback(data.results);
    });
  }

  static getScrimmageHistory(callback) {
    const my_id = parseInt(Cookies.get('team_id'), 10);
    this.getAllTeamScrimmages((s) => {
      const requests = [];
      for (let i = 0; i < s.length; i++) {
        const on_red = s[i].red_team === Cookies.get('team_name');
        if (s[i].status === 'pending' && s[i].requested_by !== my_id) continue;

        if (s[i].status === 'redwon') s[i].status = on_red ? 'won' : 'lost';
        else if (s[i].status === 'bluewon') s[i].status = on_red ? 'lost' : 'won';
        s[i].status = s[i].status.charAt(0).toUpperCase() + s[i].status.slice(1);

        s[i].date = new Date(s[i].updated_at).toLocaleDateString();
        s[i].time = new Date(s[i].updated_at).toLocaleTimeString();

        s[i].team = on_red ? s[i].blue_team : s[i].red_team;
        s[i].color = on_red ? 'Red' : 'Blue';

        requests.push(s[i]);
      } callback(requests);
    });
  }


  //----REPLAYS?-----

  static getReplayFromURL(url, callback) {
    // If `https` not in current url, replace `https` with `http` in above
    if (window.location.href.indexOf('http://') > -1) {
      url = url.replace('https://', 'http://');
    }

    const oReq = new XMLHttpRequest();
    oReq.open('GET', url, true);
    oReq.responseType = 'arraybuffer';

    oReq.onload = function (oEvent) {
      callback(new Uint8Array(oReq.response));
    };

    oReq.send();

    // If `https` not in current url, replace `https` with `http` in above
    if (window.location.href.indexOf('http://') > -1) {
      url = url.replace('https://', 'http://');
    }

    $.get(url, (replay, super_sucess) => {
      $.ajaxSetup({
        headers: { Authorization: `Bearer ${Cookies.get('token')}` },
      });

      callback(replay);
    });
  }

  //----TOURNAMENTS----

  static getNextTournament(callback) {
    // TODO: actually use real API for this
    callback({
      "est_date_str": '8 PM EST on January 14, 2020',
      "seconds_until": (Date.parse(new Date('January 14, 2020 20:00:00')) - Date.parse(new Date())) / 1000,
      "tournament_name": "Sprint Tournament"
    });
  }

  static getTournaments(callback) {
    // const tournaments = [
    //   { name: 'final', challonge: 'bc_19_finals' },
    // ];
    const tournaments = [];

    callback(tournaments);
  }

  //----AUTHENTICATION----

  static logout(callback) {
    Cookies.set('token', '');
    Cookies.set('refresh', '');
    callback();
  }

  static loginCheck(callback) {
    if (DONOTREQUIRELOGIN) {
      callback(true);
      return;
    }
    $.ajaxSetup({
      headers: { Authorization: `Bearer ${Cookies.get('token')}` },
    });

    $.post(`${URL}/auth/token/verify/`, {
      token: Cookies.get('token'),
    }).done((data, status) => {
      callback(true);
    }).fail((xhr, status, error) => {
      callback(false);
    });
  }

  static verifyAccount(registrationKey, callback) {
    const userId = encodeURIComponent(Cookies.get('username'));
    $.post(`${URL}/api/verify/${userId}/verifyUser/`,
      {
        registration_key: registrationKey,
      }, (data, success) => { callback(data, success); });
  }


  static login(username, password, callback) {
    $.post(`${URL}/auth/token/`, {
      username,
      password,
    }).done((data, status) => {
      Cookies.set('token', data.access);
      Cookies.set('refresh', data.refresh);
      Cookies.set('username', username);

      $.ajaxSetup({
        headers: { Authorization: `Bearer ${Cookies.get('token')}` },
      });

      callback(data, true);
    }).fail((xhr, status, error) => {
      console.log(xhr);
      // if responseJSON is undefined, it is probably because the API is not configured
      // check that the API is indeed running on URL (localhost:8000 if local development)
      callback(xhr.responseJSON.detail, false);
    });
  }

  static register(email, username, password, first, last, dob, callback) {
    if ($.ajaxSettings && $.ajaxSettings.headers) {
      delete $.ajaxSettings.headers.Authorization;
    }

    $.post(`${URL}/api/user/`, {
      email,
      username,
      password,
      first_name: first,
      last_name: last,
      date_of_birth: dob,
    }).done((data, status) => {
      this.login(username, password, callback);
    }).fail((xhr, status, error) => {
      if (xhr.responseJSON.username) callback(xhr.responseJSON.username, false);
      else if (xhr.responseJSON.email) callback(xhr.responseJSON.email, false);
      else { callback('there was an error', false); }
    });
  }

  static doResetPassword(password, token, callback) {
    if ($.ajaxSettings && $.ajaxSettings.headers) {
      delete $.ajaxSettings.headers.Authorization;
    }

    $.post(`${URL}/api/password_reset/confirm/`,
      {
        password,
        token,
      }, (data, success) => { callback(data, success); });
  }

  static forgotPassword(email, callback) {
    if ($.ajaxSettings && $.ajaxSettings.headers) {
      delete $.ajaxSettings.headers.Authorization;
    }
    $.post(`${URL}/api/password_reset/`,
      {
        email,
      }, (data, success) => { callback(data, success); });
  }

  static pushTeamCode(code, callback) {
    this.updateTeam({ code }, callback);
  }
}

export default Api;
