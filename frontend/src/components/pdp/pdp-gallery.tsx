'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Maximize2, ShieldCheck, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryImage {
  url: string;
  alt: string;
  label: string;
}

interface PdpGalleryProps {
  images: GalleryImage[];
  title: string;
  routineTag?: string;
  originCountry?: string;
}

export function PdpGallery({ images, title, routineTag, originCountry }: PdpGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

  const activeImage = images[selectedIndex] || images[0];

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});
  const isCurrentFailed = activeImage ? failedUrls[activeImage.url] : false;

  return (
    <div className="space-y-4">
      {/* Main Image Frame (4:5 Editorial Aspect Ratio) */}
      <div className="relative aspect-[4/5] w-full bg-[#E6DFD5]/25 border border-[#E6DFD5] overflow-hidden group select-none">
        {activeImage && !isCurrentFailed ? (
          <Image
            src={activeImage.url}
            alt={activeImage.alt || title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            onError={() => setFailedUrls((prev) => ({ ...prev, [activeImage.url]: true }))}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 cursor-zoom-in"
            onClick={() => setIsZoomModalOpen(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#E6DFD5]/30">
            <span className="text-2xl font-serif tracking-[0.3em] uppercase text-[#1C1917]/30 font-light">
              SEYVEN
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#C7A97B] mt-2">
              CURATED BEAUTY
            </span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {routineTag && (
            <span className="bg-[#F9F6F0]/95 backdrop-blur-md px-3 py-1 text-[9px] uppercase tracking-[0.25em] text-[#C7A97B] font-semibold border border-[#E6DFD5] shadow-xs">
              {routineTag}
            </span>
          )}
          {originCountry && (
            <span className="bg-[#1C1917]/80 backdrop-blur-md px-3 py-0.5 text-[8px] uppercase tracking-[0.2em] text-[#F9F6F0] font-light border border-[#1C1917]/30">
              IMPORTED // {originCountry}
            </span>
          )}
        </div>

        {/* Authenticity Guarantee Micro-Pill */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center space-x-1.5 bg-[#F9F6F0]/90 backdrop-blur-md px-2.5 py-1 text-[8px] uppercase tracking-[0.18em] text-[#1C1917]/80 border border-[#E6DFD5]">
          <ShieldCheck className="w-3 h-3 text-[#C7A97B]" />
          <span>100% BSTI & SERIAL VERIFIED</span>
        </div>

        {/* Zoom Trigger Button */}
        <button
          type="button"
          aria-label="Zoom image"
          onClick={() => setIsZoomModalOpen(true)}
          className="absolute bottom-4 right-4 z-10 w-9 h-9 rounded-none bg-[#F9F6F0]/90 backdrop-blur-md border border-[#E6DFD5] flex items-center justify-center text-[#1C1917] hover:text-[#C7A97B] hover:bg-[#F9F6F0] transition-colors shadow-xs"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Left/Right Controls for Multi-Angle */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Previous view"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#F9F6F0]/80 hover:bg-[#F9F6F0] border border-[#E6DFD5] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <ChevronLeft className="w-4 h-4 text-[#1C1917]" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Next view"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#F9F6F0]/80 hover:bg-[#F9F6F0] border border-[#E6DFD5] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <ChevronRight className="w-4 h-4 text-[#1C1917]" />
            </button>
          </>
        )}
      </div>

      {/* Multi-Angle Thumbnail Strip */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative aspect-[4/5] bg-[#E6DFD5]/20 border transition-all duration-200 overflow-hidden ${
                  isSelected
                    ? 'border-[#C7A97B] ring-1 ring-[#C7A97B]'
                    : 'border-[#E6DFD5] hover:border-[#1C1917]/40 opacity-70 hover:opacity-100'
                }`}
              >
                {!failedUrls[img.url] ? (
                  <Image
                    src={img.url}
                    alt={img.alt || `${title} angle ${idx + 1}`}
                    fill
                    sizes="120px"
                    onError={() => setFailedUrls((prev) => ({ ...prev, [img.url]: true }))}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#E6DFD5]/40 text-[8px] font-serif text-[#1C1917]/40">
                    SEYVEN
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-[#1C1917]/70 py-0.5 px-1 text-[7px] text-[#F9F6F0] uppercase tracking-wider truncate text-center">
                  {img.label}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      {isZoomModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1C1917]/95 backdrop-blur-lg flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300"
          onClick={() => setIsZoomModalOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] aspect-[4/5] w-full border border-[#C7A97B]/40 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activeImage.url}
              alt={activeImage.alt}
              fill
              sizes="(max-width: 1024px) 95vw, 1024px"
              className="object-contain"
            />
            <button
              type="button"
              onClick={() => setIsZoomModalOpen(false)}
              className="absolute top-4 right-4 px-4 py-2 bg-[#F9F6F0] text-[#1C1917] text-[10px] uppercase tracking-[0.25em] font-medium border border-[#E6DFD5] hover:bg-[#C7A97B] hover:text-[#F9F6F0] transition-colors"
            >
              CLOSE [ESC]
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
