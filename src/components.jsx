import { useRef } from 'react';

// SVG Icon components
export const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

export const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export const IdIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

export const BriefcaseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

export const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

export const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

export const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
  </svg>
);

export const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export const AlertIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

export const LoaderIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin 1s linear infinite'}}>
    <line x1="12" y1="2" x2="12" y2="6"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
    <line x1="2" y1="12" x2="6" y2="12"/>
    <line x1="18" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
  </svg>
);

// ── FormGroup ─────────────────────────────────────────────
export function FormGroup({ label, required, hint, children }) {
  return (
    <div className="form-group">
      <label>
        {label}
        {required && <span className="req">*</span>}
      </label>
      {children}
      {hint && <div className="input-hint">{hint}</div>}
    </div>
  );
}

// ── TextInput ─────────────────────────────────────────────
export function TextInput({ id, icon: Icon, placeholder, value, onChange, type = 'text' }) {
  return (
    <div className="input-wrapper">
      {Icon && (
        <div className="input-icon">
          <Icon />
        </div>
      )}
      <input
        id={id}
        type={type}
        className={`form-input ${!Icon ? 'no-icon' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

// ── SectionHeading ────────────────────────────────────────
export function SectionHeading({ children }) {
  return (
    <div className="section-heading">
      {children}
      <div className="section-heading-line" />
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────
export function Toast({ visible, type = 'success', message }) {
  return (
    <div className={`toast ${visible ? 'show' : ''}`}>
      <div className={`toast-icon ${type}`}>
        {type === 'success' && <CheckIcon />}
        {type === 'error'   && <AlertIcon />}
        {type === 'info'    && <LoaderIcon />}
      </div>
      <span>{message}</span>
    </div>
  );
}

// ── DateInput ─────────────────────────────────────────────
export function DateInput({ id, value, onChange, placeholder = "DD/MM/YYYY", icon: Icon }) {
  const hiddenInputRef = useRef(null);

  const handleTextChange = (e) => {
    const raw = e.target.value;
    
    // Auto mask formatting: DD/MM/YYYY
    const clean = raw.replace(/\D/g, '').slice(0, 8);
    let formatted = '';
    if (clean.length > 0) {
      formatted += clean.slice(0, 2);
    }
    if (clean.length > 2) {
      formatted += '/' + clean.slice(2, 4);
    }
    if (clean.length > 4) {
      formatted += '/' + clean.slice(4, 8);
    }

    onChange(formatted);
  };

  const handleDateSelect = (e) => {
    const selectedDate = e.target.value; // YYYY-MM-DD
    if (selectedDate) {
      const parts = selectedDate.split('-');
      const [y, m, d] = parts;
      onChange(`${d}/${m}/${y}`); // Set in DD/MM/YYYY format
    }
  };

  // Convert display value DD/MM/YYYY back to YYYY-MM-DD for hidden input date value
  let pickerValue = '';
  if (value && value.includes('/')) {
    const parts = value.split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      if (d.length === 2 && m.length === 2 && y.length === 4) {
        pickerValue = `${y}-${m}-${d}`;
      }
    }
  }

  return (
    <div className="input-wrapper date-input-wrapper" style={{ position: 'relative' }}>
      {Icon && (
        <div className="input-icon" style={{ zIndex: 1 }}>
          <Icon />
        </div>
      )}
      <input
        id={id}
        type="text"
        className={`form-input ${!Icon ? 'no-icon' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={handleTextChange}
        style={{ zIndex: 1, paddingRight: '42px' }}
      />
      
      {/* Hidden date picker trigger overlaying the icon area on the right */}
      <div 
        style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '24px',
          height: '24px',
          cursor: 'pointer',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2
        }}
      >
        <input
          type="date"
          ref={hiddenInputRef}
          value={pickerValue}
          onChange={handleDateSelect}
          style={{
            position: 'absolute',
            opacity: 0,
            cursor: 'pointer',
            width: '100%',
            height: '100%',
            transform: 'scale(3.5)',
            zIndex: 3
          }}
        />
        {/* Calendar visual icon */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
    </div>
  );
}
