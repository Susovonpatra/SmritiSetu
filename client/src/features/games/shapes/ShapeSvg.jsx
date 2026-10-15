import React from 'react';
import { SHAPES_BY_ID } from './shapeConfig';

/**
 * ShapeSvg component renders any of the 20 cognitive game shapes in 3 modes:
 * - 'outline': Target slot outline (clean dark outline on white/transparent)
 * - 'colored': Draggable piece with vibrant dementia-friendly palette
 * - 'ghost': Translucent gliding copy for adaptive hint assistance
 * - 'success': Glowing green/gold celebration state
 */
export function ShapeSvg({
  shapeId,
  shape,
  mode = 'colored', // 'outline' | 'colored' | 'ghost' | 'success'
  size = 96,
  className = '',
  style = {}
}) {
  const shapeData = shape || SHAPES_BY_ID[shapeId];
  if (!shapeData) return null;

  let fill = shapeData.fillColor;
  let stroke = shapeData.strokeColor;
  let strokeWidth = 3;
  let opacity = 1;

  if (mode === 'outline') {
    fill = '#ffffff';
    stroke = '#334155'; // Clean slate-700 outline
    strokeWidth = 3.5;
    opacity = 0.85;
  } else if (mode === 'ghost') {
    fill = shapeData.fillColor;
    stroke = shapeData.strokeColor;
    strokeWidth = 3;
    opacity = 0.45;
  } else if (mode === 'success') {
    fill = '#10b981';
    stroke = '#047857';
    strokeWidth = 4;
    opacity = 1;
  }

  // Render internal shape geometry
  const renderGeometry = () => {
    switch (shapeData.type) {
      case 'polygon':
        return (
          <polygon
            points={shapeData.points}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        );

      case 'rect':
        return (
          <rect
            x={shapeData.x}
            y={shapeData.y}
            width={shapeData.width}
            height={shapeData.height}
            rx={shapeData.rx}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        );

      case 'circle':
        return (
          <circle
            cx={shapeData.cx}
            cy={shapeData.cy}
            r={shapeData.r}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        );

      case 'ellipse':
        return (
          <ellipse
            cx={shapeData.cx}
            cy={shapeData.cy}
            rx={shapeData.rx}
            ry={shapeData.ry}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        );

      case 'donut':
        // Ring shape: outer circle with inner hole or donut stroke
        return (
          <path
            d={`M 50,${50 - shapeData.outerR} 
                A ${shapeData.outerR},${shapeData.outerR} 0 1 0 50,${50 + shapeData.outerR} 
                A ${shapeData.outerR},${shapeData.outerR} 0 1 0 50,${50 - shapeData.outerR} Z 
                M 50,${50 - shapeData.innerR} 
                A ${shapeData.innerR},${shapeData.innerR} 0 1 1 50,${50 + shapeData.innerR} 
                A ${shapeData.innerR},${shapeData.innerR} 0 1 1 50,${50 - shapeData.innerR} Z`}
            fillRule="evenodd"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        );

      case 'path':
      default:
        return (
          <path
            d={shapeData.d}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        );
    }
  };

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`inline-block select-none overflow-visible transition-transform duration-200 ${className}`}
      style={{
        opacity,
        filter: mode === 'colored' ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.12))' : undefined,
        ...style
      }}
      aria-label={shapeData.displayName}
      role="img"
    >
      {renderGeometry()}
    </svg>
  );
}
