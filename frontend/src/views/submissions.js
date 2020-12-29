import React, { Component } from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import Api from '../api';
import * as Cookies from 'js-cookie';



class Submissions extends Component {

    //----INITIALIZATION----
    constructor(props) {
        super(props);
        this.state = {
            selectedFile: null,
            currentSubmission: null,
            lastSubmissions: null,
            tourSubmissions: null,
            numLastSubmissions: 0,
            numLastLoaded: 0,
            numTourSubmissions: 0,
            numTourLoaded: 0,
            user: {},
            league: {},
            sub_status: -1
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

    componentWillUnmount() {
        // don't leak memory
        clearInterval(this.interval)
    }

    //----UPLOADING FILES----


    // makes an api call to upload the selected file
    // TODO clean this method up
    // TODO add explanation
    // TODO update how we display the most recent submission (including its status.)
    // Also now that we have new statuses, we need to figue out what we should display in the frontend for each of them.
    // (eg if user navigates away before the upload link is returned / before the upload finishes, or if submission fails to get queued/compiled,
    // what should the user do? what should we tell them?)
    uploadData = () => {
        // let status_str = "Submitting..."
        Cookies.set('submitting', 1)
        // console.log("submitting...")
        this.setState({sub_status: 0})
        this.renderHelperSubmissionForm()
        this.renderHelperSubmissionStatus()

        Api.newSubmission(this.state.selectedFile, null)

        this.interval = setInterval(() => {
            if (Cookies.get('submitting') != 1) {
                // console.log("out of time loop")

                // refresh the submission button and status
                this.setState({sub_status: 1})
                this.renderHelperSubmissionForm()
                this.renderHelperSubmissionStatus()
                
                // refresh team submission listing
                Api.getTeamSubmissions(this.gotSubmissions);
                this.renderHelperLastTable()

                clearInterval(this.interval)
            }
            else {
                // console.log("in time loop")
            }
        }, 1000);
    }

    // change handler called when file is selected
    onChangeHandler = event => {
        console.log(event.target.files[0])
        this.setState({
            selectedFile: event.target.files[0],
            loaded: 0,
            sub_status: -1
        })
        this.renderHelperSubmissionForm()
        this.renderHelperSubmissionStatus()
    }


    //---GETTING TEAMS SUBMISSION DATA----
    KEYS_CURRENT = ['compiling'] 
    KEYS_LAST = ['last_1', 'last_2', 'last_3']
    KEYS_TOUR = ['tour_final', 'tour_qual', 'tour_seed', 'tour_sprint', 'tour_hs', 'tour_intl_qual', 'tour_newbie']

    // called when status of teams compilation request is received 
    // 0 = in progress, 1 = succeeded, 2 = failed, 3 = server failed
    gotStatus = (data) => {
        this.setState(data)
    }

    // called when submission data is initially received
    // this will be maps of the label of type of submission to submission id
    // this function then makes calles to get the specific data for each submission
    gotSubmissions = (data) => {
        this.setState({currentSubmission: new Array(this.submissionHelper(this.KEYS_CURRENT, data)).fill({})})
        this.setState({lastSubmissions: new Array(this.submissionHelper(this.KEYS_LAST, data)).fill({})})
        this.setState({tourSubmissions: new Array(this.submissionHelper(this.KEYS_TOUR, data)).fill([])})
    }

    // makes api call for submission with each key in data, returns the number of submissions 
    // that actually exist in the data
    submissionHelper(keys, data) {
        let null_count = 0
        for (var i = 0; i < keys.length; i++) {
            if (data[keys[i]] !== null && data[keys[i]] !== undefined) {
                Api.getSubmission(data[keys[i]], this.setSubmissionData, keys[i])
                null_count++
            }
        }

        return null_count
    }

    // sets submission data for the given key, if all submissions have been found force updates state
    setSubmissionData = (key, data) => {

        let index, add_data
        if (this.KEYS_CURRENT.includes(key)) {
            index = 0
            const arr = this.state["currentSubmission"]
            let newArr = arr.slice(0, index)
            newArr.push(data)
            this.setState({["currentSubmission"]: newArr.concat(arr.slice(index + 1))})
        } else if (this.KEYS_LAST.includes(key)) {
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

            const arr = this.state["lastSubmissions"]
            let newArr = arr.slice(0, index)
            newArr.push(data)
            this.setState({["lastSubmissions"]: newArr.concat(arr.slice(index + 1))})
        } else {
            switch (key) {
                case 'tour_sprint':
                    add_data = ['Sprint', data]
                    break
                case 'tour_seed':
                    add_data = ['Seeding', data]
                    break
                case 'tour_qual':
                    add_data = ['Qualifying', data]
                    break
                case 'tour_final':
                    add_data = ['Final', data]
                    break
                case 'tour_hs':
                    add_data = ['High School', data]
                    break
                case 'tour_intl_qual':
                    add_data = ['International Qualifying', data]
                    break
                case 'tour_newbie':
                    add_data = ['Newbie', data]
                    break
            }

            const arr = this.state["tourSubmissions"]
            let end = arr.slice(1)
            end.push(add_data)
            this.setState({["tourSubmissions"]: end})

        }

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
        if (this.state.league.submissions_enabled == true && this.state.league.game_released == true) {
            return true;
        }
        return false;
    }

    //----RENDERING----

    // return div for submitting files, should be able to disable this when submissions are not being accepts
    renderHelperSubmissionForm() {
        if (this.isSubmissionEnabled()) {
            let status_str = ""
            let btn_class = "btn btn" 
            let file_label = "No file chosen."
            let file_button_sub = <div> </div>
            let file_button = <div></div>
            let file_button_2= <div></div>
            
            let button = <button disabled style={{float: "right"}} className={ btn_class }> Submit </button>
            if (this.state.selectedFile !== null) {
                btn_class += " btn-info btn-fill" 
                file_label = this.state.selectedFile["name"]
                if (this.state.sub_status != 0) { 
                    button = <button style={{float: "right"}} onClick={this.uploadData} className={ btn_class }> Submit </button>
                }
            }
            if (this.state.sub_status != 0) { 
                file_button_sub = <div className="btn"> Choose File </div>
                file_button = <label htmlFor="file_upload">
                {file_button_sub} <span style={ { textTransform: 'none', marginLeft: '10px', fontSize: '14px'} }> {file_label} </span> </label>
                file_button_2 = <input id="file_upload" type="file" accept=".zip" onChange={this.onChangeHandler} style={{display: "none"}}></input>
            }

            return (
                <div className="card">
                    <div className="header">
                        <h4 className="title">Submit Code</h4>
                    </div>
                    <div className="content">
                        {/* <p>
                            <b>The final submission deadline is 7 pm EST on Wednesday 1/29 (which is s o o n).</b> This applies to the Final, Newbie and High School tournaments. Submit your code using the button below. For peace of mind, submit 15 minutes before and make sure it compiles and shows up 
                            under "Latest Submissions."
                            We will have a 5-minute grace period; if you're having trouble submitting, send us your code on Discord before 7:05. If the code you submit to us on Discord has only minor differences to the code submitted on time through the website (e.g., 1 or 2 lines), we will accept it. <b>We will not accept anything submitted after 7:05 pm.</b>
                        </p> */}
                        <p>
                            Create a <code>zip</code> file of your robot player. The <code>zip</code> file can only contain 1 player package, and needs to have a <code>RobotPlayer.java</code> file. Submit the <code>zip</code> file below. Ensure that you're not importing any packages not included in the <code>zip</code> file, or your code won't compile.
                        </p><p>
                        Please <b><i>stay on this page until the card below indicates success.</i></b> To double-check that your code has been submitted, you can download at "Latest Submissions".

                        </p>
                        {file_button}
                        {file_button_2}
                        {button}
                        {/* <p id="sub_status" className="text-center category"> {status_str}</p> */}
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
                        <p>Submissions are currently disabled! Check back later.</p>
                    </div>
                </div>
            )
        }
    }

    renderHelperSubmissionStatus() {
        if (this.isSubmissionEnabled()) {
            let status_str = ""
            switch (this.state.sub_status) {
                case -1:
                    status_str = "Waiting to start submission..."
                    break
                case 0:
                    status_str = "Currently submitting..."
                    break
                case 1:
                    status_str = "Successfully submitted!"
                    break
                case 2:
                    status_str = "Submission failed."
                    break
                case 3:
                    status_str = "Internal server error. Try re-submitting your code."
                    break
                default:
                    status_str = ""
                    break
            }
            
            return (
                <div className="card">
                    <div className="content">
                        <p id="sub_status" className="text-center category"> {status_str}</p>
                    </div>
                </div>
            )
        }
    }

    //reder helper for table containing the team's latest submission
    renderHelperCurrentTable() {
        if (this.state.currentSubmission === null) {
            return (
                <p className="text-center category">
                Loading submissions...<br/><br/>
                </p>
            )
        } else if (this.state.currentSubmission.length == 0) {
            if (this.state.status == 0) {
                return (
                    <p>
                    Your code is being submitted -- you'll see it here if it finishes successfully.
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
            const submissionRows = this.state.currentSubmission.map((submission, index) => {
                if (Object.keys(submission).length === 0) {
                    return (
                        <tr><td> <div className="btn btn-xs" style={{visibility: "hidden"}}>Loading...</div></td><td></td></tr>
                    )
                } else { 
                    let status_str = ""
                    switch (submission.status) {
                        // TODO fill in rest of cases, revise strings
                        // TODO don't show the download button in some cases
                        case -1:
                            status_str = "Waiting to start submission..."
                            break
                        case 0:
                            status_str = "Currently submitting..."
                            break
                        case 1:
                            status_str = "Successfully submitted!"
                            break
                        case 2:
                            status_str = "Submission failed."
                            break
                        case 3:
                            status_str = "Internal server error. Try re-submitting your code."
                            break
                        default:
                            status_str = "A really long other string. TBD, fill in the rest of cases"
                            break
                    }
                    return (
                        <tr key={ submission.id }>
                            <td>{ (new Date(submission.submitted_at)).toLocaleString() }</td>
                            <td>{ status_str }</td>
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
                        <th>Status</th>
                        <th>Download Btn</th>
                    </tr>
                    </thead>
                    <tbody>
                    { submissionRows }
                    </tbody>
                </table>
            )
        }
        
    }

    //reder helper for table containing the team's latest successfully compiled submissions
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
                    Your code is being submitted -- you'll see it here if it finishes successfully.
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
                            { this.renderHelperSubmissionStatus() }
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Latest Submission</h4>
                                </div>
                                <div className="content">
                                    { this.renderHelperCurrentTable() }
                                </div>

                                <div className="header">
                                    <h4 className="title">Latest Successfully Compiled Submissions</h4>
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
