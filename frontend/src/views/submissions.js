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
            selectedFile: null
        }
    }

    componentDidMount() {
        Api.getCompilationStatus(this.gotStatus)
        Api.getTeamSubmissions(this.gotSubmissions)
    }

    gotStatus = (data) => {
        this.setState(data)
    }

    gotSubmissions = (data) => {
        let lastSubmissions = [data['last_1'], data['last_2'], data['last_3']]
        let tourSubmissions = {
            'final': data['tour_final'],
            'qual': data['tour_qual'],
            'seed': data['tour_seed'],
            'sprint': data['tour_sprint']
        }
        this.setState({"teamSubmissions": data})
    }




    // return div for submitting files, should be able to disable this when submissions are not being accepts
    renderHelperSubmissionForm(enabled) {
        if (enabled) {
            return (
                <div className="card">
                    <div className="header">
                        <h4 className="title">Submit Code</h4>
                    </div>
                    <div className="content">
                        <input type="file" accept=".zip" onChange={this.onChangeHandler}/>
                        <button onClick={this.uploadData} className="btn btn-info btn-fill"> Submit </button>
                    </div>
                </div>
            )
        } else {
            return ""
        }
    }

    renderHelperSubmissionRow(submission) {

    }

    render() {
        return (
            <div className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-12">
                            { this.renderHelperSubmissionForm(true) }
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Latest Submission</h4>
                                </div>
                                <div className="content">
                                    <p>
                                        Here, you will be able to see the source code of your latest submission!
                                    </p>
                                </div>
                            </div>
                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Tournament Submissions</h4>
                                </div>
                                <div className="content">
                                    <p>
                                        Here, you will be able to see your submission that is associated with each tournament.
                                    </p>
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
