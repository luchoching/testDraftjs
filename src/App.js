import React, { Component } from 'react';
import './App.css';
import './MyEditor.css';

import {Editor, EditorState, RichUtils, Modifier} from 'draft-js';
import LinkEditor from './LinkEditor';

class StyleButton extends Component {
  constructor() {
    super();
    this.onToggle = (e) => {
      e.preventDefault();
      this.props.onToggle(this.props.style);
    };
  }
  render() {
    let className = 'MyEditor-styleButton';
    if (this.props.active) {
      className += ' MyEditor-activeButton';
    }

    return ( 
      <span 
        className={className}
        onMouseDown={this.onToggle}
      > 
        {this.props.label} 
      </span>
     );
  }
}

const BLOCK_TYPES = [
  {label: 'H1', style: 'header-one'},
  {label: 'H2', style: 'header-two'},
  {label: 'H3', style: 'header-three'},
  {label: 'H4', style: 'header-four'},
  {label: 'H5', style: 'header-five'},
  {label: 'H6', style: 'header-six'},
  {label: 'Blockquote', style: 'blockquote'},
  {label: 'UL', style: 'unordered-list-item'},
  {label: 'OL', style: 'ordered-list-item'},
  {label: 'Code Block', style: 'code-block'},
];

const BlockStyleControls = ({editorState, onToggle}) => {
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  return (
    <div>
      {BLOCK_TYPES.map((type) =>
        <StyleButton 
          key={type.label}
          active={type.style === blockType}
          label={type.label}
          onToggle={onToggle}
          style={type.style}
        />
      )}
    </div>
  );
}

class MyEditor extends Component {
  constructor(props) {
    super(props);
    this.state = {editorState: EditorState.createEmpty()};
    this.onChange = (editorState) => this.setState({editorState});
    this.focus = () => this.refs.editor.focus();
    this.onTab = this.onTab.bind(this);
    this.handleBold = this.handleBold.bind(this);
    this.toggleBlockType = (type) => this._toggleBlockType(type);
  }
  
  _toggleBlockType(blockType) {
    this.onChange(
      RichUtils.toggleBlockType(
        this.state.editorState,
        blockType
      )
    );
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
    const editorState = this.state.editorState;

    return (
      <div className='MyEditor-root'>
        {/*<button onClick={this.handleBold}>Bold</button>*/}
        <BlockStyleControls 
          editorState={editorState}
          onToggle={this.toggleBlockType}
        />
        <div className='MyEditor-editor'  onClick={this.focus}>
          <Editor
            editorState={editorState} 
            onChange={this.onChange} 
            onTab={this.onTab}
            placeholder="寫點東西..."
            ref="editor"  
          />
        </div>

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
