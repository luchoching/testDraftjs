import React from 'react';

const ActionButton = ({label, onMouseDown}) => (
  <span 
    className='MyEditor-styleButton'
    onMouseDown={onMouseDown}
  >
    {label}
  </span>
);
export default ActionButton;