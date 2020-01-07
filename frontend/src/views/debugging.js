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

class Issues extends Component {
    render() {
        return (
            <div className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-12">

                            <div className="card">
                                <div className="header">
                                    <h4 className="title">Debugging with IntelliJ</h4>
                                </div>
                                <div className="content">
                                <p>
                                    Add the gradle run task as a configuration
                                    <ul>
                                        <li>In the dropdown near the hammer, play, and bug icons, select <code>edit configurations"</code></li>
                                        <li>Hit the plus and select <code>gradle</code></li>
                                        <li>Give the configuration a name, e.g. "RunBattlecode"</li>
                                        <li>Next to the <code>gradle project</code> field, click the folder icon and select <code>battlecode20-scaffold"</code></li>
                                        <li>In the <code>Tasks</code> field, type <code>run</code></li>
                                        <li>Click <code>Apply</code>, <code>Ok</code></li>
                                    </ul>
                                    When your configuration is selected from the dropdown menu, clicking play will run the game, the same way double clicking run in the gradle window does.
                                    
                                    Clicking on the bug icon next to the play button will run the game in debug mode in the ide. Use breakpoints and the debuging interface to walk through your code.
                                    For more info on debugging with intelliJ, see <a href='https://www.jetbrains.com/help/idea/debugging-code.html'>here</a>
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

export default Issues;
