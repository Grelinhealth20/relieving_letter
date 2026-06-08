import { useState, useRef, useCallback } from 'react';
import './App.css';
import {
  CalendarIcon, UserIcon, IdIcon, BriefcaseIcon, MapPinIcon,
  DownloadIcon, RefreshIcon, LoaderIcon,
  FormGroup, TextInput, DateInput, SectionHeading, Toast
} from './components';

// ── Helpers ───────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes('/')) return dateStr;
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return null;
  return `${d}/${m}/${y}`;
}

function Placeholder({ value, fallback }) {
  const isSet = value && value.trim() !== '';
  return <span className={isSet ? '' : 'ph'}>{isSet ? value : fallback}</span>;
}

function sanitizeFilenamePart(value, fallback) {
  const safe = (value || '')
    .trim()
    .replace(/\s+/g, '_')
    .split('')
    .filter(char => char.charCodeAt(0) >= 32 && !'<>:"/\\|?*'.includes(char))
    .join('')
    .replace(/\.+$/g, '');
  return safe || fallback;
}

function dataUrlFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function loadImageAsBase64(url, cacheKey) {
  const cached = localStorage.getItem(cacheKey);

  try {
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`Unable to load ${url}: ${response.status}`);

    const dataUrl = await dataUrlFromBlob(await response.blob());
    localStorage.setItem(cacheKey, dataUrl);
    return dataUrl;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

// ── LetterPreview ─────────────────────────────────────────
function LetterPreview({ data }) {
  const {
    letterDate, empName, empId, designation,
    dateOfJoining, lastWorkingDate, sigDate, sigPlace
  } = data;

  const fLetterDate = formatDate(letterDate);
  const fDOJ        = formatDate(dateOfJoining);
  const fLWD        = formatDate(lastWorkingDate);
  const fSigDate    = formatDate(sigDate);

  return (
    <div id="letter-preview">
      {/* ── Header — logo only ── */}
      <div className="letter-header">
        <img src="/logo.png" alt="Echo HMS" className="letter-logo" />
      </div>
      <div className="letter-header-accent" />

      {/* ── Body ── */}
      <div className="letter-body">
        <div className="letter-date">
          <strong>Date:</strong>&nbsp;
          <Placeholder value={fLetterDate} fallback="___________" />
        </div>

        <div className="letter-to-block">
          <p>To,</p>
          <p className="to-name">
            <Placeholder value={empName} fallback="[Employee Name]" />
          </p>
          <p>Employee ID:&nbsp;
            <Placeholder value={empId} fallback="__________" />
          </p>
        </div>

        <div className="letter-subject">
          <span className="subj-label">Subject:</span>
          <span className="subj-text">Relieving Letter</span>
        </div>

        <div className="letter-salutation">
          Dear <Placeholder value={empName} fallback="[Employee Name]" />,
        </div>

        <p className="letter-para">
          This is to formally acknowledge that you have been relieved from your duties at{' '}
          <strong>Echo HMS by Grelin Health India LLP</strong> with effect from{' '}
          <span className="bold-value">
            <Placeholder value={fLWD} fallback="[Last Working Date]" />
          </span>.
        </p>

        <p className="letter-para">
          You were employed with us as{' '}
          <span className="bold-value">
            <Placeholder value={designation} fallback="[Designation]" />
          </span>{' '}
          from{' '}
          <span className="bold-value">
            <Placeholder value={fDOJ} fallback="[Date of Joining]" />
          </span>{' '}
          to{' '}
          <span className="bold-value">
            <Placeholder value={fLWD} fallback="[Last Working Date]" />
          </span>.
          During your tenure, you fulfilled your assigned responsibilities diligently and have
          completed the required handover of your duties, documents, and company assets in
          accordance with the organization's policies and procedures.
        </p>

        <p className="letter-para">
          We hereby confirm that there are no outstanding dues, liabilities, or obligations
          pending from your end as of your relieving date.
        </p>

        <p className="letter-para">
          We sincerely appreciate your contributions to the organization and thank you for your
          services. We wish you continued success and all the very best in your future endeavors.
        </p>
      </div>

      {/* ── Signoff ── */}
      <div className="letter-signoff">
        <p className="letter-yours">Yours sincerely,</p>
        <p className="letter-for-company">For Echo HMS by Grelin Health India LLP</p>

        <div className="sign-rule-wrap">
          <div className="sign-rule" />
          <div className="sign-rule-label">Authorised Signatory</div>
        </div>

        <div className="sig-block">
          <div className="sig-row">
            <span className="sig-label">Signature:</span>
            <img src="/signature.png" alt="Signature" className="sig-img" />
          </div>
          <div className="sig-row">
            <span className="sig-name">Sofia Balan</span>
          </div>
          <div className="sig-row">
            <span className="sig-label">Date:</span>
            <span className="sig-value">
              <Placeholder value={fSigDate} fallback="___________" />
            </span>
          </div>
          <div className="sig-row">
            <span className="sig-label">Place:</span>
            <span className="sig-value">
              <Placeholder value={sigPlace} fallback="___________" />
            </span>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="letter-footer">
        <div className="footer-address">
          <strong>Echo HMS by Grelin Health India LLP</strong><br />
          No. 44/80, Thanthai Periyar Nagar, Kundrathur Main Road,<br />
          Kummananchavadi, Ponammalle, Chennai - 600 056
        </div>
      </div>
    </div>
  );
}

// ── ExperiencePreview ─────────────────────────────────────
function ExperiencePreview({ data }) {
  const {
    letterDate, empName, empId, designation,
    dateOfJoining, lastWorkingDate, sigDate, sigPlace
  } = data;

  const fLetterDate = formatDate(letterDate);
  const fDOJ        = formatDate(dateOfJoining);
  const fLWD        = formatDate(lastWorkingDate);
  const fSigDate    = formatDate(sigDate);

  return (
    <div id="letter-preview">
      {/* ── Header — logo only ── */}
      <div className="letter-header">
        <img src="/logo.png" alt="Echo HMS" className="letter-logo" />
      </div>
      <div className="letter-header-accent" />

      {/* ── Body ── */}
      <div className="letter-body">
        <div className="letter-date">
          <strong>Date:</strong>&nbsp;
          <Placeholder value={fLetterDate} fallback="___________" />
        </div>

        <div className="letter-to-block">
          <p>To,</p>
          <p className="to-name">
            <Placeholder value={empName} fallback="[Employee Name]" />
          </p>
          <p>Employee ID:&nbsp;
            <Placeholder value={empId} fallback="__________" />
          </p>
        </div>

        <div className="letter-subject">
          <span className="subj-label">Subject:</span>
          <span className="subj-text">Experience Certificate</span>
        </div>

        <div className="letter-salutation">
          Dear <Placeholder value={empName} fallback="[Employee Name]" />,
        </div>

        <p className="letter-para">
          This is to certify that you were employed with <strong>Echo HMS by Grelin Health India LLP</strong> as{' '}
          <span className="bold-value">
            <Placeholder value={designation} fallback="[Designation]" />
          </span>{' '}
          from{' '}
          <span className="bold-value">
            <Placeholder value={fDOJ} fallback="[Date of Joining]" />
          </span>{' '}
          to{' '}
          <span className="bold-value">
            <Placeholder value={fLWD} fallback="[Last Working Date]" />
          </span>.
        </p>

        <p className="letter-para">
          During your tenure with the organization, you were entrusted with responsibilities relevant to your role and demonstrated dedication, professionalism, and commitment in carrying out your duties. You consistently contributed to the organization's objectives and maintained a professional approach towards colleagues, clients, and assigned tasks.
        </p>

        <p className="letter-para">
          We appreciate your contributions during your association with us and thank you for your services. We wish you every success and prosperity in your future professional endeavors.
        </p>
      </div>

      {/* ── Signoff ── */}
      <div className="letter-signoff">
        <p className="letter-yours">Yours sincerely,</p>
        <p className="letter-for-company">For Echo HMS by Grelin Health India LLP</p>

        <div className="sign-rule-wrap">
          <div className="sign-rule" />
          <div className="sign-rule-label">Authorised Signatory</div>
        </div>

        <div className="sig-block">
          <div className="sig-row">
            <span className="sig-label">Signature:</span>
            <img src="/signature.png" alt="Signature" className="sig-img" />
          </div>
          <div className="sig-row">
            <span className="sig-name">Sofia Balan</span>
          </div>
          <div className="sig-row">
            <span className="sig-label">Date:</span>
            <span className="sig-value">
              <Placeholder value={fSigDate} fallback="___________" />
            </span>
          </div>
          <div className="sig-row">
            <span className="sig-label">Place:</span>
            <span className="sig-value">
              <Placeholder value={sigPlace} fallback="___________" />
            </span>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="letter-footer">
        <div className="footer-address">
          <strong>Echo HMS by Grelin Health India LLP</strong><br />
          No. 44/80, Thanthai Periyar Nagar, Kundrathur Main Road,<br />
          Kummananchavadi, Ponammalle, Chennai - 600 056
        </div>
      </div>
    </div>
  );
}

// ── Progress pill ─────────────────────────────────────────
function CompletionBar({ data }) {
  const fields = [
    data.letterDate, data.empName, data.empId, data.designation,
    data.dateOfJoining, data.lastWorkingDate, data.sigDate, data.sigPlace
  ];
  const filled = fields.filter(f => f && f.trim() !== '').length;
  const pct = Math.round((filled / fields.length) * 100);

  return (
    <div style={{ marginBottom: 20 }}>
      <div className="progress-label">
        <span>Form Completion</span>
        <span style={{ color: pct === 100 ? '#047857' : 'var(--gray-500)', fontWeight: 600 }}>
          {pct}% ({filled}/{fields.length})
        </span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────
export default function App() {
  const [form, setForm] = useState({
    letterDate: '',
    empName: '',
    empId: '',
    designation: '',
    dateOfJoining: '',
    lastWorkingDate: '',
    sigDate: '',
    sigPlace: '',
  });

  const [activeTab, setActiveTab] = useState('relieving');
  const [toast, setToast] = useState({ visible: false, type: 'success', message: '' });
  const [generating, setGenerating] = useState(false);
  const toastTimer = useRef(null);

  const set = (field) => (val) => setForm(prev => ({ ...prev, [field]: val }));

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, type, message });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3800);
  }, []);

  const validate = () => {
    const required = {
      letterDate: 'Date of Letter',
      empName: 'Employee Name',
      empId: 'Employee ID',
      designation: 'Designation',
      dateOfJoining: 'Date of Joining',
      lastWorkingDate: 'Last Working Date',
      sigDate: 'Signature Date',
      sigPlace: 'Place',
    };
    for (const [key, label] of Object.entries(required)) {
      if (!form[key] || !form[key].trim()) {
        showToast(`Please fill in: ${label}`, 'error');
        document.getElementById(key)?.focus();
        return false;
      }
    }

    const dateFields = {
      letterDate: 'Date of Letter',
      dateOfJoining: 'Date of Joining',
      lastWorkingDate: 'Last Working Date',
      sigDate: 'Signature Date'
    };
    for (const [key, label] of Object.entries(dateFields)) {
      const val = form[key];
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      if (!dateRegex.test(val)) {
        showToast(`Enter date in DD/MM/YYYY format: ${label}`, 'error');
        document.getElementById(key)?.focus();
        return false;
      }
      const [, d, m, y] = val.match(dateRegex);
      const day = parseInt(d, 10);
      const month = parseInt(m, 10);
      const year = parseInt(y, 10);
      if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) {
        showToast(`Invalid date value for: ${label}`, 'error');
        document.getElementById(key)?.focus();
        return false;
      }
    }
    return true;
  };

  const downloadRelievingPDF = async () => {
    if (!validate()) return;
    setGenerating(true);
    showToast('Generating PDF...', 'info');

    try {
      const { jsPDF } = await import('jspdf');

      const logoData = await loadImageAsBase64('/logo.png', 'relieving-letter:logo');
      const sigData  = await loadImageAsBase64('/signature.png', 'relieving-letter:signature');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const {
        letterDate, empName, empId, designation,
        dateOfJoining, lastWorkingDate, sigDate, sigPlace
      } = form;

      const fLetterDate = formatDate(letterDate);
      const fDOJ        = formatDate(dateOfJoining);
      const fLWD        = formatDate(lastWorkingDate);
      const fSigDate    = formatDate(sigDate);

      // --- Draw double border ---
      // Outer border (navy, 0.8mm line width)
      pdf.setDrawColor(15, 30, 53); // #0f1e35
      pdf.setLineWidth(0.8);
      pdf.rect(10, 10, 190, 277);

      // Inner border (light navy, 0.25mm line width)
      pdf.setDrawColor(15, 30, 53);
      pdf.setLineWidth(0.25);
      pdf.rect(13, 13, 184, 271);

      // --- Draw Logo ---
      // Centered at top: width = 75mm, aspect ratio = 6.282:1 -> height = 11.94mm
      const logoW = 75;
      const logoH = logoW / 6.282;
      const logoX = (210 - logoW) / 2;
      pdf.addImage(logoData, 'PNG', logoX, 20, logoW, logoH);

      // Accent gold line under logo header
      pdf.setDrawColor(200, 169, 81); // #c8a951
      pdf.setLineWidth(0.4);
      pdf.line(25, 38, 185, 38);

      // --- Content margins ---
      const xStart = 25;
      const maxW = 160;

      // Date of Letter
      pdf.setFont('times', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(17, 17, 17);
      pdf.text('Date:', xStart, 48);
      pdf.setFont('times', 'normal');
      pdf.text(fLetterDate || '', xStart + 12, 48);

      // Recipient Block
      let y = 58;
      pdf.setFont('times', 'normal');
      pdf.setFontSize(13);
      pdf.text('To,', xStart, y);
      
      y += 6.5;
      pdf.setFont('times', 'bold');
      pdf.setFontSize(14.5);
      pdf.setTextColor(15, 30, 53);
      pdf.text(empName || '', xStart, y);

      y += 6.5;
      pdf.setFont('times', 'normal');
      pdf.setFontSize(13);
      pdf.setTextColor(17, 17, 17);
      pdf.text(`Employee ID: ${empId || ''}`, xStart, y);

      // Subject Block
      y += 10;
      // Background block
      pdf.setFillColor(244, 246, 249);
      pdf.rect(xStart, y, maxW, 12, 'F');
      // Left vertical border
      pdf.setDrawColor(15, 30, 53);
      pdf.setLineWidth(1);
      pdf.line(xStart, y, xStart, y + 12);

      pdf.setFontSize(13);
      pdf.setFont('times', 'bold');
      pdf.setTextColor(15, 30, 53);
      pdf.text('Subject:', xStart + 5, y + 7.8);
      
      pdf.setFont('times', 'bold');
      const subjLabelW = pdf.getTextWidth('Subject: ');
      pdf.text('Relieving Letter', xStart + 5 + subjLabelW, y + 7.8);
      // Underline the subject text
      const subjTextW = pdf.getTextWidth('Relieving Letter');
      pdf.setLineWidth(0.25);
      pdf.line(xStart + 5 + subjLabelW, y + 8.8, xStart + 5 + subjLabelW + subjTextW, y + 8.8);

      // Salutation
      y += 22;
      pdf.setFont('times', 'bold');
      pdf.setFontSize(13.5);
      pdf.setTextColor(13, 13, 13);
      pdf.text(`Dear ${empName || ''},`, xStart, y);

      // Helper to render justified paragraphs
      const drawParagraph = (segments, yStart) => {
        const tokens = [];
        segments.forEach(seg => {
          const words = seg.text.split(' ');
          words.forEach((word, idx) => {
            if (word === '' && idx > 0 && idx < words.length - 1) return;
            tokens.push({
              text: word,
              bold: !!seg.bold,
              spaceAfter: idx < words.length - 1
            });
          });
        });

        const lines = [];
        let currentLine = [];
        let currentWidth = 0;
        
        pdf.setFont('times', 'normal');
        pdf.setFontSize(12.5);
        const spaceWidth = pdf.getTextWidth(' ');

        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i];
          pdf.setFont('times', token.bold ? 'bold' : 'normal');
          const tokenWidth = pdf.getTextWidth(token.text);
          const extra = currentLine.length > 0 ? spaceWidth : 0;

          if (currentWidth + extra + tokenWidth > maxW && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = [token];
            currentWidth = tokenWidth;
          } else {
            currentLine.push(token);
            currentWidth += extra + tokenWidth;
          }
        }
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }

        let currentY = yStart;
        lines.forEach((line, lineIdx) => {
          const isLastLine = lineIdx === lines.length - 1;
          let customSpaceWidth = spaceWidth;

          if (!isLastLine && line.length > 1) {
            let totalWordWidth = 0;
            line.forEach(token => {
              pdf.setFont('times', token.bold ? 'bold' : 'normal');
              totalWordWidth += pdf.getTextWidth(token.text);
            });
            customSpaceWidth = (maxW - totalWordWidth) / (line.length - 1);
            if (customSpaceWidth < spaceWidth * 0.5 || customSpaceWidth > spaceWidth * 3) {
              customSpaceWidth = spaceWidth;
            }
          }

          let currentX = xStart;
          line.forEach((token, tokenIdx) => {
            pdf.setFont('times', token.bold ? 'bold' : 'normal');
            pdf.setTextColor(26, 26, 26);
            pdf.text(token.text, currentX, currentY);
            currentX += pdf.getTextWidth(token.text) + (tokenIdx < line.length - 1 ? customSpaceWidth : 0);
          });

          currentY += 7.5; // Line height
        });

        return currentY;
      };

      // Paragraph 1
      y += 8;
      const p1 = [
        { text: "This is to formally acknowledge that you have been relieved from your duties at " },
        { text: "Echo HMS by Grelin Health India LLP", bold: true },
        { text: " with effect from " },
        { text: fLWD || '', bold: true },
        { text: "." }
      ];
      y = drawParagraph(p1, y);

      // Paragraph 2
      y += 5;
      const p2 = [
        { text: "You were employed with us as " },
        { text: designation || '', bold: true },
        { text: " from " },
        { text: fDOJ || '', bold: true },
        { text: " to " },
        { text: fLWD || '', bold: true },
        { text: ". During your tenure, you fulfilled your assigned responsibilities diligently and have completed the required handover of your duties, documents, and company assets in accordance with the organization's policies and procedures." }
      ];
      y = drawParagraph(p2, y);

      // Paragraph 3
      y += 5;
      const p3 = [
        { text: "We hereby confirm that there are no outstanding dues, liabilities, or obligations pending from your end as of your relieving date." }
      ];
      y = drawParagraph(p3, y);

      // Paragraph 4
      y += 5;
      const p4 = [
        { text: "We sincerely appreciate your contributions to the organization and thank you for your services. We wish you continued success and all the very best in your future endeavors." }
      ];
      y = drawParagraph(p4, y);

      // Signoff Section
      y += 5;
      pdf.setFont('times', 'normal');
      pdf.setFontSize(13);
      pdf.text('Yours sincerely,', xStart, y);

      y += 6;
      pdf.setFont('times', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(15, 30, 53);
      pdf.text('For Echo HMS by Grelin Health India LLP', xStart, y);

      y += 18;
      pdf.setDrawColor(15, 30, 53);
      pdf.setLineWidth(0.4);
      pdf.line(xStart, y, xStart + 60, y);
      
      y += 4.5;
      pdf.setFont('times', 'italic');
      pdf.setFontSize(10.5);
      pdf.setTextColor(68, 68, 68);
      pdf.text('Authorised Signatory', xStart, y);

      // Signature details block on the right or below
      y += 6;
      const sigStartY = y;
      
      pdf.setFont('times', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(15, 30, 53);
      pdf.text('Signature:', xStart, sigStartY + 6);
      
      // Draw signature image
      pdf.addImage(sigData, 'PNG', xStart + 22, sigStartY, 32, 10);

      pdf.setFont('times', 'bold');
      pdf.setFontSize(14);
      pdf.text('Sofia Balan', xStart, sigStartY + 13);

      pdf.setFont('times', 'bold');
      pdf.setFontSize(13);
      pdf.text('Date:', xStart, sigStartY + 19);
      pdf.setFont('times', 'normal');
      pdf.text(fSigDate || '', xStart + 12, sigStartY + 19);
      pdf.line(xStart + 12, sigStartY + 20, xStart + 45, sigStartY + 20);

      pdf.setFont('times', 'bold');
      pdf.text('Place:', xStart, sigStartY + 25);
      pdf.setFont('times', 'normal');
      pdf.text(sigPlace || '', xStart + 13, sigStartY + 25);
      pdf.line(xStart + 13, sigStartY + 26, xStart + 45, sigStartY + 26);

      // --- Draw Footer ---
      const footerY = 264;
      pdf.setDrawColor(15, 30, 53);
      pdf.setLineWidth(0.25);
      pdf.line(210/2 - 30, footerY - 5, 210/2 + 30, footerY - 5);
      pdf.setFont('times', 'bold');
      pdf.setFontSize(11.5);
      pdf.setTextColor(15, 30, 53);
      const companyLabel = 'Echo HMS by Grelin Health India LLP';
      const companyLabelW = pdf.getTextWidth(companyLabel);
      pdf.text(companyLabel, (210 - companyLabelW) / 2, footerY);

      pdf.setFont('times', 'normal');
      pdf.setFontSize(10.5);
      pdf.setTextColor(74, 85, 104);
      
      const addr1 = 'No. 44/80, Thanthai Periyar Nagar, Kundrathur Main Road,';
      const addr1W = pdf.getTextWidth(addr1);
      pdf.text(addr1, (210 - addr1W) / 2, footerY + 5.5);

      const addr2 = 'Kummananchavadi, Ponammalle, Chennai - 600 056';
      const addr2W = pdf.getTextWidth(addr2);
      pdf.text(addr2, (210 - addr2W) / 2, footerY + 11);
      // Save PDF using data URI anchor to guarantee filename in all browser contexts
      const name = empName.replace(/\s+/g, '_') || 'Employee';
      const filename = `${name}_Relieving_Letter.pdf`;
      const dataUriString = pdf.output('datauristring');
      
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = dataUriString;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
      }, 300);

      showToast('PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error generating PDF. Please try again.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const downloadExperiencePDF = async () => {
    if (!validate()) return;
    setGenerating(true);
    showToast('Generating Experience Certificate…', 'info');

    try {
      const { jsPDF } = await import('jspdf');

      const logoData = await loadImageAsBase64('/logo.png', 'logoDataUrl');
      const sigData  = await loadImageAsBase64('/signature.png', 'sigDataUrl');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const {
        letterDate, empName, empId, designation,
        dateOfJoining, lastWorkingDate, sigDate, sigPlace
      } = form;

      const fLetterDate = formatDate(letterDate);
      const fDOJ        = formatDate(dateOfJoining);
      const fLWD        = formatDate(lastWorkingDate);
      const fSigDate    = formatDate(sigDate);

      // --- Draw double border ---
      // Outer border (navy, 0.8mm line width)
      pdf.setDrawColor(15, 30, 53); // #0f1e35
      pdf.setLineWidth(0.8);
      pdf.rect(10, 10, 190, 277);

      // Inner border (light navy, 0.25mm line width)
      pdf.setDrawColor(15, 30, 53);
      pdf.setLineWidth(0.25);
      pdf.rect(13, 13, 184, 271);

      // --- Draw Logo ---
      const logoW = 75;
      const logoH = logoW / 6.282;
      const logoX = (210 - logoW) / 2;
      pdf.addImage(logoData, 'PNG', logoX, 20, logoW, logoH);

      // Accent gold line under logo header
      pdf.setDrawColor(200, 169, 81); // #c8a951
      pdf.setLineWidth(0.4);
      pdf.line(25, 38, 185, 38);

      // --- Content margins ---
      const xStart = 25;
      const maxW = 160;

      // Date of Letter
      pdf.setFont('times', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(17, 17, 17);
      pdf.text('Date:', xStart, 48);
      pdf.setFont('times', 'normal');
      pdf.text(fLetterDate || '', xStart + 12, 48);

      // Recipient Block
      let y = 58;
      pdf.setFont('times', 'normal');
      pdf.setFontSize(13);
      pdf.text('To,', xStart, y);
      
      y += 6.5;
      pdf.setFont('times', 'bold');
      pdf.setFontSize(14.5);
      pdf.setTextColor(15, 30, 53);
      pdf.text(empName || '', xStart, y);

      y += 6.5;
      pdf.setFont('times', 'normal');
      pdf.setFontSize(13);
      pdf.setTextColor(17, 17, 17);
      pdf.text(`Employee ID: ${empId || ''}`, xStart, y);

      // Subject Block
      y += 10;
      // Background block
      pdf.setFillColor(244, 246, 249);
      pdf.rect(xStart, y, maxW, 12, 'F');
      // Left vertical border
      pdf.setDrawColor(15, 30, 53);
      pdf.setLineWidth(1);
      pdf.line(xStart, y, xStart, y + 12);

      pdf.setFontSize(13);
      pdf.setFont('times', 'bold');
      pdf.setTextColor(15, 30, 53);
      pdf.text('Subject:', xStart + 5, y + 7.8);
      
      pdf.setFont('times', 'bold');
      const subjLabelW = pdf.getTextWidth('Subject: ');
      pdf.text('Experience Certificate', xStart + 5 + subjLabelW, y + 7.8);
      // Underline the subject text
      const subjTextW = pdf.getTextWidth('Experience Certificate');
      pdf.setLineWidth(0.25);
      pdf.line(xStart + 5 + subjLabelW, y + 8.8, xStart + 5 + subjLabelW + subjTextW, y + 8.8);

      // Salutation
      y += 22;
      pdf.setFont('times', 'bold');
      pdf.setFontSize(13.5);
      pdf.setTextColor(13, 13, 13);
      pdf.text(`Dear ${empName || ''},`, xStart, y);

      // Helper to render justified paragraphs
      const drawParagraph = (segments, yStart) => {
        const tokens = [];
        segments.forEach(seg => {
          const words = seg.text.split(' ');
          words.forEach((word, idx) => {
            if (word === '' && idx > 0 && idx < words.length - 1) return;
            tokens.push({
              text: word,
              bold: !!seg.bold,
              spaceAfter: idx < words.length - 1
            });
          });
        });

        const lines = [];
        let currentLine = [];
        let currentWidth = 0;
        
        pdf.setFont('times', 'normal');
        pdf.setFontSize(12.5);
        const spaceWidth = pdf.getTextWidth(' ');

        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i];
          pdf.setFont('times', token.bold ? 'bold' : 'normal');
          const tokenWidth = pdf.getTextWidth(token.text);
          const extra = currentLine.length > 0 ? spaceWidth : 0;

          if (currentWidth + extra + tokenWidth > maxW && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = [token];
            currentWidth = tokenWidth;
          } else {
            currentLine.push(token);
            currentWidth += extra + tokenWidth;
          }
        }
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }

        let currentY = yStart;
        lines.forEach((line, lineIdx) => {
          const isLastLine = lineIdx === lines.length - 1;
          let customSpaceWidth = spaceWidth;

          if (!isLastLine && line.length > 1) {
            let totalWordWidth = 0;
            line.forEach(token => {
              pdf.setFont('times', token.bold ? 'bold' : 'normal');
              totalWordWidth += pdf.getTextWidth(token.text);
            });
            customSpaceWidth = (maxW - totalWordWidth) / (line.length - 1);
            if (customSpaceWidth < spaceWidth * 0.5 || customSpaceWidth > spaceWidth * 3) {
              customSpaceWidth = spaceWidth;
            }
          }

          let currentX = xStart;
          line.forEach((token, tokenIdx) => {
            pdf.setFont('times', token.bold ? 'bold' : 'normal');
            pdf.setTextColor(26, 26, 26);
            pdf.text(token.text, currentX, currentY);
            currentX += pdf.getTextWidth(token.text) + (tokenIdx < line.length - 1 ? customSpaceWidth : 0);
          });

          currentY += 7.5; // Line height
        });

        return currentY;
      };

      // Paragraph 1
      y += 8;
      const p1 = [
        { text: "This is to certify that you were employed with " },
        { text: "Echo HMS by Grelin Health India LLP", bold: true },
        { text: " as " },
        { text: designation || '', bold: true },
        { text: " from " },
        { text: fDOJ || '', bold: true },
        { text: " to " },
        { text: fLWD || '', bold: true },
        { text: "." }
      ];
      y = drawParagraph(p1, y);

      // Paragraph 2
      y += 5;
      const p2 = [
        { text: "During your tenure with the organization, you were entrusted with responsibilities relevant to your role and demonstrated dedication, professionalism, and commitment in carrying out your duties. You consistently contributed to the organization's objectives and maintained a professional approach towards colleagues, clients, and assigned tasks." }
      ];
      y = drawParagraph(p2, y);

      // Paragraph 3
      y += 5;
      const p3 = [
        { text: "We appreciate your contributions during your association with us and thank you for your services. We wish you every success and prosperity in your future professional endeavors." }
      ];
      y = drawParagraph(p3, y);

      // Signoff Section
      y += 8;
      pdf.setFont('times', 'normal');
      pdf.setFontSize(13);
      pdf.text('Yours sincerely,', xStart, y);

      y += 6;
      pdf.setFont('times', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(15, 30, 53);
      pdf.text('For Echo HMS by Grelin Health India LLP', xStart, y);

      y += 18;
      pdf.setDrawColor(15, 30, 53);
      pdf.setLineWidth(0.4);
      pdf.line(xStart, y, xStart + 60, y);
      
      y += 4.5;
      pdf.setFont('times', 'italic');
      pdf.setFontSize(10.5);
      pdf.setTextColor(68, 68, 68);
      pdf.text('Authorised Signatory', xStart, y);

      // Signature details block
      y += 6;
      const sigStartY = y;
      
      pdf.setFont('times', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(15, 30, 53);
      pdf.text('Signature:', xStart, sigStartY + 6);
      
      pdf.addImage(sigData, 'PNG', xStart + 22, sigStartY, 32, 10);

      pdf.setFont('times', 'bold');
      pdf.setFontSize(14);
      pdf.text('Sofia Balan', xStart, sigStartY + 13);

      pdf.setFont('times', 'bold');
      pdf.setFontSize(13);
      pdf.text('Date:', xStart, sigStartY + 19);
      pdf.setFont('times', 'normal');
      pdf.text(fSigDate || '', xStart + 12, sigStartY + 19);
      pdf.line(xStart + 12, sigStartY + 20, xStart + 45, sigStartY + 20);

      pdf.setFont('times', 'bold');
      pdf.text('Place:', xStart, sigStartY + 25);
      pdf.setFont('times', 'normal');
      pdf.text(sigPlace || '', xStart + 13, sigStartY + 25);
      pdf.line(xStart + 13, sigStartY + 26, xStart + 45, sigStartY + 26);

      // --- Draw Footer ---
      const footerY = 264;
      pdf.setDrawColor(15, 30, 53);
      pdf.setLineWidth(0.25);
      pdf.line(210/2 - 30, footerY - 5, 210/2 + 30, footerY - 5);
      pdf.setFont('times', 'bold');
      pdf.setFontSize(11.5);
      pdf.setTextColor(15, 30, 53);
      const companyLabel = 'Echo HMS by Grelin Health India LLP';
      const companyLabelW = pdf.getTextWidth(companyLabel);
      pdf.text(companyLabel, (210 - companyLabelW) / 2, footerY);

      pdf.setFont('times', 'normal');
      pdf.setFontSize(10.5);
      pdf.setTextColor(74, 85, 104);
      
      const addr1 = 'No. 44/80, Thanthai Periyar Nagar, Kundrathur Main Road,';
      const addr1W = pdf.getTextWidth(addr1);
      pdf.text(addr1, (210 - addr1W) / 2, footerY + 5.5);

      const addr2 = 'Kummananchavadi, Ponammalle, Chennai - 600 056';
      const addr2W = pdf.getTextWidth(addr2);
      pdf.text(addr2, (210 - addr2W) / 2, footerY + 11);

      // Save PDF using data URI anchor
      const name = empName.replace(/\s+/g, '_') || 'Employee';
      const filename = `${name}_Experience_Certificate.pdf`;
      const dataUriString = pdf.output('datauristring');
      
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = dataUriString;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
      }, 300);

      showToast('Experience Certificate downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error generating Experience Certificate. Please try again.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setForm({
      letterDate: '', empName: '', empId: '', designation: '',
      dateOfJoining: '', lastWorkingDate: '', sigDate: '', sigPlace: ''
    });
    showToast('Form cleared.', 'info');
  };

  return (
    <>
      {/* ── Top Bar ── */}
      <header className="topbar">
        <div className="topbar-left">
          <img src="/logo.png" alt="Echo HMS" className="topbar-logo" />
          <div className="topbar-divider" />
          <div className="topbar-info">
            <h1>Relieving Letter Generator</h1>
            <p>Echo HMS by Grelin Health India LLP</p>
          </div>
        </div>
        <div className="topbar-badge">
          <div className="topbar-badge-dot" />
          Enterprise
        </div>
      </header>

      {/* ── Two-column layout ── */}
      <div className="app-layout">

        {/* ══ Form Panel ══ */}
        <aside className="form-panel">
          <div className="form-panel-header">
            <h2>Generate Relieving Letter</h2>
            <p>Fill in the details below to generate an official letter</p>
          </div>

          <CompletionBar data={form} />

          {/* Date of Letter */}
          <div className="form-section">
            <SectionHeading>Document Details</SectionHeading>
            <FormGroup label="Date of Letter" required hint="Will display as DD/MM/YYYY">
              <DateInput
                id="letterDate"
                icon={CalendarIcon}
                value={form.letterDate}
                onChange={set('letterDate')}
              />
            </FormGroup>
          </div>

          {/* Employee Details */}
          <div className="form-section">
            <SectionHeading>Employee Information</SectionHeading>

            <FormGroup label="Full Name" required>
              <TextInput
                id="empName"
                icon={UserIcon}
                placeholder="e.g. Priya Sharma"
                value={form.empName}
                onChange={set('empName')}
              />
            </FormGroup>

            <FormGroup label="Employee ID" required>
              <TextInput
                id="empId"
                icon={IdIcon}
                placeholder="e.g. EMP-2024-0047"
                value={form.empId}
                onChange={set('empId')}
              />
            </FormGroup>

            <FormGroup label="Designation" required>
              <TextInput
                id="designation"
                icon={BriefcaseIcon}
                placeholder="e.g. Senior Software Engineer"
                value={form.designation}
                onChange={set('designation')}
              />
            </FormGroup>
          </div>

          {/* Employment Period */}
          <div className="form-section">
            <SectionHeading>Employment Period</SectionHeading>
            <div className="form-row">
              <FormGroup label="Date of Joining" required>
                <DateInput
                  id="dateOfJoining"
                  icon={CalendarIcon}
                  value={form.dateOfJoining}
                  onChange={set('dateOfJoining')}
                />
              </FormGroup>
              <FormGroup label="Last Working Date" required>
                <DateInput
                  id="lastWorkingDate"
                  icon={CalendarIcon}
                  value={form.lastWorkingDate}
                  onChange={set('lastWorkingDate')}
                />
              </FormGroup>
            </div>
          </div>

          {/* Signatory */}
          <div className="form-section">
            <SectionHeading>Signatory Details</SectionHeading>

            <FormGroup label="Signature Date" required>
              <DateInput
                id="sigDate"
                icon={CalendarIcon}
                value={form.sigDate}
                onChange={set('sigDate')}
              />
            </FormGroup>

            <FormGroup label="Place" required>
              <TextInput
                id="sigPlace"
                icon={MapPinIcon}
                placeholder="e.g. Bengaluru"
                value={form.sigPlace}
                onChange={set('sigPlace')}
              />
            </FormGroup>
          </div>

          {/* Actions */}
          <div className="btn-group">
            <button
              className="btn btn-primary"
              onClick={downloadRelievingPDF}
              disabled={generating}
            >
              {generating ? <LoaderIcon /> : <DownloadIcon />}
              Download Relieving Letter
            </button>
            
            <button
              className="btn btn-primary btn-gold"
              onClick={downloadExperiencePDF}
              disabled={generating}
              style={{ background: 'linear-gradient(135deg, #c8a951, #8b6508)' }}
            >
              {generating ? <LoaderIcon /> : <DownloadIcon />}
              Download Experience Certificate
            </button>
            
            <button className="btn btn-secondary" onClick={resetForm} style={{ marginTop: '4px' }}>
              <RefreshIcon />
              Clear Form
            </button>
          </div>
        </aside>

        {/* ══ Preview Panel ══ */}
        <main className="preview-panel">
          <div className="preview-toolbar">
            <div className="preview-toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span className="preview-title">Live Preview</span>
              
              <div className="tab-buttons" style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'relieving' ? 'active' : ''}`}
                  onClick={() => setActiveTab('relieving')}
                  style={{
                    padding: '4px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: '1px solid var(--gray-300)',
                    background: activeTab === 'relieving' ? '#1a3255' : 'var(--white)',
                    color: activeTab === 'relieving' ? 'var(--white)' : 'var(--gray-700)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Relieving Letter
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'experience' ? 'active' : ''}`}
                  onClick={() => setActiveTab('experience')}
                  style={{
                    padding: '4px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: '1px solid var(--gray-300)',
                    background: activeTab === 'experience' ? '#1a3255' : 'var(--white)',
                    color: activeTab === 'experience' ? 'var(--white)' : 'var(--gray-700)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Experience Certificate
                </button>
              </div>

              <div className="live-badge">
                <div className="live-dot" />
                LIVE
              </div>
            </div>
            <span className="page-info">A4 - Portrait - PDF Ready</span>
          </div>

          <div className="letter-shadow-wrap">
            {activeTab === 'relieving' ? (
              <LetterPreview data={form} />
            ) : (
              <ExperiencePreview data={form} />
            )}
          </div>
        </main>
      </div>

      <Toast visible={toast.visible} type={toast.type} message={toast.message} />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
