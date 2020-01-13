import React, { Component } from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import Api from '../api';



class Submissions extends Component {

    //----INITIALIZATION----
    constructor(props) {
        super(props);
        this.state = {
            selectedFile: null,
            lastSubmissions: null,
            tourSubmissions: null,
            numLastSubmissions: 0,
            numLastLoaded: 0,
            numTourSubmissions: 0,
            numTourLoaded: 0,
            user: {},
            league: {}
        };
        Api.getUserProfile(function (u) {
            this.setState({ user: u });
        }.bind(this));

    }

    componentDidMount() {
        Api.getCompilationStatus(this.gotStatus);
        Api.getTeamSubmissions(this.gotSubmissions);
        Api.getLeague(function (l) {
            this.setState({ league: l});
        }.bind(this));
    }

    //----UPLOADING FILES----

    // makes an api call to upload the selected file
    uploadData = () => {
        Api.newSubmission(this.state.selectedFile, null)
    }

    // change handler called when file is selected
    onChangeHandler = event => {
        console.log(event.target.files[0])
        this.setState({
            selectedFile: event.target.files[0],
            loaded: 0,
        })
    }


    //---GETTING TEAMS SUBMISSION DATA----
    KEYS_LAST = ['last_1', 'last_2', 'last_3']
    KEYS_TOUR = ['tour_final', 'tour_qual', 'tour_seed', 'tour_sprint']

    // called when status of teams compilation request is received 
    // 0 = in progress, 1 = succeeded, 2 = failed, 3 = server failed
    gotStatus = (data) => {
        this.setState(data)
    }

    // called when submission data is initially received
    // this will be maps of the label of type of submission to submission id
    // this function then makes calles to get the specific data for each submission
    gotSubmissions = (data) => {
        console.log(Submissions.KEYS_LAST)

        this.setState({lastSubmissions: new Array(this.submissionHelper(this.KEYS_LAST, data)).fill({})})
        this.setState({tourSubmissions: new Array(this.submissionHelper(this.KEYS_TOUR, data)).fill([])})
    }

    // makes api call for submission with each key in data, returns the number of submissions 
    // that actually exist in the data
    submissionHelper(keys, data) {
        let null_count = 0
        for (var i = 0; i < keys.length; i++) {
            if (data[keys[i]] !== null) {
                Api.getSubmission(data[keys[i]], this.setSubmissionData, keys[i])
                null_count++
            }
        }

        return null_count
    }

    // sets submission data for the given key, if all submissions have been found force updates state
    setSubmissionData = (key, data) => {

        let state_key, index, add_data
        if (this.KEYS_LAST.includes(key)) {
            state_key = "lastSubmissions"
            add_data = data
            switch (key) {
                case 'last_1':
                    index = 0
                    break
                case 'last_2':
                    index = 1
                    break
                case 'last_3':
                    index = 2
                    break
            }
        } else {
            state_key = "tourSubmissions"
            switch (key) {
                case 'tour_sprint':
                    index = 0
                    add_data = ['Sprint', data]
                    break
                case 'tour_seed':
                    index = 1
                    add_data = ['Seed', data]
                    break
                case 'tour_qual':
                    index = 2
                    add_data = ['Qual', data]
                    break
                case 'tour_final':
                    index = 3
                    add_data = ['Final', data]
                    break
            }
        }

        const arr = this.state[state_key]
        let newArr = arr.slice(0, index)
        newArr.push(add_data)
        this.setState({[state_key]: newArr.concat(arr.slice(index + 1))})
        console.log(this.state)

    }

    // Downloads the file for given submission id
    onSubFileRequest = (subId, fileNameAddendum) => {
        Api.downloadSubmission(subId, fileNameAddendum, null)
    }

    //----PERMISSIONS----
    // enable iff game active or user is staff
    isSubmissionEnabled() {
        if (this.state.user.is_staff == true) {
            return true;
        }
        if (this.state.league.game_released == true) {
            return true;
        }
        return false;
    }

    //----RENDERING----

    // return div for submitting files, should be able to disable this when submissions are not being accepts
    renderHelperSubmissionForm() {
        if (this.isSubmissionEnabled()) {
            let status_str = ""
            switch (this.state.status) {
                case 0:
                    status_str = "Currently compiling..."
                    break
                case 1:
                    status_str = "Successfully compiled!"
                    break
                case 2:
                    status_str = "Compilation failed."
                    break
                case 3:
                    status_str = "Internal server error. Try re-submitting your code."
                    break
                default:
                    status_str = ""
                    break
            }
            let btn_class = "btn btn" 
            let file_label = "No file chosen."
            let button = <button disabled style={{float: "right"}} onClick={this.uploadData} className={ btn_class }> Submit </button>
            if (this.state.selectedFile !== null) {
                btn_class += " btn-info btn-fill" 
                file_label = this.state.selectedFile["name"]
                button = <button style={{float: "right"}} onClick={this.uploadData} className={ btn_class }> Submit </button>
            }


            return (
                <div className="card">
                    <div className="header">
                        <h4 className="title">Submit Code</h4>
                    </div>
                    <div className="content">
                        <p>
                            <b>The deadline for the Sprint tournament is at 7 pm EST (less than 2 hours from now!). Submit your code using the button below.</b> For peace of mind, submit 15 minutes before and make sure it compiles and shows up under "Latest Submissions."
                        </p>
                        <p>
                            Create a <code>zip</code> file of your robot player. The <code>zip</code> file can only contain 1 player package, and needs to have a <code>RobotPlayer.java</code> file. Submit the <code>zip</code> file below.
                        </p>
                        <label htmlFor="file_upload">
                            <div className="btn"> Choose File </div> <span style={ { textTransform: 'none', marginLeft: '10px', fontSize: '14px'} }> {file_label} </span>
                        </label>
                        <input id="file_upload" type="file" accept=".zip" onChange={this.onChangeHandler} style={{display: "none"}}/>
                        {button}
                        <p className="text-center category"> {status_str}</p>
                    </div>
                </div>
            )
        }
        else {
            return (
                <div className="card">
                    <div className="header">
                        <h4 className="title">Submit Code</h4>
                    </div>
                    <div className="content">
                        <p>Submissions are now disabled! Check back later.</p>
                    </div>
                </div>
            )
        }
    }

    //reder helper for table containing the team's latest submissions
    renderHelperLastTable() {
        if (this.state.lastSubmissions === null) {
            return (
                <p className="text-center category">
                Loading submissions...<br/><br/>
                </p>
            )
        } else if (this.state.lastSubmissions.length == 0) {
            if (this.state.status == 0) {
                return (
                    <p>
                    Your code is currently compiling—you'll see it here if it finishes successfully.
                    </p>
                )  
            } else { 
                return (
                    <p>
                    You haven't submitted any code yet!
                    </p>
                )  
            }
        } else {
            const submissionRows = this.state.lastSubmissions.map((submission, index) => {
                if (Object.keys(submission).length === 0) {
                    return (
                        <tr><td> <div className="btn btn-xs" style={{visibility: "hidden"}}>Loading...</div></td><td></td></tr>
                    )
                } else { 
                    return (
                        <tr key={ submission.id }>
                            <td>{ (new Date(submission.submitted_at)).toLocaleString() }</td>
                            <td> <button className="btn btn-xs" onClick={() => this.onSubFileRequest(submission.id, index + 1)}>Download</button> </td>                        
                        </tr>
                    ) 
                }
            })

            return (
                <table className="table table-hover table-striped">
                    <thead>
                    <tr>
                        <th>Submission at</th>
                    </tr>
                    </thead>
                    <tbody>
                    { submissionRows }
                    </tbody>
                </table>
            )
        }
        
    }

    //reder helper for table containing the team's tournament submissions
    renderHelperTourTable() {
        if (this.state.tourSubmissions === null){
            return (
                <p className="text-center category">
                Loading submissions...<br/><br/>
                </p>
            )
        } else if (this.state.tourSubmissions.length === 0) {
            return (
                <p>
                Code submitted to tournaments will appear here after the tournament.
                </p>
            ) 
        } else {
            let tourRows = this.state.tourSubmissions.map(submission => {
                if (submission.length === 0) {
                    return (
                        <tr><td> <div className="btn btn-xs" style={{visibility: "hidden"}}>Loading...</div></td><td></td><td></td></tr>
                    )
                } else {
                    return(
                        <tr key={ submission[1].id }>
                            <td>{ (submission[0]) }</td>
                            <td>{ (new Date(submission[1].submitted_at)).toLocaleString() }</td>
                            <td> <button className="btn btn-xs" onClick={() => this.onSubFileRequest(submission[1].id, submission[0])}>Download</button> </td>
                        </tr>
                    )
                }   
            })


            return (
                <table className="table table-hover table-striped">
                    <thead>
                    <tr>
                        <th>Tournament</th>
                        <th>Submission Time</th>
                    </tr>
                    </thead>
                    <tbody>
                    { tourRows }
                    </tbody>
                </table>
            )
        }
    }

    render() {
        return (
            <div className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-12">
                            { this.renderHelperSubmissionForm() }
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Latest Submissions</h4>
                                </div>
                                <div className="content">
                                    { this.renderHelperLastTable() }
                                </div>
                            </div>
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Tournament Submissions</h4>
                                </div>
                                <div className="content">
                                    { this.renderHelperTourTable() }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Submissions;
