const fs = require('fs');
const PDFDocument = require('pdfkit');

function generateProjectSpec() {
  const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
  const stream = fs.createWriteStream('Skyline-Tower-Project-Spec.pdf');
  doc.pipe(stream);

  doc.fontSize(18).font('Helvetica-Bold').text('SKYLINE TOWER - PROJECT SPECIFICATION', { align: 'center' });
  doc.fontSize(11).font('Helvetica').text('Document No: ST-SPEC-001 | Rev A | January 2026', { align: 'center' });
  doc.moveDown(1.5);

  doc.fontSize(13).font('Helvetica-Bold').text('1. Project Overview');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('Project Name: Skyline Tower Construction');
  doc.text('Project Address: 456 Market Street, San Francisco, CA 94102');
  doc.text('Owner: SF Development Partners LLC');
  doc.text('Architect of Record: Design Studio International');
  doc.text('General Contractor: Golden Gate Construction Inc. (License #B-456789)');
  doc.text('Structural Engineer: Robert Chen, PE (License #C-57892), Bay Area Inspection Services, Inc.');
  doc.text('Contract Value: $48,500,000');
  doc.text('Scheduled Completion: December 2027');
  doc.moveDown(1);

  doc.fontSize(13).font('Helvetica-Bold').text('2. Structural Steel Requirements');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('All structural steel work shall conform to AISC 360 and AWS D1.1-2020.');
  doc.text('Beam-to-column connections: Complete Joint Penetration (CJP) welds required on all moment frames.');
  doc.text('Special inspections are mandatory for all welded connections per 2022 CBC Section 1705.2.');
  doc.text('Inspector of Record: Robert Chen, PE — Bay Area Inspection Services, Inc.');
  doc.text('All inspections must be documented on DSA Form TR-1 and submitted within 48 hours of inspection.');
  doc.moveDown(1);

  doc.fontSize(13).font('Helvetica-Bold').text('3. Inspection Schedule');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('Phase 1 — Foundation: November 2025 – January 2026');
  doc.text('Phase 2 — Steel Frame (Levels 1–12): January 2026 – April 2026');
  doc.text('  ↳ TR-1 Special Inspection required at each level milestone');
  doc.text('  ↳ First milestone: Level 12 connections — Target date: January 15, 2026');
  doc.text('Phase 3 — MEP & Envelope: May 2026 – October 2026');
  doc.text('Phase 4 — Fitout & Commissioning: November 2026 – December 2027');
  doc.moveDown(1);

  doc.fontSize(13).font('Helvetica-Bold').text('4. Quality Control Requirements');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('- All welds to be visually inspected 100%.');
  doc.text('- Ultrasonic Testing (UT) required for all CJP welds on moment frames.');
  doc.text('- Non-conforming work must be documented and corrective action taken within 5 business days.');
  doc.text('- Contractor Golden Gate Construction Inc. is responsible for notifying the inspector 24 hours before any work subject to special inspection.');
  doc.text('- Inspection records to be maintained on-site and submitted to DSA within 30 days of project completion.');
  doc.moveDown(1);

  doc.fontSize(13).font('Helvetica-Bold').text('5. Key Contacts');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  doc.text('Project Manager (Owner): James Wong, jwong@sfdevpartners.com, (415) 555-0101');
  doc.text('Site Superintendent (Contractor): Luis Morales, (415) 555-0202');
  doc.text('Inspector of Record: Robert Chen PE, rchen@baiservices.com, (415) 555-0303');

  doc.end();
  console.log('✓ Generated Skyline-Tower-Project-Spec.pdf');
}

function generateInspectionReport() {
  const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
  const stream = fs.createWriteStream('TR1-Skyline-Tower-Level12-Inspection.pdf');
  doc.pipe(stream);

  doc.fontSize(8).font('Helvetica').text('DSA Form TR-1 (Rev. 03/2024)', 40, 40);
  doc.fontSize(16).font('Helvetica-Bold').text('TR-1 SPECIAL INSPECTION REPORT', { align: 'center' });
  doc.fontSize(10).font('Helvetica').text('Division of the State Architect', { align: 'center' });
  doc.moveDown(1);

  doc.fontSize(9).font('Helvetica');
  doc.text('Application No: 04-123456', 40, doc.y);
  doc.text('Report No: ST-INS-012', 300, doc.y - 10);
  doc.text('Date: January 15, 2026', 430, doc.y - 10);
  doc.moveDown(0.8);

  // Section 1
  doc.fontSize(10).font('Helvetica-Bold').text('SECTION 1 - PROJECT INFORMATION');
  doc.fontSize(9).font('Helvetica').moveDown(0.3);
  doc.text('Project Name:        Skyline Tower Construction');
  doc.text('Project Address:     456 Market Street, San Francisco, CA 94102');
  doc.text('Owner:               SF Development Partners LLC');
  doc.text('General Contractor:  Golden Gate Construction Inc. (License #B-456789)');
  doc.text('Contract No:         ST-SPEC-001');
  doc.moveDown(0.8);

  // Section 2
  doc.fontSize(10).font('Helvetica-Bold').text('SECTION 2 - INSPECTION INFORMATION');
  doc.fontSize(9).font('Helvetica').moveDown(0.3);
  doc.text('Inspection Date:     January 15, 2026, 10:30 AM');
  doc.text('Special Inspector:   Robert Chen, PE (License #C-57892)');
  doc.text('Inspection Agency:   Bay Area Inspection Services, Inc.');
  doc.text('Inspection Type:     ☑ Structural Steel Welding  ☐ Concrete  ☐ Masonry  ☐ Soils');
  doc.moveDown(0.8);

  // Section 3
  doc.fontSize(10).font('Helvetica-Bold').text('SECTION 3 - WORK INSPECTED');
  doc.fontSize(9).font('Helvetica').moveDown(0.3);
  doc.text('Location:            Level 12, Grid Lines D–G');
  doc.text('Work Description:    CJP beam-to-column connections, moment frame Lines D and G');
  doc.text('Applicable Codes:    2022 CBC, AWS D1.1-2020, AISC 360');
  doc.text('Drawings Ref:        ST-S-112, ST-S-113 Rev A');
  doc.moveDown(0.8);

  // Section 4
  doc.fontSize(10).font('Helvetica-Bold').text('SECTION 4 - INSPECTION FINDINGS');
  doc.fontSize(9).font('Helvetica').moveDown(0.3);
  doc.text('Visual inspection of 24 CJP welds completed. 100% pass rate on visual.');
  doc.text('UT performed on 12 moment frame welds (50% sample per spec ST-SPEC-001 Section 4).');
  doc.text('UT Results: All 12 welds — NO DEFECTS DETECTED.');
  doc.text('Contractor notified inspector 26 hours in advance per project specification requirement.');
  doc.moveDown(0.8);

  // Section 5
  doc.fontSize(10).font('Helvetica-Bold').text('SECTION 5 - RESULT');
  doc.fontSize(9).font('Helvetica').moveDown(0.3);
  doc.text('☑  APPROVED — Work conforms to approved plans, specifications, and applicable codes.');
  doc.text('☐  CORRECTION REQUIRED');
  doc.text('☐  STOP WORK');
  doc.moveDown(0.8);

  doc.text('Next Inspection Milestone: Level 15 connections — estimated February 10, 2026');
  doc.moveDown(1);

  doc.text('Inspector Signature: _______________________________   Date: 01/15/2026');
  doc.moveDown(0.5);
  doc.fontSize(7).text('I certify under penalty of perjury that the above is true and correct to the best of my knowledge and belief.');
  doc.moveDown(0.5);
  doc.fontSize(7).text('DSA Form TR-1 (Rev. 03/2024) — Page 1 of 1', { align: 'center' });

  doc.end();
  console.log('✓ Generated TR1-Skyline-Tower-Level12-Inspection.pdf');
}

generateProjectSpec();
generateInspectionReport();
