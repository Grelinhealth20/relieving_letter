import { useState, useRef, useCallback } from 'react';
import './App.css';
import {
  CalendarIcon, UserIcon, IdIcon, BriefcaseIcon,
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



// ── Progress pill ─────────────────────────────────────────
function CompletionBar({ data }) {
  const fields = [
    data.letterDate, data.empName, data.empId, data.designation,
    data.dateOfJoining, data.lastWorkingDate, data.sigDate
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
  });


  const [toast, setToast] = useState({ visible: false, type: 'success', message: '' });
  const [activePreviewTab, setActivePreviewTab] = useState('relieving'); // 'relieving' | 'experience'
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

  // ── Shared justified-paragraph renderer ─────────────────────────────────
  // Splits mixed bold/normal segments into tokens, wraps to maxW mm,
  // and justifies every line except the last (matching CSS text-align:justify).
  const makeDrawParagraph = (pdf, xStart, maxW) => (segments, yStart) => {
    const LINE_H = 6.0; // 6mm per line ≈ 1.65 × 13.5px (preview line-height)
    pdf.setFontSize(10.5);
    pdf.setFont('times', 'normal');
    const spaceW = pdf.getTextWidth(' ');

    // Tokenise
    const tokens = [];
    segments.forEach(seg => {
      seg.text.split(' ').forEach((word, idx, arr) => {
        if (word === '' && idx > 0 && idx < arr.length - 1) return;
        tokens.push({ text: word, bold: !!seg.bold });
      });
    });

    // Word-wrap
    const lines = [];
    let curLine = [], curW = 0;
    tokens.forEach(tok => {
      pdf.setFont('times', tok.bold ? 'bold' : 'normal');
      const tw = pdf.getTextWidth(tok.text);
      const gap = curLine.length > 0 ? spaceW : 0;
      if (curW + gap + tw > maxW && curLine.length > 0) {
        lines.push(curLine);
        curLine = [tok]; curW = tw;
      } else {
        curLine.push(tok); curW += gap + tw;
      }
    });
    if (curLine.length > 0) lines.push(curLine);

    // Render with justification
    let cy = yStart;
    lines.forEach((line, li) => {
      const isLast = li === lines.length - 1;
      let sw = spaceW;
      if (!isLast && line.length > 1) {
        let tw = 0;
        line.forEach(t => { pdf.setFont('times', t.bold ? 'bold' : 'normal'); tw += pdf.getTextWidth(t.text); });
        const candidate = (maxW - tw) / (line.length - 1);
        if (candidate >= spaceW * 0.5 && candidate <= spaceW * 3) sw = candidate;
      }
      let cx = xStart;
      line.forEach((tok, ti) => {
        pdf.setFont('times', tok.bold ? 'bold' : 'normal');
        pdf.setTextColor(26, 26, 26);
        pdf.text(tok.text, cx, cy);
        cx += pdf.getTextWidth(tok.text) + (ti < line.length - 1 ? sw : 0);
      });
      cy += LINE_H;
    });
    return cy;
  };

  // ── Shared page chrome (border, logo, gold line, footer) ────────────────
  const drawPageChrome = (pdf, logoData) => {
    // Outer thick border — #0f1e35
    pdf.setDrawColor(15, 30, 53);
    pdf.setLineWidth(0.8);
    pdf.rect(10, 10, 190, 277);
    // Inner thin border
    pdf.setDrawColor(15, 30, 53);
    pdf.setLineWidth(0.25);
    pdf.rect(13, 13, 184, 271);

    // Logo — centred, height ≈ 8.3 mm (52 / 6.282), top y=17 matching
    // preview header padding-top 24px ≈ 9mm but logo baseline is at ~25mm
    const logoW = 52;
    const logoH = logoW / 6.282; // ~8.28 mm
    pdf.addImage(logoData, 'PNG', (210 - logoW) / 2, 17, logoW, logoH);

    // Gold accent line below header (preview: height 0.4mm solid #c8a951)
    pdf.setDrawColor(200, 169, 81);
    pdf.setLineWidth(0.4);
    pdf.line(25, 29.5, 185, 29.5);

    // Footer gold line (preview: borderTop 0.5mm #c8a951 at letter-footer top)
    const footerLineY = 264;
    pdf.setDrawColor(200, 169, 81);
    pdf.setLineWidth(0.5);
    pdf.line(25, footerLineY, 185, footerLineY);

    // Footer company name — bold, #0f1e35, fontSize 10 (≈ 13.3px ≈ preview 11px)
    const footerTextY = footerLineY + 4.5;
    pdf.setFont('times', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(15, 30, 53);
    const footerCompany = 'Echo HMS by Grelin Health India LLP';
    pdf.text(footerCompany, (210 - pdf.getTextWidth(footerCompany)) / 2, footerTextY);

    // Footer address — normal, #64646e, fontSize 8.5
    pdf.setFont('times', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 100, 110);
    const footerAddr = 'No. 44/80, Thanthai Periyar Nagar, Kundrathur Main Road, Kummananchavadi, Ponammalle, Chennai - 600 056';
    pdf.text(footerAddr, (210 - pdf.getTextWidth(footerAddr)) / 2, footerTextY + 4.5);
  };

  // ── Shared header block (Date / To / Subject / Salutation) ──────────────
  // Returns y position after the salutation line so body paragraphs start there.
  const drawLetterHeader = (pdf, subjectText, fLetterDate, empName, empId) => {
    const xStart = 25;
    // ── Date of Letter ──
    // Preview: font 13.5px bold (#1a1a1a), marginBottom 8mm
    // Body padding-top is 20mm; gold line at y=29.5; so body top = 29.5+20=49.5 but
    // we keep y=33 for "Date:" baseline consistent with preview letter-date position.
    const dateY = 38;
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12.5);
    pdf.setTextColor(17, 17, 17);
    pdf.text('Date:', xStart, dateY);

    pdf.setFont('times', 'normal');
    pdf.setFontSize(12.5);
    pdf.setTextColor(26, 26, 26);
    // Value sits immediately after "Date: " label (use getTextWidth for exact gap)
    pdf.text(fLetterDate || '', xStart + pdf.getTextWidth('Date: '), dateY);

    // ── To block ── (preview: marginBottom 8mm, font 13.5px)
    // "To," label
    let y = dateY + 8; // 8mm gap = preview marginBottom of letter-date
    pdf.setFont('times', 'normal');
    pdf.setFontSize(12.5);
    pdf.setTextColor(17, 17, 17);
    pdf.text('To,', xStart, y);

    // Employee name — bold 13px #0f1e35 (preview .to-name: 14.5px bold #0f1e35)
    y += 5.5;
    pdf.setFont('times', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(15, 30, 53);
    pdf.text(empName || '', xStart, y);

    // Employee ID — normal 12.5px #111 (preview: 13.5px #111)
    y += 5.5;
    pdf.setFont('times', 'normal');
    pdf.setFontSize(12.5);
    pdf.setTextColor(17, 17, 17);
    pdf.text(`Employee ID: ${empId || ''}`, xStart, y);

    // ── Subject block ── (preview: bg #f4f6f9, borderLeft 4px #0f1e35, padding 3mm 4mm, marginBottom 10mm)
    y += 8; // 8mm gap = preview marginBottom of letter-to-block
    const subjH = 9.5; // height of subject box in mm ≈ preview padding 3+3mm + text
    pdf.setFillColor(244, 246, 249);
    pdf.rect(xStart, y, 160, subjH, 'F');
    // Left accent bar (4px ≈ 1.5mm → use lineWidth 1.5, draw at xStart)
    pdf.setDrawColor(15, 30, 53);
    pdf.setLineWidth(1.5);
    pdf.line(xStart, y, xStart, y + subjH);
    // Reset lineWidth
    pdf.setLineWidth(0.4);

    // "Subject: " label
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12.5);
    pdf.setTextColor(15, 30, 53);
    const subjLabelText = 'Subject: ';
    pdf.text(subjLabelText, xStart + 4, y + 6.2);

    // Subject value — bold underlined
    const subjLabelW = pdf.getTextWidth(subjLabelText);
    pdf.text(subjectText, xStart + 4 + subjLabelW, y + 6.2);
    const subjTextW = pdf.getTextWidth(subjectText);
    pdf.setLineWidth(0.3);
    pdf.line(xStart + 4 + subjLabelW, y + 7.3, xStart + 4 + subjLabelW + subjTextW, y + 7.3);

    // ── Salutation ── (preview: font 14px bold #0d0d0d, marginBottom 6mm)
    y += subjH + 10; // 10mm gap = preview marginBottom of letter-subject
    pdf.setFont('times', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(13, 13, 13);
    pdf.text(`Dear ${empName || ''},`, xStart, y);

    // Return y after salutation (paragraphs start 6mm below)
    return y + 6;
  };

  // ── Shared signoff block ──────────────────────────────────────────────────
  // Renders signoff starting at yStart, returns final y position.
  const drawSignoff = (pdf, sigData, fSigDate, yStart) => {
    const xStart = 25;
    let y = yStart + 10; // preview: marginTop 10mm on letter-signoff

    // "Yours sincerely," — normal 10.5pt #1a1a1a
    pdf.setFont('times', 'normal');
    pdf.setFontSize(10.5);
    pdf.setTextColor(26, 26, 26);
    pdf.text('Yours sincerely,', xStart, y);

    // "For Echo HMS..." — bold 11pt #0f1e35, marginTop 1.5mm, marginBottom 6mm
    y += 5.5; // 1.5mm marginTop + ~4mm line-height gap
    pdf.setFont('times', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(15, 30, 53);
    pdf.text('For Echo HMS by Grelin Health India LLP', xStart, y);

    // "Authorised Signatory:" — bold 10.5pt #0f1e35, marginBottom 3mm
    y += 7; // 6mm marginBottom preview → 7mm in PDF to account for baseline
    pdf.setFont('times', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(15, 30, 53);
    pdf.text('Authorised Signatory:', xStart, y);

    // Signature image — 38mm × 13.3mm, marginBottom 5mm (3mm gap below label)
    y += 3;
    pdf.addImage(sigData, 'PNG', xStart, y, 38, 13.3);

    // "Sofia Balan" — bold 11pt, marginBottom 4mm
    y += 13.3 + 5; // image height + 5mm marginBottom
    pdf.setFont('times', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(17, 17, 17);
    pdf.text('Sofia Balan', xStart, y);

    // "Date:" label + value + underline — bold label, normal value, 35mm underline
    y += 5.5; // 4mm marginBottom + baseline offset
    pdf.setFont('times', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(15, 30, 53);
    pdf.text('Date:', xStart, y);

    // Value immediately after label with a small gap (preview: paddingLeft 8px ≈ 3mm)
    const dateLabelW = pdf.getTextWidth('Date:');
    const dateGap = 3; // 3mm ≈ 8px paddingLeft
    pdf.setFont('times', 'normal');
    pdf.setFontSize(10.5);
    pdf.setTextColor(26, 26, 26);
    pdf.text(fSigDate || '', xStart + dateLabelW + dateGap, y);

    // Underline starting at value position, 35mm wide (preview: minWidth 35mm)
    const underlineX = xStart + dateLabelW + dateGap;
    pdf.setDrawColor(15, 30, 53);
    pdf.setLineWidth(0.35);
    pdf.line(underlineX, y + 1, underlineX + 35, y + 1);

    return y;
  };

  // ── Relieving Letter PDF ─────────────────────────────────────────────────
  const generateRelievingPDF = (jsPDF, logoData, sigData) => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

    pdf.setProperties({
      title: `Relieving Letter - ${form.empName}`,
      subject: `Official Relieving Letter for ${form.empName} (ID: ${form.empId})`,
      author: 'Echo HMS by Grelin Health India LLP',
      keywords: 'Relieving Letter, Echo HMS, Employment, Grelin Health',
      creator: 'Echo HMS Enterprise Portal'
    });

    const { empName, empId, designation, letterDate, dateOfJoining, lastWorkingDate, sigDate } = form;
    const fLetterDate = formatDate(letterDate);
    const fDOJ        = formatDate(dateOfJoining);
    const fLWD        = formatDate(lastWorkingDate);
    const fSigDate    = formatDate(sigDate);

    drawPageChrome(pdf, logoData);

    const xStart = 25;
    const maxW   = 160;
    const drawParagraph = makeDrawParagraph(pdf, xStart, maxW);

    let y = drawLetterHeader(pdf, 'Relieving Letter', fLetterDate, empName, empId);

    // ── Body paragraphs ── (preview: font 13.5px, line-height 1.65, marginBottom 12px ≈ 4.5mm)
    const p1 = [
      { text: 'This is to formally acknowledge that you have been relieved from your duties at ' },
      { text: 'Echo HMS by Grelin Health India LLP', bold: true },
      { text: ' with effect from ' },
      { text: fLWD || '', bold: true },
      { text: '.' }
    ];
    y = drawParagraph(p1, y);

    y += 4.5;
    const p2 = [
      { text: 'You were employed with us as ' },
      { text: designation || '', bold: true },
      { text: ' from ' },
      { text: fDOJ || '', bold: true },
      { text: ' to ' },
      { text: fLWD || '', bold: true },
      { text: '. During your tenure, you fulfilled your assigned responsibilities diligently and have completed the required handover of your duties, documents, and company assets in accordance with the organization\u2019s policies and procedures.' }
    ];
    y = drawParagraph(p2, y);

    y += 4.5;
    const p3 = [
      { text: 'We hereby confirm that there are no outstanding dues, liabilities, or obligations pending from your end as of your relieving date.' }
    ];
    y = drawParagraph(p3, y);

    y += 4.5;
    const p4 = [
      { text: 'We sincerely appreciate your contributions to the organization and thank you for your services. We wish you continued success and all the very best in your future endeavors.' }
    ];
    y = drawParagraph(p4, y);

    drawSignoff(pdf, sigData, fSigDate, y);

    return pdf;
  };

  // ── Experience Certificate PDF ───────────────────────────────────────────
  const generateExperiencePDF = (jsPDF, logoData, sigData) => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

    pdf.setProperties({
      title: `Experience Certificate - ${form.empName}`,
      subject: `Official Experience Certificate for ${form.empName} (ID: ${form.empId})`,
      author: 'Echo HMS by Grelin Health India LLP',
      keywords: 'Experience Certificate, Echo HMS, Employment, Grelin Health',
      creator: 'Echo HMS Enterprise Portal'
    });

    const { empName, empId, designation, letterDate, dateOfJoining, lastWorkingDate, sigDate } = form;
    const fLetterDate = formatDate(letterDate);
    const fDOJ        = formatDate(dateOfJoining);
    const fLWD        = formatDate(lastWorkingDate);
    const fSigDate    = formatDate(sigDate);

    drawPageChrome(pdf, logoData);

    const xStart = 25;
    const maxW   = 160;
    const drawParagraph = makeDrawParagraph(pdf, xStart, maxW);

    let y = drawLetterHeader(pdf, 'Experience Certificate', fLetterDate, empName, empId);

    // ── Body paragraphs ──
    const p1 = [
      { text: 'This is to certify that you were employed with ' },
      { text: 'Echo HMS by Grelin Health India LLP', bold: true },
      { text: ' as ' },
      { text: designation || '', bold: true },
      { text: ' from ' },
      { text: fDOJ || '', bold: true },
      { text: ' to ' },
      { text: fLWD || '', bold: true },
      { text: '.' }
    ];
    y = drawParagraph(p1, y);

    y += 4.5;
    const p2 = [
      { text: 'During your tenure with the organization, you were entrusted with responsibilities relevant to your role and demonstrated dedication, professionalism, and commitment in carrying out your duties. You consistently contributed to the organization\u2019s objectives and maintained a professional approach towards colleagues, clients, and assigned tasks.' }
    ];
    y = drawParagraph(p2, y);

    y += 4.5;
    const p3 = [
      { text: 'We appreciate your contributions during your association with us and thank you for your services. We wish you every success and prosperity in your future professional endeavors.' }
    ];
    y = drawParagraph(p3, y);

    drawSignoff(pdf, sigData, fSigDate, y);

    return pdf;
  };

  const downloadBothPDFs = async () => {
    if (!validate()) return;
    setGenerating(true);
    showToast('Generating Documents...', 'info');

    try {
      const { jsPDF } = await import('jspdf');

      const logoData = await loadImageAsBase64('/logo.png', 'relieving-letter:logo');
      const sigData  = await loadImageAsBase64('/signature.png', 'relieving-letter:signature');

      // Generate Relieving Letter
      const relievingPdf = generateRelievingPDF(jsPDF, logoData, sigData);
      const name = sanitizeFilenamePart(form.empName, 'Employee');
      const relievingFilename = `${name}_Relieving_Letter.pdf`;
      const relievingBlob = relievingPdf.output('blob');
      const relievingUrl = URL.createObjectURL(new Blob([relievingBlob], { type: 'application/pdf' }));

      // Generate Experience Certificate
      const experiencePdf = generateExperiencePDF(jsPDF, logoData, sigData);
      const experienceFilename = `${name}_Experience_Certificate.pdf`;
      const experienceBlob = experiencePdf.output('blob');
      const experienceUrl = URL.createObjectURL(new Blob([experienceBlob], { type: 'application/pdf' }));

      // Trigger download 1: Relieving Letter
      const dlLink1 = document.createElement('a');
      dlLink1.href = relievingUrl;
      dlLink1.download = relievingFilename;
      dlLink1.style.display = 'none';
      document.body.appendChild(dlLink1);
      dlLink1.click();

      // Trigger download 2: Experience Certificate
      setTimeout(() => {
        const dlLink2 = document.createElement('a');
        dlLink2.href = experienceUrl;
        dlLink2.download = experienceFilename;
        dlLink2.style.display = 'none';
        document.body.appendChild(dlLink2);
        dlLink2.click();

        setTimeout(() => {
          document.body.removeChild(dlLink1);
          document.body.removeChild(dlLink2);
          URL.revokeObjectURL(relievingUrl);
          URL.revokeObjectURL(experienceUrl);
        }, 1000);
      }, 300);

      showToast('Documents downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error generating documents. Please try again.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setForm({
      letterDate: '', empName: '', empId: '', designation: '',
      dateOfJoining: '', lastWorkingDate: '', sigDate: ''
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

      {/* ── Center Layout ── */}
      <div className="app-layout">
        {/* ══ Form Card ══ */}
        <main className="form-panel">
          <div className="form-panel-header">
            <h2>Generate Document</h2>
            <p>Fill in the details below to generate the official letter/certificate</p>
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
          </div>

          {/* Actions */}
          <div className="btn-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className="btn btn-primary"
              onClick={downloadBothPDFs}
              disabled={generating}
              style={{ width: '100%', padding: '14px 20px', fontSize: '15px' }}
            >
              {generating ? <LoaderIcon /> : <DownloadIcon />}
              Download Documents (PDF)
            </button>
            
            <button 
              className="btn btn-secondary" 
              onClick={resetForm} 
              style={{ width: '100%', padding: '10px 20px' }}
            >
              <RefreshIcon />
              Clear Form
            </button>
          </div>
        </main>

        {/* ══ Preview Card ══ */}
        <section className="preview-panel">
          <div className="preview-toolbar">
            <div className="preview-toolbar-left">
              <span className="preview-title">Live Document Preview</span>
              <div className="live-badge">
                <div className="live-dot" />
                Live
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className={`btn ${activePreviewTab === 'relieving' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: 'auto', padding: '6px 12px', height: '32px', fontSize: '11.5px', fontWeight: 600 }}
                onClick={() => setActivePreviewTab('relieving')}
              >
                Relieving Letter
              </button>
              <button 
                className={`btn ${activePreviewTab === 'experience' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: 'auto', padding: '6px 12px', height: '32px', fontSize: '11.5px', fontWeight: 600 }}
                onClick={() => setActivePreviewTab('experience')}
              >
                Experience Certificate
              </button>
            </div>
          </div>

          <div className="preview-scroll-container">
            <div className="letter-shadow-wrap">
              <div id="letter-preview">
                <div className="letter-header">
                  <img src="/logo.png" alt="Echo HMS Logo" className="letter-logo" />
                </div>
                <div className="letter-header-accent" style={{ background: '#c8a951', height: '0.4mm', margin: '0 25mm' }} />
                
                <div className="letter-body" style={{ padding: '20mm 25mm 10mm' }}>
                  <div className="letter-date" style={{ marginBottom: '8mm' }}>
                    <strong>Date: </strong>{formatDate(form.letterDate) || '[Date of Letter]'}
                  </div>

                  <div className="letter-to-block" style={{ marginBottom: '8mm' }}>
                    <p>To,</p>
                    <p className="to-name">{form.empName || '[Employee Name]'}</p>
                    <p>Employee ID: {form.empId || '[Employee ID]'}</p>
                  </div>

                  <div className="letter-subject" style={{ 
                    background: '#f4f6f9', 
                    borderLeft: '4px solid #0f1e35', 
                    padding: '3mm 4mm',
                    marginBottom: '10mm',
                    display: 'flex',
                    gap: '4px'
                  }}>
                    <span className="subj-label" style={{ fontWeight: 'bold', color: '#0f1e35' }}>Subject: </span>
                    <span className="subj-text" style={{ fontWeight: 'bold', textDecoration: 'underline', color: '#0f1e35' }}>
                      {activePreviewTab === 'relieving' ? 'Relieving Letter' : 'Experience Certificate'}
                    </span>
                  </div>

                  <div className="letter-salutation" style={{ fontWeight: 'bold', marginBottom: '6mm' }}>
                    Dear {form.empName || '[Employee Name]'},
                  </div>

                  {activePreviewTab === 'relieving' ? (
                    <>
                      <p className="letter-para">
                        This is to formally acknowledge that you have been relieved from your duties at <strong className="bold-value">Echo HMS by Grelin Health India LLP</strong> with effect from <strong className="bold-value">{formatDate(form.lastWorkingDate) || '[Last Working Date]'}</strong>.
                      </p>
                      <p className="letter-para">
                        You were employed with us as <strong className="bold-value">{form.designation || '[Designation]'}</strong> from <strong className="bold-value">{formatDate(form.dateOfJoining) || '[Date of Joining]'}</strong> to <strong className="bold-value">{formatDate(form.lastWorkingDate) || '[Last Working Date]'}</strong>. During your tenure, you fulfilled your assigned responsibilities diligently and have completed the required handover of your duties, documents, and company assets in accordance with the organization's policies and procedures.
                      </p>
                      <p className="letter-para">
                        We hereby confirm that there are no outstanding dues, liabilities, or obligations pending from your end as of your relieving date.
                      </p>
                      <p className="letter-para">
                        We sincerely appreciate your contributions to the organization and thank you for your services. We wish you continued success and all the very best in your future endeavors.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="letter-para">
                        This is to certify that you were employed with <strong className="bold-value">Echo HMS by Grelin Health India LLP</strong> as <strong className="bold-value">{form.designation || '[Designation]'}</strong> from <strong className="bold-value">{formatDate(form.dateOfJoining) || '[Date of Joining]'}</strong> to <strong className="bold-value">{formatDate(form.lastWorkingDate) || '[Last Working Date]'}</strong>.
                      </p>
                      <p className="letter-para">
                        During your tenure with the organization, you were entrusted with responsibilities relevant to your role and demonstrated dedication, professionalism, and commitment in carrying out your duties. You consistently contributed to the organization's objectives and maintained a professional approach towards colleagues, clients, and assigned tasks.
                      </p>
                      <p className="letter-para">
                        We appreciate your contributions during your association with us and thank you for your services. We wish you every success and prosperity in your future professional endeavors.
                      </p>
                    </>
                  )}

                  <div className="letter-signoff" style={{ marginTop: '10mm', padding: 0 }}>
                    <p className="letter-yours" style={{ fontSize: '10.5pt', margin: 0, color: '#1a1a1a' }}>Yours sincerely,</p>
                    <p className="letter-for-company" style={{ fontSize: '11pt', fontWeight: 'bold', color: '#0f1e35', marginTop: '1.5mm', marginBottom: '6mm' }}>
                      For Echo HMS by Grelin Health India LLP
                    </p>
                    
                    <p style={{ fontSize: '10.5pt', fontWeight: 'bold', color: '#0f1e35', marginBottom: '3mm' }}>Authorised Signatory:</p>
                    
                    <div className="sig-row-img" style={{ marginBottom: '5mm', display: 'flex', alignItems: 'center' }}>
                      <img src="/signature.png" alt="Signature" style={{ height: '13.3mm', width: '38mm', objectFit: 'contain' }} />
                    </div>

                    <p style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '4mm' }}>Sofia Balan</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '10.5pt', fontWeight: 'bold', color: '#0f1e35' }}>Date:</span>
                      <span style={{ borderBottom: '1px solid #0f1e35', minWidth: '35mm', paddingLeft: '8px', fontSize: '10.5pt' }}>
                        {formatDate(form.sigDate) || '[Signature Date]'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="letter-footer" style={{ marginTop: 'auto', padding: '10mm 25mm 8mm', textAlign: 'center' }}>
                  <div style={{ borderTop: '0.5mm solid #c8a951', margin: '0 auto 3mm' }} />
                  <p style={{ fontWeight: 'bold', color: '#0f1e35', fontSize: '11px', margin: 0 }}>
                    Echo HMS by Grelin Health India LLP
                  </p>
                  <p style={{ color: '#64646e', fontSize: '9px', margin: '2px 0 0' }}>
                    No. 44/80, Thanthai Periyar Nagar, Kundrathur Main Road, Kummananchavadi, Ponammalle, Chennai - 600 056
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
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
