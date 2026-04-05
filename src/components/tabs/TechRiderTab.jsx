import { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ImageLightbox from '../ImageLightbox';

function TechRiderTab({ project, onUpdate }) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Support both old single-file format and new multi-file format
  const files = project.techRiderFiles || (project.techRider ? [project.techRider] : []);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const processFiles = (newFiles) => {
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile = {
          id: uuidv4(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result,
          uploadedAt: new Date().toISOString()
        };
        const current = project.techRiderFiles || (project.techRider ? [project.techRider] : []);
        onUpdate({
          techRiderFiles: [...current, newFile],
          techRider: null
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (id) => {
    if (window.confirm('Remove this file?')) {
      const updated = files.filter(f => f.id !== id);
      onUpdate({ techRiderFiles: updated, techRider: null });
    }
  };

  const handleDownload = (file) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    link.click();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isImage = (file) => {
    return file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(file.name);
  };

  const isPDF = (file) => {
    return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  };

  const imageFiles = files.filter(isImage);
  const docFiles = files.filter(f => !isImage(f));

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Tech Rider</h2>
        </div>

        <p style={{ color: 'var(--gray)', marginBottom: '1.5rem' }}>
          Upload technical rider documents and images — PDFs, photos, diagrams, or scans.
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
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png,.gif,.svg,.webp"
            multiple
          />
          <p><strong>Click to upload</strong> or drag and drop</p>
          <p>PDF, DOC, JPG, PNG, and more</p>
        </div>

        {/* Document Files */}
        {docFiles.length > 0 && (
          <div className="uploaded-files">
            {docFiles.map(file => (
              <div key={file.id || file.name} className="uploaded-file">
                <span>
                  <div>
                    <strong>{file.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>
                      {formatFileSize(file.size)}
                      {file.uploadedAt && ` · Uploaded ${new Date(file.uploadedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-small btn-outline" onClick={() => handleDownload(file)}>
                    Download
                  </button>
                  <button className="btn btn-small btn-danger" onClick={() => removeFile(file.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PDF Preview */}
        {docFiles.filter(isPDF).map(file => (
          <div key={file.id || file.name} style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {file.name}
            </div>
            <iframe
              src={file.data}
              style={{ width: '100%', height: '600px', border: '1px solid var(--border)', borderRadius: '4px' }}
              title={file.name}
            />
          </div>
        ))}

        {/* Image Files */}
        {imageFiles.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Images ({imageFiles.length})
            </div>
            <div className="image-gallery">
              {imageFiles.map((file, idx) => (
                <div key={file.id || file.name} className="image-item" style={{ cursor: 'pointer' }} onClick={() => setLightboxIndex(idx)}>
                  <img src={file.data} alt={file.name} />
                  <button
                    className="delete-btn"
                    onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {lightboxIndex !== null && (
              <ImageLightbox images={imageFiles} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
            )}
          </div>
        )}

        {files.length === 0 && (
          <p style={{ color: 'var(--gray)', textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
            No files uploaded yet
          </p>
        )}
      </div>
    </div>
  );
}

export default TechRiderTab;
