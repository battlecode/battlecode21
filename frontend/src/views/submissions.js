import React, { Component } from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import Api from '../api';



class Submissions extends Component {

    componentDidMount() {
        Api.getCompilationStatus(this.compilationData)
    }

    uploadData = (file) => {
        console.log("hiiii")
    }

    compilationData = (data) => {
        console.log(data)
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
                        <input type="file" accept=".zip" />
                        <button onClick={this.uploadData} className="btn btn-info btn-fill"> Submit </button>
                    </div>
                </div>
            )
        } else {
            return ""
        }
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
