import React from 'react';
import ReactDOM from 'react-dom';

import SearchBar from './components/search_bar';

const API_KEY = 'AIzaSyDP1iobS0jf9j-cdl826gQMfuXEIc5nlmY';


const App = () => {
	return (
			<div>
				<SearchBar />
			</div>
		);
	}
ReactDOM.render(<App />, document.querySelector('.container'));
