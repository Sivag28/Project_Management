const escapeCsvCell = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

export const downloadReportCsv = ({ title, metadata = [], sections = [], filename }) => {
  const rows = [
    [title],
    ...metadata.map(([label, value]) => [label, value]),
    [],
    ...sections.flatMap((section) => [
      [section.title],
      section.headers,
      ...(section.rows.length ? section.rows : [["No records for this report."]]),
      [],
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
