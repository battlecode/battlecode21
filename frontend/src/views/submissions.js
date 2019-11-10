import React, { Component } from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import Api from '../api';



class Submissions extends Component {

    uploadData = () => {
        Api.newSubmission(this.state.selectedFile, null)
    }

    onChangeHandler=event=>{
        console.log(event.target.files[0])
        this.setState({
            selectedFile: event.target.files[0],
            loaded: 0,
        })
    }

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
            console.log(u);
            this.setState({ user: u });
            if (this.state.user.is_staff == true)
            {
                console.log("user is staff");
                // var is_staff_msg = document.getElementById("is_staff_msg");
                // is_staff_msg.innerHTML = "Staff";
            }
        }.bind(this));

    }

    componentDidMount() {
        Api.getCompilationStatus(this.gotStatus);
        Api.getTeamSubmissions(this.gotSubmissions);
        Api.getLeague(function (l) {
            console.log(l);
            this.setState({ league: l});
        }.bind(this));
    }

    gotStatus = (data) => {
        this.setState(data)
    }

    gotSubmissions = (data) => {
        let keys_last = ['last_1', 'last_2', 'last_3']
        let keys_tour = ['tour_final', 'tour_qual', 'tour_seed', 'tour_sprint']
        
        this.setState({numLastSubmissions: this.submissionHelper(keys_last, data)})
        this.setState({numTourSubmissions: this.submissionHelper(keys_tour, data)})
    }

    //makes api call for submission with each key in data, returns number not null
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

    setSubmissionData = (key, data) => {
        if (key.substring(0, 4) == "last") {
            if (this.state.lastSubmissions === null){
                this.setState({lastSubmissions: new Array(3)})
            }
        } else {
            if (this.state.tourSubmissions === null){
                this.setState({tourSubmissions: new Array(4)})
            }
        }

        switch (key) {
            case 'last_1':
                this.state.numLastLoaded++
                this.state.lastSubmissions[0] = data
                break
            case 'last_2':
                this.state.numLastLoaded++
                this.state.lastSubmissions[1] = data
                break
            case 'last_3':
                this.state.numLastLoaded++
                this.state.lastSubmissions[2] = data
                break
            case 'tour_sprint':
                this.state.numTourLoaded++
                this.state.tourSubmissions[0] = ['Sprint', data]
                break
            case 'tour_seed':
                this.state.numTourLoaded++
                this.state.tourSubmissions[1] = ['Seed', data]
                break
            case 'tour_qual':
                this.state.numTourLoaded++
                this.state.tourSubmissions[2] = ['Qual', data]
                break
            case 'tour_final':
                this.state.numTourLoaded++
                this.state.tourSubmissions[3] = ['Final', data]
                break
        }

        if (this.state.numTourLoaded === this.state.numTourSubmissions && this.state.numLastLoaded === this.state.numLastSubmissions) {
            this.forceUpdate()
        }
    }

    // enable iff game active or user is staff
    isSubmissionEnabled()
    {
        if (this.state.user.is_staff == true) {
            return true;
        }
        if (this.state.league.game_released == true) {
            return true;
        }
        return false;
    }

    // return div for submitting files, should be able to disable this when submissions are not being accepts
    renderHelperSubmissionForm() {
        if (this.isSubmissionEnabled()) {
            let status_str = ""
            switch (this.state.status) {
                case 0:
                    status_str = "Compiling!"
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
            return (
                <div className="card">
                    <div className="header">
                        <h4 className="title">Submit Code</h4>
                    </div>
                    <div className="content">
                        <input type="file" accept=".zip" onChange={this.onChangeHandler}/>
                        <button onClick={this.uploadData} className="btn btn-info btn-fill"> Submit </button>
                        <p> {status_str} </p>
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
                        <p>Game not released; check back in January!</p>
                    </div>
                </div>
            )
        }
    }

    renderHelperLastTable() {
        if (this.state.numLastSubmissions == 0) {
            if (this.state.status == 0) {
                return (
                    <p>
                    Your code is currently compiling—you'll see it here if it finishes successfully.
                    </p>
                )  
            } else{ 
                return (
                    <p>
                    You haven't submitted any code yet!
                    </p>
                )  
            }
        } else if (this.state.lastSubmissions !== null) {
            const submissionRows = this.state.lastSubmissions.map(submission => {
                return (
                    <tr key={ submission.id }>
                        <td>{ (new Date(submission.submitted_at)).toLocaleString() }</td>
                    </tr>
                )
            })

            this.state.lastSubmissions.forEach( function(submission) {
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
        } else {
            return (
                <p>
                Loading submissions...
                </p>
            )
        }
        
    }

    renderHelperTourTable() {
        if (this.state.numLastSubmissions == 0) {
            return (
                <p>
                Code submitted to tournaments will appear here after the tournament.
                </p>
            ) 
        } else if (this.state.tourSubmissions !== null) {
            let tourRows = this.state.tourSubmissions.map(submission => {
                return (
                    <tr key={ submission[1].id }>
                        <td>{ (submission[0]) }</td>
                        <td>{ (new Date(submission[1].submitted_at)).toLocaleString() }</td>
                    </tr>
                )
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
        } else {
            return (
                <p>
                Loading submissions...
                </p>
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
                                    <h4 className="title">Latest Submission</h4>
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
