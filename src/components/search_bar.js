// exporting modules classes and state
// search bar for typing input request to youtube api

import React, {Component} from 'react';
// declare an es6 class and extend with react based component class 
// functionality from the react components class
// must have a defined rendered method

// only class based components can have state
class SearchBar extends Component {
	constructor(props) {
		// calling the parent method with super
		super(props);
		// initialize state and give properties
		// typing in searchbar this updates the value
		this.state = { term: '' };
	}
	render () {
		return (
			<div>
				<input 
					value={this.state.term}
					onChange={event => this.setState({ term: event.target.value})} />;
			</div>
		);
	}
}

export default SearchBar;
