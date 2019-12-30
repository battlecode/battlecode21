import React, { Component } from 'react';

class AddCard extends Component {
	render() {
		return (
			<div className="card">
				<div className="content">
					<p> i am a card </p>
				</div>
			</div>
		)
	}
}

class Staff extends Component {
	render() {
		return (
			<div className="content">
				<div className="container-fluid">

					<div className="row">
						<h4 className="text-center"> Under construction! </h4>
					</div>
					
				</div>
			</div>
		)
		// return (
		// 	<div className="content">
		// 		<div className="container-fluid">

		// 			<div className="row">
		// 				<div className="col-md-6">
		// 					<div className="container-fluid">
		// 						<div className="row">
		// 							<AddCard />
		// 						</div>
		// 					</div>
		// 				</div>
		// 				<div className="col-md-6">
		// 					<div className="container-fluid">
		// 						<div className="row">
		// 							<AddCard />
		// 						</div>
		// 					</div>
		// 				</div>
		// 			</div>

		// 			<div className="row">
		// 				<p> rankings go here </p>
		// 			</div>
					
		// 		</div>
		// 	</div>
		// )
	}
}

export default Staff