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
            upload_status: -1
        };
        Api.getUserProfile(function (u) {
            this.setState({ user: u });
        }.bind(this));

    }

    componentDidMount() {
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
    uploadData = () => {
        // 'upload_status_cookie' in Cookies is used to communicate between the functions in api.js and those in submissions.js. It lets us keep track of the upload process for submissions, and all the http requests involved. (Note that this is different than a submission's compile_status in the database.)
        // A value of 0 indicates that the submission is still in progress.
        // When a submission finishes, api.js changes this value to something else.
        Cookies.set('upload_status_cookie', 10)
        // The upload_status state is used internally by this component.
        // (Currently, it mirrors upload_status_cookie, but is part of state to make working with React easier.)
        this.setState({upload_status: 10})

        // Concurrent upload processes can be problematic; we've made the decision to disable concurrency.
        // This is achieved by refreshing the submission upload components, which have buttons disabled while upload_status is 0.
        this.renderHelperSubmissionForm()
        this.renderHelperSubmissionStatus()

        Api.newSubmission(this.state.selectedFile, null)

        // The method in api.js will change Cookies' upload_status_cookie during the process of an upload.
        // To check changes, we poll periodically.
        this.interval = setInterval(() => {
            let upload_status_cookie_value = Cookies.get('upload_status_cookie');
            if (upload_status_cookie_value != 10) {
                // Submission process terminated (see api.js).

                // refresh the submission status, for use on this component
                this.setState({upload_status: upload_status_cookie_value})

                // refresh the submission button, etc, to allow for a new submission
                this.renderHelperSubmissionForm()
                this.renderHelperSubmissionStatus()
                
                // refresh team submission tables, to display the submission that just occured
                Api.getTeamSubmissions(this.gotSubmissions);
                this.renderHelperCurrentTable()
                this.renderHelperLastTable()

                // Done waiting for changes to upload_status_cookie, so stop polling.
                clearInterval(this.interval)
            }
        }, 1000); // Poll every second
    }

    // change handler called when file is selected
    onChangeHandler = event => {
        console.log(event.target.files[0])
        this.setState({
            selectedFile: event.target.files[0],
            loaded: 0,
            upload_status: -1
        })
        this.renderHelperSubmissionForm()
        this.renderHelperSubmissionStatus()
    }


    //---GETTING TEAMS SUBMISSION DATA----
    KEYS_CURRENT = ['compiling'] 
    KEYS_LAST = ['last_1', 'last_2', 'last_3']
    KEYS_TOUR = ['tour_final', 'tour_qual', 'tour_seed', 'tour_sprint', 'tour_hs', 'tour_intl_qual', 'tour_newbie']

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
                    add_data = ['Sprint 1', data]
                    break
                case 'tour_seed':
                    add_data = ['Sprint 2', data]
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
                if (this.state.upload_status != 10) { 
                    button = <button style={{float: "right"}} onClick={this.uploadData} className={ btn_class }> Submit </button>
                }
            }
            // Make sure to disable concurrent submission uploads.
            if (this.state.upload_status != 10) { 
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
                        {/* TODO could this paragraph be dynamically filled? that'd be amazing */}
                        <p>
                            <b>The submission deadline for Sprint Tour 2 is 7 pm ET on Monday 1/18.</b> Submit your code using the button below. For peace of mind, submit 15 minutes before and make sure it compiles and shows up under "Latest Submissions."
                            We will have a 5-minute grace period; if you're having trouble submitting, send us your code on Discord before 7:05. If the code you submit to us on Discord has only minor differences to the code submitted on time through the website (e.g., 1 or 2 lines), we will accept it. <b>We will not accept anything submitted after 7:05 pm.</b>
                        </p>
                        <p>
                            Create a <code>zip</code> file of your robot player, and submit it below. The submission format should be a zip file containing a single folder (which is your package name), which should contain RobotPlayer.java and any other code you have written, for example:
                            <pre><code>
                                submission.zip --> examplefuncsplayer --> RobotPlayer.java, FooBar.java
                            </code></pre>
                        </p>
                        <p>
                            Please <b><i>stay on this page until the card below indicates success.</i></b> To double-check that your code has been submitted, you can download at "Latest Submissions".
                        </p>
                        <p>
                            If your bot does not compile, <b>see the "Compiling Tips" section at the bottom of this page.</b>
                        </p>
                        {file_button}
                        {file_button_2}
                        {button}
                        {/* <p id="upload_status" className="text-center category"> {status_str}</p> */}
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

    // Shows the status of a current submission upload in progress.
    // (see uploadData() for more explanation)
    renderHelperSubmissionStatus() {
        if (this.isSubmissionEnabled()) {
            let status_str = ""
            switch (this.state.upload_status) {
                case -1:
                    status_str = "Waiting to start submission..."
                    break
                case 10:
                    status_str = "Currently submitting..."
                    break
                case 11:
                    status_str = "Successfully queued for compilation!"
                    break
                case 12:
                    status_str = "Files cannot be submitted without a team."
                    break
                case 13:
                    status_str = "Submitting failed. Try re-submitting your code."
                    break
                default:
                    status_str = ""
                    break
            }
            
            return (
                <div className="card">
                    <div className="content">
                        <p id="upload_status" className="text-center category"> {status_str}</p>
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
            return (
                <p>
                You haven't submitted any code yet!
                </p>
            )  
        } else {
            const submissionRows = this.state.currentSubmission.map((submission, index) => {
                if (Object.keys(submission).length === 0) {
                    return (
                        <tr><td> <div className="btn btn-xs" style={{visibility: "hidden"}}>Loading...</div></td><td></td></tr>
                    )
                } else { 
                    let status_str = ""
                    let download_button = <button className="btn btn-xs" onClick={() => this.onSubFileRequest(submission.id, index + 1)}>Download</button>
                    switch (submission.compilation_status) {
                        case 0:
                            status_str = "Submission initialized, but not yet uploaded... If this persists, try re-submitting your code. Also, make sure to stay on this page."
                            download_button = ""
                            break
                        case 1:
                            status_str = "Successfully submitted and compiled!"
                            break
                        case 2:
                            status_str = "Submitted, but compiler threw a compile error. Fix and re-submit your code."
                            break
                        case 3:
                            status_str = "Internal server error. Try re-submitting your code."
                            break
                        case 4:
                            status_str = "Code uploaded, but not yet queued for compilation... If this persists, try re-submitting your code."
                            break
                        case 5:
                            // TODO a dedicated refresh button, that refreshes only these tables, would be cool
                            status_str = "Code queued for compilation -- check back and refresh for updates."
                            break    
                        default:
                            status_str = ""
                            break
                    }
                    return (
                        <tr key={ submission.id }>
                            <td>{ (new Date(submission.submitted_at)).toLocaleString() }</td>
                            <td>{ status_str }</td>
                            <td>{ download_button } </td>                        
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
            return (
                <p>
                You haven't had any successful submissions yet! (If you have code being submitted, you'll see it here if it finishes successfully.)
                </p>
            )  
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

    renderCompilingTips() {
        return (
            <div className="card">
            <div className="header">
                <h4 className="title">Compiling Tips</h4>
            </div>
                <div className="content">
                    <p>
                        <ul>
                            <li>
                                Submission format: Check that your zip contains exactly one directory, and your code is inside that directory.
                            </li>
                            <li>
                                Non-ASCII characters: Ensure your code is completely ASCII. In the past we have had compile errors due to comments containing diacritic characters (áéíóú).
                            </li>
                            <li>
                                Make sure you only import from your own bot, and from java. packages. In particular, do not use javax, javafx, and watch out for importing from other versions of your bot (which may work locally, but will not work on our servers as you can only submit one folder).
                            </li>
                        </ul>
                    </p>
                </div>
            </div>
        )
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
                            { this.renderCompilingTips() }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Submissions;
