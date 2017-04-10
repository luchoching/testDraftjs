import React, { Component } from 'react';
import './App.css';

import {Editor, EditorState, RichUtils, Modifier} from 'draft-js';
import LinkEditor from './LinkEditor';

class MyEditor extends Component {
  constructor(props) {
    super(props);
    this.state = {editorState: EditorState.createEmpty()};
    this.onChange = (editorState) => this.setState({editorState});
    this.focus = () => this.refs.editor.focus();
    this.onTab = this.onTab.bind(this);
    this.handleBold = this.handleBold.bind(this);
  }
  
  handleBold() {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, 'BOLD'));
  }

  onTab(e) {
    console.log('tab');
    e.preventDefault();
    const tabCharacter = '    ';
    let currentState = this.state.editorState;
    let newContentState = Modifier.replaceText(
      currentState.getCurrentContent(),
      currentState.getSelection(),
      tabCharacter
    );

    this.setState({ 
      editorState: EditorState.push(currentState, newContentState, 'insert-characters')
    });
  }

  render() {
    return (
      <div>
        <button onClick={this.handleBold}>Bold</button>
        <Editor 
          editorState={this.state.editorState} 
          onChange={this.onChange} 
          onTab={this.onTab}
          placeholder="寫點東西..."
          ref="editor"  
        />
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
