// exporting modules classes and state
// search bar for typing input request to youtube api

import React, {Component} from 'react';
// declare an es6 class and extend with react based component class 
// functionality from the react components class
// must have a defined rendered method

// only class based components can have state
class SearchBar extends Component {
	constructor(props) {
		super(props);
		this.state = { term: '' };
	}
	render () {
		return (
			<div className="search-bar">
				<input 
					value={this.state.term}
					onChange={event => this.onInputChange(event.target.value)} />
			</div>
		);
	}
	onInputChange(term) {
		this.setState({term});
		this.props.onSearchTermChange(term);
	}
}
export default SearchBar;
