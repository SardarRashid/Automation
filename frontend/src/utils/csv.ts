export function exportToCSV(filename: string, rows: any[], headers: string[]) {
  if (!rows || !rows.length) {
    console.warn("No data to export");
    return;
  }

  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => {
        let cell = row[header] === null || row[header] === undefined ? '' : row[header];
        // Ensure string and escape quotes
        cell = String(cell).replace(/"/g, '""');
        // If it contains comma, newline, or double quote, wrap in quotes
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return resolve([]);

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length < 2) return resolve([]); // Header only or empty

      // Basic naive CSV parser that doesn't handle commas inside quotes very well,
      // but should be fine for simple data like we have.
      const headers = lines[0].split(',').map(h => h.trim());
      
      const result = [];
      for (let i = 1; i < lines.length; i++) {
        // A simple split by comma. For robust CSV we'd use a regex or library, 
        // but this works for basic IDs and names.
        // Let's use a slightly better regex that handles commas inside quotes
        const currentline = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
        const obj: any = {};
        for (let j = 0; j < headers.length; j++) {
          let val = currentline[j] ? currentline[j].trim() : "";
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1).replace(/""/g, '"');
          }
          obj[headers[j]] = val;
        }
        result.push(obj);
      }
      resolve(result);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}
