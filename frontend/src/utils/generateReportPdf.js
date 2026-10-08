import { jsPDF } from "jspdf";

const COLORS = {
  forest: [31, 77, 51],
  forestDeep: [23, 61, 43],
  green: [63, 118, 80],
  pale: [239, 246, 238],
  line: [213, 226, 213],
  ink: [39, 58, 45],
  muted: [102, 119, 106],
  white: [255, 255, 255],
};

const displayValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
};

export const generateReportPdf = ({
  title,
  subtitle,
  reportType,
  generatedAt,
  dateRange,
  metrics = [],
  sections = [],
  filename,
}) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  const addFooter = () => {
    const totalPages = doc.internal.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page);
      doc.setDrawColor(...COLORS.line);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.muted);
      doc.text("ProManage  |  Project workspace report", margin, pageHeight - 8);
      doc.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
    }
  };

  const newPageIfNeeded = (heightNeeded) => {
    if (y + heightNeeded > pageHeight - 19) {
      doc.addPage();
      y = 17;
    }
  };

  const drawSectionHeading = (heading) => {
    newPageIfNeeded(15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.forestDeep);
    doc.text(heading, margin, y + 4);
    doc.setDrawColor(...COLORS.line);
    doc.setLineWidth(0.35);
    doc.line(margin, y + 7, pageWidth - margin, y + 7);
    y += 12;
  };

  const drawTable = ({ headers, rows, widths }) => {
    const columnWidths = widths || headers.map(() => contentWidth / headers.length);
    const headerHeight = 9;
    newPageIfNeeded(headerHeight + 8);
    doc.setFillColor(...COLORS.forest);
    doc.roundedRect(margin, y, contentWidth, headerHeight, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.white);
    let x = margin + 3;
    headers.forEach((header, index) => {
      const wrapped = doc.splitTextToSize(displayValue(header), columnWidths[index] - 6);
      doc.text(wrapped[0] || "", x, y + 5.8);
      x += columnWidths[index];
    });
    y += headerHeight;

    if (!rows.length) {
      doc.setFillColor(...COLORS.pale);
      doc.rect(margin, y, contentWidth, 11, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.muted);
      doc.text("No records for this report period.", margin + 3, y + 7);
      y += 15;
      return;
    }

    rows.forEach((row, rowIndex) => {
      const cells = row.map((cell, index) => doc.splitTextToSize(displayValue(cell), columnWidths[index] - 6));
      const lineCount = Math.max(1, ...cells.map((cell) => cell.length));
      const rowHeight = Math.max(9, lineCount * 4.2 + 4);
      newPageIfNeeded(rowHeight + 2);
      if (rowIndex % 2 === 0) {
        doc.setFillColor(...COLORS.pale);
        doc.rect(margin, y, contentWidth, rowHeight, "F");
      }
      doc.setDrawColor(...COLORS.line);
      doc.setLineWidth(0.2);
      doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.ink);
      let cellX = margin + 3;
      cells.forEach((cell, index) => {
        doc.text(cell, cellX, y + 5.5, { lineHeightFactor: 1.15 });
        cellX += columnWidths[index];
      });
      y += rowHeight;
    });
    y += 5;
  };

  // Branded title block.
  doc.setFillColor(...COLORS.forestDeep);
  doc.roundedRect(margin, y, contentWidth, 40, 4, 4, "F");
  doc.setFillColor(83, 145, 96);
  doc.roundedRect(margin, y, 3, 40, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(190, 220, 194);
  doc.text("PROMANAGE  /  REPORT", margin + 9, y + 9);
  doc.setFontSize(19);
  doc.setTextColor(...COLORS.white);
  doc.text(doc.splitTextToSize(title, contentWidth - 18), margin + 9, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(226, 239, 227);
  doc.text(doc.splitTextToSize(subtitle, contentWidth - 18), margin + 9, y + 29);
  y += 46;

  const period = dateRange?.start || dateRange?.end
    ? `${dateRange.start || "Start"}  —  ${dateRange.end || "Present"}`
    : `${reportType || "Custom"} reporting period`;
  const generatedDate = generatedAt ? new Date(generatedAt) : new Date();
  const generatedLabel = Number.isNaN(generatedDate.getTime()) ? "" : generatedDate.toLocaleString();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.muted);
  doc.text(`PERIOD  ${period}`, margin, y);
  if (generatedLabel) doc.text(`GENERATED  ${generatedLabel}`, pageWidth - margin, y, { align: "right" });
  y += 8;

  drawSectionHeading("At a glance");
  const columns = 3;
  const gap = 4;
  const cardWidth = (contentWidth - gap * (columns - 1)) / columns;
  const cardHeight = 20;
  metrics.forEach((metric, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    if (col === 0) newPageIfNeeded(cardHeight + 4);
    const x = margin + col * (cardWidth + gap);
    const cardY = y + row * (cardHeight + gap);
    doc.setFillColor(...COLORS.pale);
    doc.setDrawColor(...COLORS.line);
    doc.setLineWidth(0.35);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.muted);
    doc.text(doc.splitTextToSize(metric.label, cardWidth - 6), x + 3, cardY + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.forest);
    doc.text(doc.splitTextToSize(displayValue(metric.value), cardWidth - 6)[0], x + 3, cardY + 15);
  });
  y += Math.ceil(metrics.length / columns) * (cardHeight + gap) + 3;

  sections.forEach((section) => {
    drawSectionHeading(section.title);
    drawTable(section);
  });

  addFooter();
  doc.save(filename);
};
