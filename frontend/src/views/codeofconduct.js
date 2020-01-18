import React, { Component } from 'react';
import styled from 'styled-components';

const He = styled.h5`
  font-weight: bold;
  font-size:1.3em;
`;

const Hee = styled.h5`
  text-decoration:underline;
  font-size:1.2em;
`;

class CodeOfConduct extends Component {

    render() {
        return (
            <div className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-12">

                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Code of Conduct</h4>
                                </div>
                                <div className="content">
                                <p>Maintaining a safe and inclusive environment for competitors is a top priority for Battlecode. Battlecode
        strictly follows <a class="page-link" href="https://policies-procedures.mit.edu/">MIT's Policies</a> on responsible and ethical conduct. If someone makes you or anyone else feel unsafe or unwelcome, please
        report it to Teh Devs as soon as possible. Harassment and other code of conduct violations reduce the value
        of the competition for everyone. People like you make our community a better place, and we want you to be
        happy here.
    </p>
    <p>
    <ul>
        <li><b>Harrassment:</b> Battlecode is dedicated to providing a harassment-free experience for everyone, regardless
            of gender, gender identity and expression, sexual orientation, disability, physical appearance, body
            size, race, age, religion, or nationality. We do not tolerate harassment of competitors in any form.</li>
        <li><b>Bug Exploitation:</b> Battlecode is a rapidly-growing competition with many infrastructural challenges. Let
            us know as soon as possible upon discovery of a potential security issue. Knowingly exposing
            vulnerabilities to the public as anything more than a minimal proof of concept is not allowed.
            Intentionally exploiting bugs that compromise the fairness of scrimmages and tournaments, or the
            security of the competition, is not tolerated.</li>
        <li><b>Academic Misconduct:</b> Academic misconduct is conduct by which a person misrepresents their academic
            accomplishments, or impedes others' opportunities of being judged fairly for their academic work. This
            includes but is not limited to plagiarism and knowingly allowing another person to represent your work
            as their own. Particularly, sharing bot code between teams falls under this clause, and is thus not allowed (even if 
            no team ends up using the shared code in their final submission). Open-sourcing tools, such as visualizers or map makers,
            is, however, explicitly allowed.</li>
    </ul>
    </p>
    <p>
        If anything in this policy is unclear, please reach out to us at <code>battlecode@mit.edu</code>, or on Discord.
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

export default CodeOfConduct;
