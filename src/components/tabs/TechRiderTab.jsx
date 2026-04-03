import { useState, useRef } from 'react';

function TechRiderTab({ project, onUpdate }) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onUpdate({
        techRider: {
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result,
          uploadedAt: new Date().toISOString()
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    if (window.confirm('Remove this tech rider document?')) {
      onUpdate({ techRider: null });
    }
  };

  const handleDownload = () => {
    if (project.techRider) {
      const link = document.createElement('a');
      link.href = project.techRider.data;
      link.download = project.techRider.name;
      link.click();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Tech Rider</h2>
      </div>

      <p style={{ color: 'var(--gray)', marginBottom: '1.5rem' }}>
        Upload the technical rider document containing all technical requirements for the installation.
      </p>

      {!project.techRider ? (
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
            accept=".pdf,.doc,.docx,.txt,.rtf"
          />
          <div style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--gray)' }}>Document</div>
          <p><strong>Click to upload</strong> or drag and drop</p>
          <p>PDF, DOC, DOCX, TXT, RTF</p>
        </div>
      ) : (
        <div>
          <div className="uploaded-file">
            <span>
              <div>
                <strong>{project.techRider.name}</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>
                  {formatFileSize(project.techRider.size)} • Uploaded {new Date(project.techRider.uploadedAt).toLocaleDateString()}
                </div>
              </div>
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-small btn-outline" onClick={handleDownload}>
                Download
              </button>
              <button className="btn btn-small btn-danger" onClick={handleRemove}>
                Remove
              </button>
            </div>
          </div>

          {project.techRider.type === 'application/pdf' && (
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem' }}>Preview</h4>
              <iframe
                src={project.techRider.data}
                style={{
                  width: '100%',
                  height: '600px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px'
                }}
                title="Tech Rider Preview"
              />
            </div>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <button
              className="btn btn-outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Replace Document
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt,.rtf"
              style={{ display: 'none' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default TechRiderTab;
