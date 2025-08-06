import React from 'react';

export function InteractionTest() {
  const handleClick = () => {
    alert('Les clics fonctionnent ! Interface débloquée !');
    console.log('Click test successful!');
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 9999,
        pointerEvents: 'auto'
      }}
    >
      <button
        onClick={handleClick}
        style={{
          background: 'red',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          pointerEvents: 'auto'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'darkred';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'red';
        }}
      >
        TEST CLICK
      </button>
    </div>
  );
}

export default InteractionTest;
