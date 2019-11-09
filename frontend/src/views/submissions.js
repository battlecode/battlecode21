import React, { Component } from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';


class Submissions extends Component {

    uploadData = (file) => {
        console.log("hiiii")
    }


    // return div for submitting files, should be able to disable this when submissions are not being accepts
    renderHelperSubmissionForm(enabled) {
        if (enabled) {
            return (
                <div className="card">
                    <input type="file" accept=".zip" />
                    <button onClick={this.uploadData}> Submit </button>
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
