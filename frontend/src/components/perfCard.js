import React from 'react';
import $ from 'jquery';
import moment from 'moment';
import Api from '../api';
import UpdateCard from './updateCard';

class PerfCard extends UpdateCard {
    constructor(props) {
        super(props);
        this.state = {}
    }

    componentDidMount() {
        const team = this.props.team

        $().ready(function() {
            const graphFunc = function(perf) {
                let data = []
                perf.forEach(scrimRes => {
                    if (scrimRes.mu !== undefined && scrimRes.mu !== null)  {
                        data.push({
                            x: new Date(scrimRes.date),
                            y: scrimRes.mu
                        })
                    }
                })

                data.sort((pt1, pt2) => {
                    if (pt1.x == pt2.x) {
                        return 0
                    } else {
                        return (pt1.x > pt2.x) ? 1 : -1
                    }
                })

                window.Chartist.Line('#mu_chart', {series: [{
                        name: "mu_data",
                        data: data
                    }]
                }, {
                    height: "245px",
                    axisX: { 
                        showGrid: false,
                        type: window.Chartist.FixedScaleAxis,
                        divisor: 5,
                        labelInterpolationFnc: v => moment(v).format('MMM D')
                    },
                    lineSmooth: false,

                    showLine: true,
                    showPoint: false,
                },
                );
            }

            if (team === null) {
                Api.getOwnTeamMuHistory(graphFunc)
            } else {
                Api.getTeamMuHistory(team, graphFunc)
            }
        });
    }

    render() {
        return (
            <div className="card">
                <div className="header">
                    <h4 className="title">Performance</h4>
                    <p className="category">Skill estimation over time.</p>
                </div>
                <div className="content">
                    <div id="mu_chart" className="ct-chart" />
                    { this.getFooter() }
                </div>
            </div>
        );
    }
}

export default PerfCard