'use client';

import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface Barcode128Props {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
  className?: string;
}

export function Barcode128({
  value,
  width = 1.8,
  height = 45,
  displayValue = true,
  fontSize = 11,
  margin = 0,
  className = '',
}: Barcode128Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        width,
        height,
        displayValue,
        fontSize,
        font: 'monospace',
        fontOptions: 'bold',
        textAlign: 'center',
        textPosition: 'bottom',
        textMargin: 3,
        lineColor: '#000000',
        background: '#ffffff',
        margin,
      });
    } catch (e) {
      console.warn('Barcode generation warning:', e);
    }
  }, [value, width, height, displayValue, fontSize, margin]);

  return <svg ref={svgRef} className={className} />;
}
