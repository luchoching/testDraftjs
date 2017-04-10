import React, { Component } from 'react';
import './App.css';

import {Editor, EditorState, RichUtils} from 'draft-js';
import LinkEditor from './LinkEditor';

class MyEditor extends Component {
  constructor(props) {
    super(props);
    this.state = {editorState: EditorState.createEmpty()};
    this.onChange = (editorState) => this.setState({editorState});
    this.handleBold = this.handleBold.bind(this);
  }
  
  handleBold() {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, 'BOLD'));
  }

  render() {
    return (
      <div>
        <button onClick={this.handleBold}>Bold</button>
        <Editor 
          editorState={this.state.editorState} 
          onChange={this.onChange} />
      </div>
        
    );
  }
}


class App extends Component {
  render() {
    return (
      <div className='App'>
        <MyEditor />
      </div>
    );
  }
}

export default App;
