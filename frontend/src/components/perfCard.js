import React from 'react';
import $ from 'jquery';
import Api from '../api';
import UpdateCard from './updateCard';

class PerfCard extends UpdateCard {
    componentDidMount() {
        $().ready(function() {
            Api.getOwnTeamMuHistory(function(perf) {
                console.log(perf)
                data = perf.map(scrimRes => {
                    if (data.mu !== null) {
                        return {
                            x: new Date(scrimRes.date),
                            y: data.mu
                        }
                    }
                    
                })
                // perf = [1,2,3,4,5,6]
                // var dataSales = {'series':[perf], 'labels':[]};
                // console.log(dataSales)
                // for (var i=perf.length-1; i>=0; i--)
                //     dataSales.labels.push(i===0 ? "Now" : i + "hr ago");

                // window.Chartist.Line('#mu_chart', dataSales, {
                //     low: 0,
                //     height: "245px",
                //     axisX: { showGrid: false, },
                //     lineSmooth: window.Chartist.Interpolation.simple({
                //         divisor: 3
                //     }), showLine: true,
                //     showPoint: false,
                // }, [['screen and (max-width: 640px)', {
                //     axisX: {
                //         labelInterpolationFnc: v => v[0]
                //     }
                // }]]);
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