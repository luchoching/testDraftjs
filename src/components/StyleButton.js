import React, { Component } from 'react';

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
export default StyleButton;