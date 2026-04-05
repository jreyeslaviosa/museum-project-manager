import { useState, useEffect } from 'react';

function ImageLightbox({ images, initialIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);

  const current = images[currentIndex];

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrentIndex(i => Math.min(i + 1, images.length - 1));
      if (e.key === 'ArrowLeft') setCurrentIndex(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [images.length, onClose]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = current.data;
    link.download = current.name || 'image';
    link.click();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.9)', zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}
    >
      {/* Top bar */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(rgba(0,0,0,0.5), transparent)'
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
          {current.name} {images.length > 1 ? `(${currentIndex + 1}/${images.length})` : ''}
        </span>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleDownload} style={btnStyle}>Download</button>
          <button onClick={onClose} style={btnStyle}>Close</button>
        </div>
      </div>

      {/* Image */}
      <img
        src={current.data}
        alt={current.name}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '4px' }}
      />

      {/* Nav arrows */}
      {images.length > 1 && currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => i - 1); }}
          style={{ ...arrowStyle, left: '1rem' }}
        >
          &#8249;
        </button>
      )}
      {images.length > 1 && currentIndex < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => i + 1); }}
          style={{ ...arrowStyle, right: '1rem' }}
        >
          &#8250;
        </button>
      )}
    </div>
  );
}

const btnStyle = {
  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
  color: 'white', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer',
  fontSize: '0.85rem'
};

const arrowStyle = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
  background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
  fontSize: '2.5rem', width: '50px', height: '50px', borderRadius: '50%',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  lineHeight: 1
};

export default ImageLightbox;
