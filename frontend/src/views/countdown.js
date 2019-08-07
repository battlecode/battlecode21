import React, { Component } from 'react';
import './countdown.css';
import Api from '../api';

class Countdown extends Component {
  constructor() {
    super();

    this.state = {
      days: 0,
      hours: 0,
      min: 0,
      sec: 0,
      end_date: new Date('January 14, 2020 20:00:00'),
      tournament_name: 'hej',
      est_date: 'somedate'
    }

  }

  componentDidMount() {
    Api.getNextTournament((tournament_info) => {
        console.log(tournament_info)
        console.log(new Date(Date.parse(new Date()) + 1000*tournament_info['seconds_until']))
        this.setState({
            end_date: new Date(Date.parse(new Date()) + 1000*tournament_info['seconds_until']),
            tournament_name: tournament_info['tournament_name'],
            est_date: tournament_info['est_date_str']
        })
    })
      const date = this.calculateCountdown(this.state.end_date);
      date ? this.setState(date) : this.stop();
    this.interval = setInterval(() => {
      const date = this.calculateCountdown(this.state.end_date);
      date ? this.setState(date) : this.stop();
    }, 1000);
  }

  componentWillUnmount() {
    this.stop();
  }

  calculateCountdown(endDate) {
    let diff = (Date.parse(new Date(endDate)) - (Date.parse(new Date())) ) / 1000;

    // clear countdown when date is reached
    if (diff <= 0) return false;

    const timeLeft = {
      years: 0,
      days: 0,
      hours: 0,
      min: 0,
      sec: 0,
      millisec: 0,
    };

    // calculate time difference between now and expected date
    if (diff >= (365.25 * 86400)) { // 365.25 * 24 * 60 * 60
      timeLeft.years = Math.floor(diff / (365.25 * 86400));
      diff -= timeLeft.years * 365.25 * 86400;
    }
    if (diff >= 86400) { // 24 * 60 * 60
      timeLeft.days = Math.floor(diff / 86400);
      diff -= timeLeft.days * 86400;
    }
    if (diff >= 3600) { // 60 * 60
      timeLeft.hours = Math.floor(diff / 3600);
      diff -= timeLeft.hours * 3600;
    }
    if (diff >= 60) {
      timeLeft.min = Math.floor(diff / 60);
      diff -= timeLeft.min * 60;
    }
    timeLeft.sec = diff;

    return timeLeft;
  }

  stop() {
    clearInterval(this.interval);
  }

  addLeadingZeros(value) {
    value = String(value);
    while (value.length < 2) {
      value = '0' + value;
    }
    return value;
  }

    render() {
        const countDown = this.state;
        return (
            <div className="card ">
                <div className="header">
                    <h4 className="title">Next Tournament in</h4>
                </div>
                <div className="content">
                <div className='countdown-container'>
                <div className="Countdown">
                  <span className="Countdown-col">
                    <span className="Countdown-col-element">
                        <strong>{this.addLeadingZeros(countDown.days)}</strong>
                        <span>{countDown.days === 1 ? 'Day' : 'Days'}</span>
                    </span>
                  </span>
          
                  <span className="Countdown-col">
                    <span className="Countdown-col-element">
                      <strong>{this.addLeadingZeros(countDown.hours)}</strong>
                      <span>{countDown.hours === 1 ? 'Hour' : 'Hours'}</span>
                    </span>
                  </span>
          
          
                  <span className="Countdown-col">
                    <span className="Countdown-col-element">
                      <strong>{this.addLeadingZeros(countDown.min)}</strong>
                      <span>Min</span>
                    </span>
                  </span>
          
                  <span className="Countdown-col">
                    <span className="Countdown-col-element">
                      <strong>{this.addLeadingZeros(countDown.sec)}</strong>
                      <span>Sec</span>
                    </span>
                  </span>
                </div>
                </div>
                The submission deadline for the <b>{this.state.tournament_name}</b> is at <b>{this.state.est_date}</b>.
                </div>
            </div>
        );
    }
}


export default Countdown;