import React, { Component } from 'react';
import './App.css';
import './MyEditor.css';

import {Editor, EditorState, RichUtils, Modifier, convertToRaw, CompositeDecorator} from 'draft-js';
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

const INLINE_STYLES = [
  {label: 'Bold', style: 'BOLD'},
  {label: 'Italic', style: 'ITALIC'},
  {label: 'Underline', style: 'UNDERLINE'},
  {label: 'Monospace', style: 'CODE'},
];

const InlineStyleControls = ({editorState, onToggle}) => {
  const currentStyle = editorState.getCurrentInlineStyle();
  return (
    <div className="MyEditor-controls">
      {INLINE_STYLES.map(type =>
        <StyleButton
          key={type.label}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={onToggle}
          style={type.style}
        />
      )}
    </div>
  );
};

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
    <div className="MyEditor-controls">
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

function findLinkEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges(
    (character) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === 'LINK'
      );
    },
    callback
  );
}

const Link = (props) => {
  const {url} = props.contentState.getEntity(props.entityKey).getData();
  return (
    <a href={url} className='MyEditor-link' target='_blank'>
      {props.children}
    </a>
  );
};

class MyEditor extends Component {
  constructor(props) {
    super(props);

     const decorator = new CompositeDecorator([{
       strategy: findLinkEntities,
       component: Link,
     }, ]);

    this.state = {
      editorState: EditorState.createEmpty(decorator),
      showURLInput: false,
      urlValue: ''
    };
    this.onChange = (editorState) => this.setState({editorState});
    this.focus = () => this.refs.editor.focus();
    this.onTab = this.onTab.bind(this);
    this.handleBold = this.handleBold.bind(this);
    this.toggleBlockType = (type) => this._toggleBlockType(type);
    this.toggleInlineStyle = (style) => this._toggleInlineStyle(style);
    this.promptForLink = this.promptForLink.bind(this);
    this.onURLChange = (e) => this.setState({
      urlValue: e.target.value
    });
    this.confirmLink = this.confirmLink.bind(this);
    this.logState = () => {
      const content = this.state.editorState.getCurrentContent();
      console.log(convertToRaw(content));
    };
  }
  
  confirmLink(e) {
    e.preventDefault();
    const { editorState, urlValue } = this.state;
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(
      'LINK',
      'MUTABLE',
      {url: urlValue}
    )
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = EditorState.set(editorState, {
      currentContent: contentStateWithEntity
    });
    this.setState({
      editorState: RichUtils.toggleLink(
        newEditorState, 
        newEditorState.getSelection(), 
        entityKey
      ),
      showURLInput: false,
      urlValue: ''
    }, () => {
      setTimeout(()=> this.refs.editor.focus(), 0);
    });
  }

  promptForLink(e) {
    e.preventDefault();
    const {editorState} = this.state;
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()){
      const contentState = editorState.getCurrentContent();
      const startKey = selection.getStartKey();
      const startOffset = selection.getStartOffset();
      const blockWithLinkAtBeginning = contentState.getBlockForKey(startKey);
      const linkKey = blockWithLinkAtBeginning.getEntityAt(startOffset);

      let url='';
      if (linkKey) {
        const linkInstance = contentState.getEntity(linkKey);
        url = linkInstance.getData().url;
      }

      this.setState({
        showURLInput: true,
        urlValue: url
      }, () => {
        setTimeout(() => this.refs.url.focus(), 0);
      });
    }
  }

  _toggleBlockType(blockType) {
    this.onChange(
      RichUtils.toggleBlockType(
        this.state.editorState,
        blockType
      )
    );
  }

  _toggleInlineStyle(inlineStyle) {
    this.onChange(
      RichUtils.toggleInlineStyle(
        this.state.editorState,
        inlineStyle
      )
    );
  }

  handleBold() {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, 'BOLD'));
  }

  onTab(e) {
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

  getBlockStyle(block) {
    switch (block.getType()) {
    case 'blockquote':
      return 'MyEditor-blockquote';
    default:
      return null;
    }
  }

  urlInput() {
    if (!this.state.showURLInput) return null;

    return (
      <div className='MyEditor-input-controls'>
        <input 
          type='text'
          ref='url'
          value={this.state.urlValue}
          onChange={this.onURLChange}
        />
        <button onMouseDown={this.confirmLink}>確認</button>
      </div>
    );
  }

  linkActions() {
    return (
      <div className='MyEditor-controls'>
        <span 
          className='MyEditor-styleButton'
          onMouseDown={this.promptForLink}
        >Add Link</span>
        <span className='MyEditor-styleButton'>Remove Link</span>
      </div>
    );
  }

  showState() {
    return (
      <div className='MyEditor-controls'>
        <span className='MyEditor-styleButton' onClick={this.logState}>
          Show State
        </span>
      </div>
    );
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
        <InlineStyleControls
          editorState={editorState}
          onToggle={this.toggleInlineStyle}
        />
        {this.linkActions()}
        {this.urlInput()}
        {this.showState()}
        <div className='MyEditor-editor'  onClick={this.focus}>
          <Editor
            blockStyleFn={this.getBlockStyle}
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
        {/*<LinkEditor />*/}
      </div>
    );
  }
}

export default App;
