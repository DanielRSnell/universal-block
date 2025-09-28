import React from 'react';
import 'remixicon/fonts/remixicon.css';

const RemixIcon = ({ name, size = '20px' }) => {
  return (
    <i
      className={name}
      style={{
        fontSize: size,
        lineHeight: 1
      }}
    />
  );
};

export default RemixIcon;