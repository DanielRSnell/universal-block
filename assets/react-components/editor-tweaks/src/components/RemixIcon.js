import React from 'react';
import 'remixicon/fonts/remixicon.css';

const RemixIcon = ({ name, size = '20px', color, style = {} }) => {
  return (
    <i
      className={name}
      style={{
        fontSize: size,
        lineHeight: 1,
        color: color || 'inherit',
        ...style
      }}
    />
  );
};

export default RemixIcon;