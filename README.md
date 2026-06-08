# Relieving Letter & Experience Certificate Generator

A professional React-based application for generating and downloading **Relieving Letters** and **Experience Certificates** as PDF documents. Built for Echo HMS by Grelin Health India LLP.

---

## 📋 Overview

This application provides an intuitive form interface to collect employee information and generate beautifully formatted, official PDF documents. It includes:

- **Relieving Letter** - Formal confirmation of employee separation with final clearance
- **Experience Certificate** - Professional record of employment tenure and contributions

Both documents are professionally formatted with company branding, borders, signature blocks, and proper legal structure.

---

## ✨ Features

### Core Functionality
- ✅ **Tab-based Interface** - Switch between Relieving Letter and Experience Certificate templates
- ✅ **Form Validation** - Ensures all required fields are filled with correct formats
- ✅ **Real-time Preview** - See live updates as you fill the form (in preview panel)
- ✅ **PDF Generation** - High-quality PDF downloads with professional formatting
- ✅ **Date Auto-formatting** - Automatic DD/MM/YYYY masking with calendar picker
- ✅ **Progress Tracking** - Visual completion bar showing form fill percentage
- ✅ **Image Optimization** - Efficient logo and signature image loading with caching
- ✅ **Error Handling** - Toast notifications for validation errors and success messages

### PDF Features
- 📄 Professional double-border design with company branding
- 🎨 Branded header with company logo and accent line
- 📍 Company address footer
- 🖋️ Signature block with authorized signatory details
- ⚖️ Justified text paragraphs for professional appearance
- 🔒 Filename sanitization for safe downloads

### Form Fields
1. **Letter Date** - Date of document issuance
2. **Employee Name** - Full name of employee
3. **Employee ID** - Unique employee identifier
4. **Designation** - Job position/role
5. **Date of Joining** - Employment start date
6. **Last Working Date** - Final day of employment
7. **Signature Date** - Date of signatory approval
8. **Place** - Location of signatory

---

## 🛠️ Technology Stack

### Frontend
- **React 19.2.6** - UI framework for interactive components
- **Vite 8.0.12** - Lightning-fast build tool and dev server
- **jsPDF 4.2.1** - PDF generation library

### Development Tools
- **ESLint 10.3.0** - Code quality and consistency
- **Vite React Plugin 6.0.1** - React integration for Vite
- **React DOM 19.2.6** - React rendering engine

---

## 📦 Project Structure

```
relieving-app/
├── src/
│   ├── App.jsx              # Main application component with form & PDF logic
│   ├── App.css              # Application styling
│   ├── components.jsx       # Reusable UI components (icons, inputs, etc.)
│   ├── index.css            # Global styling
│   └── main.jsx             # React entry point
├── public/
│   ├── logo.png             # Company logo (Echo HMS)
│   ├── signature.png        # Authorized signatory signature
│   ├── favicon.svg          # Browser tab icon
│   └── icons.svg            # Additional SVG icons
├── package.json             # Dependencies & scripts
├── vite.config.js           # Vite configuration
├── eslint.config.js         # ESLint configuration
├── index.html               # HTML template
└── README.md                # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm (or yarn)

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd relieving-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

---

## 📖 Usage

1. **Fill the Form**
   - Enter all required employee and document information
   - Use the calendar picker or type dates manually in DD/MM/YYYY format
   - Watch the completion progress bar

2. **Review Content**
   - Preview panel shows real-time updates
   - Validate that all information is correct

3. **Select Document Type**
   - **Relieving Letter Tab** - For employee separation documentation
   - **Experience Certificate Tab** - For employment history documentation

4. **Generate PDF**
   - Click "Download Relieving Letter" or "Download Experience Certificate"
   - PDF will download with filename format: `[EmployeeName]_Relieving_Letter.pdf`

5. **Reset Form**
   - Click "Reset Form" to clear all fields and start over

---

## 🔧 Key Components

### App.jsx

**Helper Functions:**
- `formatDate(dateStr)` - Converts between YYYY-MM-DD and DD/MM/YYYY formats
- `sanitizeFilenamePart(value, fallback)` - Sanitizes filenames for safe downloads
- `dataUrlFromBlob(blob)` - Converts image blobs to base64 data URLs
- `loadImageAsBase64(url, cacheKey)` - Loads and caches images in localStorage

**Main Components:**
- `LetterPreview` - Renders relieving letter template
- `ExperiencePreview` - Renders experience certificate template
- `CompletionBar` - Shows form fill progress
- `App` - Main component with form state management and PDF generation

### components.jsx

**Icons:** CalendarIcon, UserIcon, IdIcon, BriefcaseIcon, MapPinIcon, etc.

**UI Components:**
- `FormGroup` - Wrapper for form fields with labels and hints
- `TextInput` - Standard text input with optional icon
- `DateInput` - Smart date input with calendar picker and auto-formatting
- `SectionHeading` - Styled section headers
- `Toast` - Notification system for messages

---

## 📋 Form Validation

The app validates:
- ✅ All fields are required and non-empty
- ✅ Dates are in DD/MM/YYYY format
- ✅ Date values are valid (1-12 months, 1-31 days, 1900-2100 years)
- ✅ Error messages are displayed with field focus on validation failure

---

## 🎨 Styling

### CSS Structure
- `App.css` - Application-specific styles
- `index.css` - Global styles and CSS variables

### Key Styles
- Color scheme: Navy (#0f1e35), Gold (#c8a951), Light gray backgrounds
- Typography: Times New Roman for professional documents
- Responsive layout for different screen sizes
- Print-optimized PDF output

---

## 🔐 Security & Performance

- **Image Caching** - Images cached in localStorage to reduce load times
- **Filename Sanitization** - Special characters removed from download filenames
- **Input Validation** - Client-side validation prevents invalid data submission
- **Blob to Base64** - Images embedded in PDF for offline reliability

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| PDF downloads with wrong name | Check employee name field, remove special characters |
| Images not showing in PDF | Clear browser cache/localStorage, refresh the page |
| Date formatting issues | Ensure format is DD/MM/YYYY, use calendar picker |
| Form validation fails | Fill all required fields, check date format |
| PDF file too large | Images are optimized; compression is enabled |

---

## 📝 Sample Data

For testing, use:
- **Employee Name:** John Doe
- **Employee ID:** EMP001
- **Designation:** Senior Software Engineer
- **Date of Joining:** 15/01/2020
- **Last Working Date:** 30/06/2024
- **Letter Date:** 01/07/2024
- **Signature Date:** 01/07/2024
- **Place:** Chennai

---

## 🔄 Development Workflow

### Available Scripts

```bash
npm run dev      # Start Vite dev server with hot reload
npm run build    # Create production-ready build
npm run lint     # Run ESLint on all files
npm run preview  # Preview production build locally
```

### Code Quality

ESLint configuration ensures:
- React best practices
- React Hooks rules compliance
- Clean, consistent code style

---

## 📄 Document Specifications

### PDF Format
- **Orientation:** Portrait
- **Size:** A4 (210mm × 277mm)
- **Compression:** Enabled
- **Borders:** Double navy borders with gold accent line
- **Fonts:** Times New Roman (scalable)

### Layout Elements
- Header with company logo (75mm × 11.94mm)
- Recipient block (To, Name, Employee ID)
- Subject block with highlighted color
- Justified body paragraphs
- Signature block with authorized signatory
- Footer with company address

---

## 🌐 Browser Compatibility

- ✅ Chrome/Chromium (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)
- ✅ Edge (Latest)

---

## 📞 Organization Info

**Company:** Echo HMS by Grelin Health India LLP

**Address:** 
No. 44/80, Thanthai Periyar Nagar, Kundrathur Main Road,
Kummananchavadi, Ponammalle, Chennai - 600 056

**Authorized Signatory:** Sofia Balan

---

## 📄 License

This application is proprietary software for Echo HMS by Grelin Health India LLP.

---

## 🤝 Support

For issues, feature requests, or improvements:
1. Check the troubleshooting section above
2. Review form validation messages
3. Ensure all inputs follow the specified format

---

**Last Updated:** June 2026  
**Version:** 1.0.0
