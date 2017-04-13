import React, { Component } from 'react';
import {Editor, EditorState, RichUtils, Modifier, convertToRaw, CompositeDecorator, AtomicBlockUtils} from 'draft-js';
import InlineStyleControls from './InlineStyleControls';
import BlockStyleControls from './BlockStyleControls';
import ActionButton from './ActionButton';
import './MyEditor.css';

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

class Image extends Component {
  render() {
    const {block, contentState} = this.props;
    const {src} = this.props.blockProps;
    // const data = contentState.getEntity(block.getEntityAt(0)).getData();
    // console.log('data: ', data);
    return <img src={src} alt='' />
  }
}

class MyEditor extends Component {
  constructor(props) {
    super(props);

    const decorator = new CompositeDecorator([{
      strategy: findLinkEntities,
      component: Link
    }]);

    this.state = {
      editorState: EditorState.createEmpty(decorator),
      showURLInput: false,
      urlValue: '',
      showHTML: false,
      showImgInput: false,
      imgValue: ''
    };
    this.onChange = (editorState) => this.setState({editorState});
    this.focus = () => this.refs.editor.focus();
    this.onTab = this.onTab.bind(this);
    this.toggleBlockType = (type) => this._toggleBlockType(type);
    this.toggleInlineStyle = (style) => this._toggleInlineStyle(style);
    this.promptForLink = this.promptForLink.bind(this);
    this.promptForImg = this.promptForImg.bind(this);
    
    this.onURLChange = (e) => this.setState({
      urlValue: e.target.value
    });
    this.confirmLink = this.confirmLink.bind(this);
    this.logState = () => {
      const content = this.state.editorState.getCurrentContent();
      console.log(convertToRaw(content));
    };
    this.showHtml = () => {
      this.setState((prevState) => ({showHTML: !prevState.showHTML}));
    }
    this.removeLink = this.removeLink.bind(this);
    this.onLinkInputKeyDown = this.onLinkInputKeyDown.bind(this);
    this.onImgChange = (e) => this.setState({
      imgValue: e.target.value
    });
    this.onImgInputKeyDown = this.onImgInputKeyDown.bind(this);
    this.confirmImg = this.confirmImg.bind(this);
    this.myBlockRenderer = this.myBlockRenderer.bind(this);
    this.handleKeyCommand = this.handleKeyCommand.bind(this);
  }

  handleKeyCommand(command) {
    const newState = RichUtils.handleKeyCommand(this.state.editorState, command);
    if (newState) {
      this.onChange(newState);
      return 'handled';
    }
    return 'not-handled';
  }

  myBlockRenderer(contentBlock) {
    const type = contentBlock.getType();
    if (type === 'atomic') {
      const {editorState} = this.state;
      const contentState = editorState.getCurrentContent();
      const entity = contentState.getEntity(contentBlock.getEntityAt(0));
      const entityType = entity.getType();
      if (entityType === 'image') {
        return {
          component: Image,
          editable: false,
          props: {
            src: this.state.imgValue
          }
        };
      }
    }
    return null;
  }

  confirmImg() {
    const {editorState, imgValue} = this.state;
    const urlType = 'image';
    const contentState = editorState.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity(urlType, 'IMMUTABLE', {
      src: imgValue
    });
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const newEditorState = AtomicBlockUtils.insertAtomicBlock(
      editorState,
      entityKey,
      ' '
    );

    this.setState({
      editorState: EditorState.forceSelection(
        newEditorState,
        contentState.getSelectionAfter()
      )
    })
  }

  onImgInputKeyDown(e) {
    if (e.which === 13) {
      this.confirmImg(e);
    }
  }

  onLinkInputKeyDown(e) {
    if (e.which === 13) {
      this.confirmLink(e);
    }
  }

  removeLink(e) {
    e.preventDefault();
    const {editorState} = this.state;
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      this.setState({
        editorState: RichUtils.toggleLink(editorState, selection, null),
      });
    }
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

  //just show img input form
  promptForImg(e) {
    e.preventDefault();
    this.setState((prevState) => ({showImgInput: !prevState.showImgInput}));
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

  imgInput() {
    if (!this.state.showImgInput) return null;
    return (
      <div className='MyEditor-input-controls'>
        <input 
          className='MyEditor-url-input'
          type='text'
          ref='img'
          value={this.state.imgValue}
          onChange={this.onImgChange}
          placeholder='輸入圖片網址'
          onKeyDown={this.onImgInputKeyDown}
        />
        <span 
          className='MyEditor-styleButton'
          onMouseDown={this.confirmImg}
        >
          確認
        </span>
      </div>
    );
  }

  urlInput() {
    if (!this.state.showURLInput) return null;

    return (
      <div className='MyEditor-input-controls'>
        <input 
          className='MyEditor-url-input'
          type='text'
          ref='url'
          value={this.state.urlValue}
          onChange={this.onURLChange}
          placeholder='輸入連結網址'
          onKeyDown={this.onLinkInputKeyDown}
        />
        <span 
          className='MyEditor-styleButton'
          onMouseDown={this.confirmLink}
        >
          確認
        </span>
      </div>
    );
  }

  actions() {
    return (
      <div className='MyEditor-controls'>
        <ActionButton label='Add Link' onMouseDown={this.promptForLink} />
        <ActionButton label='Remove Link' onMouseDown={this.removeLink} />
        <ActionButton label='Add Image' onMouseDown={this.promptForImg} />
        <ActionButton label='Remove Image' onMouseDown={this.removeLink} />
      </div>
    );
  }

  utils() {
    return (
      <div className='MyEditor-controls'>
        <span className='MyEditor-styleButton' onClick={this.logState}>
          Show State
        </span>
        <span className='MyEditor-styleButton' onClick={this.showHtml}>
          Show HTML
        </span>
      </div>
    );
  }

  showReadOnlyEditor() {
    if (!this.state.showHTML) return null;
    return (
      <div className='MyEditor-editor' >
        <Editor editorState={this.state.editorState} readOnly />
      </div>
    );
  }

  render() {
    const editorState = this.state.editorState;

    return (
      <div className='MyEditor-root'>
        <BlockStyleControls 
          editorState={editorState}
          onToggle={this.toggleBlockType}
        />
        <InlineStyleControls
          editorState={editorState}
          onToggle={this.toggleInlineStyle}
        />
        {this.actions()}
        {this.urlInput()}
        {this.imgInput()}
        {this.utils()}
        <div className='MyEditor-editor'  onClick={this.focus}>
          <Editor
            handleKeyCommand={this.handleKeyCommand}
            blockRendererFn={this.myBlockRenderer}
            blockStyleFn={this.getBlockStyle}
            editorState={editorState} 
            onChange={this.onChange} 
            onTab={this.onTab}
            placeholder="寫點東西..."
            ref="editor"  
          />
        </div>
        {this.showReadOnlyEditor()}
      </div>
        
    );
  }
}
export default MyEditor;