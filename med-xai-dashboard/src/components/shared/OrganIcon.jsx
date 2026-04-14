import React from 'react';

export const OrganIcon = ({ name, size = 30, className = '' }) => {
  const base = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
  };

  switch (name) {
    case '뇌':
      return (
        <svg {...base}>
          <path d="M12 21c-4.5 0-8-3.5-8-8 0-1.5.5-3 1.5-4.5C6.5 7 8.5 6 12 6s5.5 1 6.5 2.5c1 1.5 1.5 3 1.5 4.5 0 4.5-3.5 8-8 8z" />
          <path d="M12 6v15" strokeOpacity="0.3" />
          <path d="M8 8.5c-1 0.5-2 1.5-2 3s1 2.5 2 3" />
          <path d="M16 8.5c1 0.5 2 1.5 2 3s-1 2.5-2 3" />
          <path d="M12 11c-1-0.5-2.5-0.5-3.5 0.5M12 11c1-0.5 2.5-0.5 3.5 0.5" />
          <path d="M12 15c-1-0.5-2.5-0.5-3.5 0.5M12 15c1-0.5 2.5-0.5 3.5 0.5" />
        </svg>
      );
    case '심장':
      return (
        <svg {...base}>
          <path d="M12 21c-2.5-1.5-6-4.5-7-8.5-0.5-2.5 0.5-6 3.5-7.5 2-1 4.5-0.5 5.5 1 1-1.5 3.5-2 5.5-1 3 1.5 4 5 3.5 7.5-1 4-4.5 7-7 8.5z" />
          <path d="M12 6s0.5-2 2-3M12 6s-0.5-2-1.5-2.5" />
          <path d="M14 5c1-1.5 2.5-1 3 0" />
          <path d="M9 11c0.5 1 1.5 3 3 3.5" strokeOpacity="0.5" />
          <path d="M15 10c-0.5 1-1 2-1.5 2.5" strokeOpacity="0.5" />
        </svg>
      );
    case '폐':
      return (
        <svg {...base}>
          <path d="M12 3v5m-2-2l2 2 2-2" strokeOpacity="0.4" />
          <path d="M12 8c-1.5 0-4 1-5 4s-1 8 2 9 3-1 3-1V8z" />
          <path d="M12 8c1.5 0 4 1 5 4s1 8-2 9-3-1-3-1V8z" />
          <path d="M8 12c-0.5 1-1 2-1 4M16 12c0.5 1 1 2 1 4" strokeOpacity="0.3" />
        </svg>
      );
    case '간':
      return (
        <svg {...base}>
          <path d="M4 11c0-4 6-6 10-6s7 2 7 6-2 8-8 8-9-4-9-8z" />
          <path d="M14 5c-1 2-1 5 0 8" strokeOpacity="0.3" />
          <path d="M14 13c0 2 0.5 4 1 6" strokeOpacity="0.4" />
        </svg>
      );
    case '위':
      return (
        <svg {...base}>
          <path d="M13 3c-1 1-2 3-2 5v2c0 4 3 8 7 8 2 0 3-1 3-3 0-2-1-3-3-3s-3-1-3-3c0-2.5 1-5 2.5-6" />
          <path d="M11 10c-2 1-6 3-6 7s3 4 5 4 3-2 3-4" strokeOpacity="0.4" />
        </svg>
      );
    case '신장':
      return (
        <svg {...base}>
          <path d="M8 5c-3 0-4 3-4 7s2 9 5 9h1V5H8z" />
          <path d="M16 5c3 0 4 3 4 7s-2 9-5 9h-1V5h1z" />
          <path d="M10 21v-3M14 21v-3" strokeOpacity="0.4" />
        </svg>
      );
    default:
      return null;
  }
};
