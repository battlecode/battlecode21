import React, { Component } from 'react';

class Footer extends Component {
    render() {
        return (
            <footer className="footer">
                <div className="container-fluid">
                    <nav className="pull-left">
                        <ul>
                            <li>
                                <a href="https://2020.battlecode.org/">
                                    Home
                                </a>
                            </li>
                            <li>
                                <a href="https://blog.battlecode.org/">
                                    Blog
                                </a>
                            </li>
                            <li>
                                <a href="https://blog.battlecode.org/terms">
                                    Usage Terms
                                </a>
                            </li>
                        </ul>
                    </nav>
                    <p className="copyright pull-right">
                        © {new Date().getFullYear()} <a href="https://battlecode.org">MIT Battlecode</a>.
                    </p>
                </div>
          </footer>
        );
    }
}

export default Footer;
