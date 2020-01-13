import React from 'react';
import $ from 'jquery';
import moment from 'moment';
import Api from '../api';
import UpdateCard from './updateCard';

class PerfCard extends UpdateCard {
    componentDidMount() {
        $().ready(function() {
            Api.getOwnTeamMuHistory(function(perf) {
                console.log(perf)
                let data = []
                perf.forEach(scrimRes => {
                    if (scrimRes.mu !== undefined && scrimRes.mu !== null)  {
                        console.log(scrimRes.mu)
                        data.push({
                            x: new Date(scrimRes.date),
                            y: scrimRes.mu
                        })
                    }
                })

                console.log(data)
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
                    showPoint: true,
                },
                );
            });
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