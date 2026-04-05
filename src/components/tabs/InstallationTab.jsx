import { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ImageLightbox from '../ImageLightbox';

function InstallationTab({ project, onUpdate }) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [editingPlan, setEditingPlan] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [planText, setPlanText] = useState(project.installationPlan || '');

  const images = project.installationImages || [];

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    processImages(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    processImages(files);
  };

  const processImages = (files) => {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = {
          id: uuidv4(),
          name: file.name,
          data: e.target.result,
          uploadedAt: new Date().toISOString()
        };
        onUpdate({
          installationImages: [...(project.installationImages || []), newImage]
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id) => {
    if (window.confirm('Remove this image?')) {
      onUpdate({
        installationImages: images.filter(img => img.id !== id)
      });
    }
  };

  const savePlan = () => {
    onUpdate({ installationPlan: planText });
    setEditingPlan(false);
  };

  return (
    <div>
      {/* Installation Plan */}
      <div className="card">
        <div className="card-header">
          <h2>Installation Plan</h2>
          {!editingPlan && (
            <button
              className="btn btn-outline btn-small"
              onClick={() => setEditingPlan(true)}
            >
              Edit
            </button>
          )}
        </div>

        {editingPlan ? (
          <div>
            <textarea
              value={planText}
              onChange={(e) => setPlanText(e.target.value)}
              placeholder="Describe the installation plan, steps, requirements, safety considerations..."
              rows={12}
              style={{
                width: '100%',
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={savePlan}>
                Save Plan
              </button>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setPlanText(project.installationPlan || '');
                  setEditingPlan(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          project.installationPlan ? (
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              {project.installationPlan}
            </div>
          ) : (
            <p style={{ color: 'var(--gray)', fontStyle: 'italic' }}>
              No installation plan added yet. Click "Edit" to add one.
            </p>
          )
        )}
      </div>

      {/* Images / Layout */}
      <div className="card">
        <div className="card-header">
          <h2>Images & Layout</h2>
        </div>

        <p style={{ color: 'var(--gray)', marginBottom: '1.5rem' }}>
          Upload floor plans, layout diagrams, reference images, or installation photos.
        </p>

        <div
          className={`file-upload ${dragOver ? 'dragover' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={dragOver ? { borderColor: 'var(--secondary)', background: '#f0f7ff' } : {}}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleImageSelect}
            accept="image/*"
            multiple
          />
          <div style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--gray)' }}>Images</div>
          <p><strong>Click to upload</strong> or drag and drop</p>
          <p>PNG, JPG, GIF, SVG</p>
        </div>

        {images.length > 0 && (
          <div className="image-gallery">
            {images.map((img, idx) => (
              <div key={img.id} className="image-item" style={{ cursor: 'pointer' }} onClick={() => setLightboxIndex(idx)}>
                <img src={img.data} alt={img.name} />
                <button
                  className="delete-btn"
                  onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                  title="Remove image"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {lightboxIndex !== null && (
          <ImageLightbox images={images} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
        )}

        {images.length === 0 && (
          <p style={{ color: 'var(--gray)', textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
            No images uploaded yet
          </p>
        )}
      </div>
    </div>
  );
}

export default InstallationTab;
