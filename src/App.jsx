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

function getImageContainDims(base64Data, maxW, maxH) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const containerRatio = maxW / maxH;
      let w, h;
      if (imgRatio > containerRatio) {
        w = maxW;
        h = maxW / imgRatio;
      } else {
        h = maxH;
        w = maxH * imgRatio;
      }
      resolve({ w, h });
    };
    img.onerror = () => {
      resolve({ w: maxW, h: maxH });
    };
    img.src = base64Data;
  });
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
  const makeDrawParagraph = (pdf, xStart, maxW) => (segments, yStart) => {
    const LINE_H = 6.54; // 15px * 1.65 line-height = 6.54mm
    pdf.setFontSize(11.25); // 15px = 11.25pt
    pdf.setFont('times', 'normal');
    const spaceW = pdf.getTextWidth(' ');

    // 1. Tokenise into word and space tokens
    const tokens = [];
    segments.forEach(seg => {
      const text = seg.text;
      let i = 0;
      while (i < text.length) {
        if (text[i] === ' ') {
          tokens.push({ type: 'space' });
          i++;
          while (i < text.length && text[i] === ' ') {
            i++;
          }
        } else {
          let start = i;
          while (i < text.length && text[i] !== ' ') {
            i++;
          }
          tokens.push({
            type: 'word',
            text: text.slice(start, i),
            bold: !!seg.bold
          });
        }
      }
    });

    // 2. Word-wrap using maxW
    const lines = [];
    let curLine = [];
    let curW = 0;

    tokens.forEach(tok => {
      if (tok.type === 'space') {
        if (curLine.length > 0) {
          curLine.push(tok);
          curW += spaceW;
        }
      } else {
        pdf.setFont('times', tok.bold ? 'bold' : 'normal');
        const tw = pdf.getTextWidth(tok.text);
        if (curW + tw > maxW) {
          // Remove trailing space token if any
          if (curLine.length > 0 && curLine[curLine.length - 1].type === 'space') {
            curLine.pop();
          }
          lines.push(curLine);
          curLine = [tok];
          curW = tw;
        } else {
          curLine.push(tok);
          curW += tw;
        }
      }
    });
    if (curLine.length > 0) {
      if (curLine[curLine.length - 1].type === 'space') {
        curLine.pop();
      }
      lines.push(curLine);
    }

    // 3. Render each line
    let cy = yStart + 4.9;
    lines.forEach((line, li) => {
      const isLast = li === lines.length - 1;
      
      let totalWordsW = 0;
      let numSpaces = 0;
      line.forEach(t => {
        if (t.type === 'word') {
          pdf.setFont('times', t.bold ? 'bold' : 'normal');
          totalWordsW += pdf.getTextWidth(t.text);
        } else if (t.type === 'space') {
          numSpaces++;
        }
      });

      let sw = spaceW;
      if (!isLast && numSpaces > 0) {
        const justifiedSw = (maxW - totalWordsW) / numSpaces;
        if (justifiedSw <= spaceW * 3 && justifiedSw >= spaceW * 0.2) {
          sw = justifiedSw;
        }
      }

      let cx = xStart;
      line.forEach(tok => {
        if (tok.type === 'space') {
          cx += sw;
        } else {
          pdf.setFont('times', tok.bold ? 'bold' : 'normal');
          pdf.setTextColor(26, 26, 26);
          pdf.text(tok.text, cx, cy);
          cx += pdf.getTextWidth(tok.text);
        }
      });
      cy += LINE_H;
    });

    return cy - LINE_H + 1.6;
  };

  // ── Shared page chrome (border, logo, gold line, footer) ────────────────
  const drawPageChrome = (pdf, logoData, logoDims) => {
    // Outer thick border — #0f1e35 (inset 10px = 2.65mm)
    pdf.setDrawColor(15, 30, 53);
    pdf.setLineWidth(0.53); // 2px
    pdf.rect(2.65, 2.65, 204.7, 291.7);
    
    // Inner thin border (inset 15px = 3.97mm, color blended #d4d7db, opacity 0.18 equivalent)
    pdf.setDrawColor(212, 215, 219);
    pdf.setLineWidth(0.20); // 0.75px
    pdf.rect(3.97, 3.97, 202.06, 289.06);

    // Logo — centered using contain-scaled dimensions
    const logoW = logoDims.w;
    const logoH = logoDims.h;
    const logoX = (210 - logoW) / 2;
    const logoY = 6.35; // 24px top padding
    pdf.addImage(logoData, 'PNG', logoX, logoY, logoW, logoH);

    // Gold accent line below header (margin: 0 25mm -> starts at 25mm, ends at 185mm)
    pdf.setDrawColor(200, 169, 81);
    pdf.setLineWidth(0.4);
    const goldLineY = 6.35 + logoH + 5.29; // top padding + logo height + 20px (5.29mm) bottom padding = 25.39mm
    pdf.line(25, goldLineY, 185, goldLineY);

    // Footer gold line (borderTop: 0.5mm solid #c8a951)
    const footerLineY = 275.5;
    pdf.setDrawColor(200, 169, 81);
    pdf.setLineWidth(0.5);
    pdf.line(25, footerLineY, 185, footerLineY);

    // Footer company name — bold, #0f1e35, 11px = 8.25 pt
    const footerTextY = 281.0;
    pdf.setFont('times', 'bold');
    pdf.setFontSize(8.25);
    pdf.setTextColor(15, 30, 53);
    const footerCompany = 'Echo HMS by Grelin Health India LLP';
    pdf.text(footerCompany, (210 - pdf.getTextWidth(footerCompany)) / 2, footerTextY);

    // Footer address — bold, #44444f, 10.5px = 7.875 pt
    pdf.setFont('times', 'bold');
    pdf.setFontSize(7.875);
    pdf.setTextColor(68, 68, 79);
    const footerAddr = 'No. 44/80, Thanthai Periyar Nagar, Kundrathur Main Road, Kummananchavadi, Ponammalle, Chennai - 600 056';
    pdf.text(footerAddr, (210 - pdf.getTextWidth(footerAddr)) / 2, footerTextY + 4.5);
  };

  // ── Shared header block (Date / To / Subject / Salutation) ──────────────
  const drawLetterHeader = (pdf, subjectText, fLetterDate, empName, empId, bodyTop) => {
    const xStart = 25;
    
    // ── Date of Letter ──
    const dateY = bodyTop + 3.6; // Baseline
    pdf.setFont('times', 'bold');
    pdf.setFontSize(11.25); // 15px = 11.25pt
    pdf.setTextColor(26, 26, 26);
    pdf.text('Date: ', xStart, dateY);

    pdf.setFont('times', 'normal');
    pdf.text(fLetterDate || '', xStart + pdf.getTextWidth('Date: '), dateY);

    // ── To block ──
    const toTop = bodyTop + 12.76;
    
    // Line 1: "To,"
    pdf.setFont('times', 'normal');
    pdf.setFontSize(11.25);
    pdf.setTextColor(26, 26, 26);
    pdf.text('To,', xStart, toTop + 3.6);

    // Line 2: Employee Name
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12.0); // 16px = 12.0 pt
    pdf.setTextColor(15, 30, 53);
    pdf.text(empName || '', xStart, toTop + 3.6 + 6.35); // 6.35mm is line 1 box height (15px * 1.6)

    // Line 3: Employee ID
    pdf.setFont('times', 'normal');
    pdf.setFontSize(11.25);
    pdf.setTextColor(26, 26, 26);
    pdf.text(`Employee ID: ${empId || ''}`, xStart, toTop + 3.6 + 6.35 + 6.77); // 6.77mm is line 2 box height (16px * 1.6)

    // ── Subject block ──
    const subjTop = toTop + 27.47; // 19.47mm elements + 8mm margin-bottom
    const subjH = 10.76; // 3mm padding + 4.76mm text + 3mm padding

    // Background rect
    pdf.setFillColor(244, 246, 249);
    pdf.rect(xStart, subjTop, 160, subjH, 'F');

    // Left accent bar (4px = 1.06mm thickness)
    pdf.setDrawColor(15, 30, 53);
    pdf.setLineWidth(1.06);
    pdf.line(xStart, subjTop, xStart, subjTop + subjH);
    pdf.setLineWidth(0.4); // Reset

    // "Subject: " label
    pdf.setFont('times', 'bold');
    pdf.setFontSize(11.25);
    pdf.setTextColor(15, 30, 53);
    const subjLabelText = 'Subject: ';
    pdf.text(subjLabelText, xStart + 4, subjTop + 3 + 3.0); // 3mm padding-top + approx 3.0mm font ascent

    // Subject value
    const subjLabelW = pdf.getTextWidth(subjLabelText);
    pdf.text(subjectText, xStart + 4 + subjLabelW, subjTop + 3 + 3.0);
    
    // Underline
    const subjTextW = pdf.getTextWidth(subjectText);
    pdf.setLineWidth(0.3);
    pdf.line(xStart + 4 + subjLabelW, subjTop + 3 + 3.0 + 1, xStart + 4 + subjLabelW + subjTextW, subjTop + 3 + 3.0 + 1);

    // ── Salutation ──
    const salutationTop = subjTop + 20.76; // subjH 10.76 + 10mm margin-bottom
    pdf.setFont('times', 'bold');
    pdf.setFontSize(11.625); // 15.5px = 11.625 pt
    pdf.setTextColor(13, 13, 13);
    pdf.text(`Dear ${empName || ''},`, xStart, salutationTop + 3.7);

    return salutationTop + 10.92;
  };

  // ── Shared signoff block ──────────────────────────────────────────────────
  const drawSignoff = (pdf, sigData, sigDims, fSigDate, yStart) => {
    const xStart = 25;
    
    // Starts at yStart + 10 mm
    const signoffTop = yStart + 10;

    // Line 1: "Yours sincerely," (12 pt, normal weight, height 5.08mm)
    pdf.setFont('times', 'normal');
    pdf.setFontSize(12); // 12pt
    pdf.setTextColor(26, 26, 26);
    pdf.text('Yours sincerely,', xStart, signoffTop + 3.8);

    // Line 2: "For Echo HMS by Grelin Health India LLP"
    const line2Top = signoffTop + 6.58; // 5.08mm + 1.5mm marginTop
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12.5); // 12.5 pt
    pdf.setTextColor(15, 30, 53);
    pdf.text('For Echo HMS by Grelin Health India LLP', xStart, line2Top + 4.0);

    // Line 3: "Authorised Signatory:"
    const line3Top = line2Top + 11.29; // 5.29mm + 6mm marginBottom
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12); // 12 pt
    pdf.setTextColor(15, 30, 53);
    pdf.text('Authorised Signatory:', xStart, line3Top + 3.8);

    // Signature image:
    const sigTop = line3Top + 8.08; // 5.08mm + 3mm marginBottom
    const sigW = sigDims.w;
    const sigH = sigDims.h;
    pdf.addImage(sigData, 'PNG', xStart, sigTop, sigW, sigH);

    // Line 4: "Sofia Balan"
    const line4Top = sigTop + sigH + 5;
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12.5); // 12.5 pt
    pdf.setTextColor(17, 17, 17);
    pdf.text('Sofia Balan', xStart, line4Top + 4.0);

    // Line 5: "Date:" line
    const line5Top = line4Top + 9.29; // 5.29mm + 4mm marginBottom
    pdf.setFont('times', 'bold');
    pdf.setFontSize(12); // 12 pt
    pdf.setTextColor(15, 30, 53);
    pdf.text('Date:', xStart, line5Top + 3.8);

    const dateLabelW = pdf.getTextWidth('Date:');
    const dateGap = 3; // 3mm gap = 8px padding-left in preview
    const dateX = xStart + dateLabelW + dateGap;
    
    pdf.setFont('times', 'normal');
    pdf.text(fSigDate || '', dateX, line5Top + 3.8);

    // Underline
    pdf.setDrawColor(15, 30, 53);
    pdf.setLineWidth(0.35);
    pdf.line(dateX, line5Top + 3.8 + 1, dateX + 35, line5Top + 3.8 + 1);

    return line5Top + 5.08;
  };

  // ── Relieving Letter PDF ─────────────────────────────────────────────────
  const generateRelievingPDF = (jsPDF, logoData, sigData, logoDims, sigDims) => {
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

    drawPageChrome(pdf, logoData, logoDims);

    const xStart = 25;
    const maxW   = 160;
    const drawParagraph = makeDrawParagraph(pdf, xStart, maxW);

    const goldLineY = 6.35 + logoDims.h + 5.29;
    const bodyTop = goldLineY + 20;

    let y = drawLetterHeader(pdf, 'Relieving Letter', fLetterDate, empName, empId, bodyTop);

    // ── Body paragraphs ──
    const p1 = [
      { text: 'This is to formally acknowledge that you have been relieved from your duties at ' },
      { text: 'Echo HMS by Grelin Health India LLP', bold: true },
      { text: ' with effect from ' },
      { text: fLWD || '', bold: true },
      { text: '.' }
    ];
    y = drawParagraph(p1, y);

    y += 3.17;
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

    y += 3.17;
    const p3 = [
      { text: 'We hereby confirm that there are no outstanding dues, liabilities, or obligations pending from your end as of your relieving date.' }
    ];
    y = drawParagraph(p3, y);

    y += 3.17;
    const p4 = [
      { text: 'We sincerely appreciate your contributions to the organization and thank you for your services. We wish you continued success and all the very best in your future endeavors.' }
    ];
    y = drawParagraph(p4, y);

    drawSignoff(pdf, sigData, sigDims, fSigDate, y);

    return pdf;
  };

  // ── Experience Certificate PDF ───────────────────────────────────────────
  const generateExperiencePDF = (jsPDF, logoData, sigData, logoDims, sigDims) => {
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

    drawPageChrome(pdf, logoData, logoDims);

    const xStart = 25;
    const maxW   = 160;
    const drawParagraph = makeDrawParagraph(pdf, xStart, maxW);

    const goldLineY = 6.35 + logoDims.h + 5.29;
    const bodyTop = goldLineY + 20;

    let y = drawLetterHeader(pdf, 'Experience Certificate', fLetterDate, empName, empId, bodyTop);

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

    y += 3.17;
    const p2 = [
      { text: 'During your tenure with the organization, you were entrusted with responsibilities relevant to your role and demonstrated dedication, professionalism, and commitment in carrying out your duties. You consistently contributed to the organization\u2019s objectives and maintained a professional approach towards colleagues, clients, and assigned tasks.' }
    ];
    y = drawParagraph(p2, y);

    y += 3.17;
    const p3 = [
      { text: 'We appreciate your contributions during your association with us and thank you for your services. We wish you every success and prosperity in your future professional endeavors.' }
    ];
    y = drawParagraph(p3, y);

    drawSignoff(pdf, sigData, sigDims, fSigDate, y);

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

      const logoDims = await getImageContainDims(logoData, 86.38, 13.75);
      const sigDims  = await getImageContainDims(sigData, 38, 13.3);

      // Generate Relieving Letter
      const relievingPdf = generateRelievingPDF(jsPDF, logoData, sigData, logoDims, sigDims);
      const name = sanitizeFilenamePart(form.empName, 'Employee');
      const relievingFilename = `${name}_Relieving_Letter.pdf`;
      const relievingBlob = relievingPdf.output('blob');
      const relievingUrl = URL.createObjectURL(new Blob([relievingBlob], { type: 'application/pdf' }));

      // Generate Experience Certificate
      const experiencePdf = generateExperiencePDF(jsPDF, logoData, sigData, logoDims, sigDims);
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
                    <p className="letter-yours" style={{ fontSize: '12pt', margin: 0, color: '#1a1a1a' }}>Yours sincerely,</p>
                    <p className="letter-for-company" style={{ fontSize: '12.5pt', fontWeight: 'bold', color: '#0f1e35', marginTop: '1.5mm', marginBottom: '6mm' }}>
                      For Echo HMS by Grelin Health India LLP
                    </p>
                    
                    <p style={{ fontSize: '12pt', fontWeight: 'bold', color: '#0f1e35', marginBottom: '3mm' }}>Authorised Signatory:</p>
                    
                    <div className="sig-row-img" style={{ marginBottom: '5mm', display: 'flex', alignItems: 'center' }}>
                      <img src="/signature.png" alt="Signature" style={{ height: '13.3mm', width: '38mm', objectFit: 'contain' }} />
                    </div>

                    <p style={{ fontSize: '12.5pt', fontWeight: 'bold', marginBottom: '4mm' }}>Sofia Balan</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '12pt', fontWeight: 'bold', color: '#0f1e35' }}>Date:</span>
                      <span style={{ borderBottom: '1px solid #0f1e35', minWidth: '35mm', paddingLeft: '8px', fontSize: '12pt' }}>
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
                  <p style={{ color: '#44444f', fontSize: '10.5px', fontWeight: '600', margin: '2px 0 0' }}>
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
