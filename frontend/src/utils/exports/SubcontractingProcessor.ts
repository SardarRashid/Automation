import ExcelJS from 'exceljs';
import { safeDateStr } from './ExportGenerators';

export const processSubcontracting = async (file: File): Promise<Blob> => {
    // 1. Read the input file
    const arrayBuffer = await file.arrayBuffer();
    const inputWorkbook = new ExcelJS.Workbook();
    await inputWorkbook.xlsx.load(arrayBuffer);
    const inputWorksheet = inputWorkbook.worksheets[0];

    if (!inputWorksheet) {
        throw new Error("The uploaded Excel file does not contain any worksheets.");
    }

    // Extract headers and data
    const rawData: any[] = [];
    let headers: string[] = [];
    
    inputWorksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
            row.eachCell((cell, colNumber) => {
                headers[colNumber - 1] = cell.text || `Column ${colNumber}`;
            });
        } else {
            const rowData: any = {};
            row.eachCell((cell, colNumber) => {
                rowData[headers[colNumber - 1]] = cell.value;
            });
            rawData.push(rowData);
        }
    });

    // 2. Generate Professional Excel Document Output
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Subcontracting Details', {
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
    });

    // Branding & Title
    ws.mergeCells('A1:E1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'SUBCONTRACTING REPORT';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F4E78' }, // Professional dark blue
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    // Date
    ws.mergeCells('A2:E2');
    const dateCell = ws.getCell('A2');
    dateCell.value = `Generated Date: ${safeDateStr()}`;
    dateCell.font = { name: 'Arial', size: 10, italic: true };
    dateCell.alignment = { horizontal: 'right' };

    // Space
    ws.addRow([]);

    // Extract Columns dynamically based on uploaded data (since schema is flexible)
    ws.columns = headers.map((h, i) => ({
        header: h,
        key: h,
        width: Math.max(15, h.length + 5)
    }));

    // Start headers at Row 4
    ws.getRow(4).values = headers;
    ws.getRow(4).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(4).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2F75B5' }, // Lighter professional blue for headers
    };
    ws.getRow(4).alignment = { horizontal: 'center', vertical: 'middle' };

    // Add Data Rows
    rawData.forEach(dataRow => {
        const rowValues = headers.map(h => dataRow[h] ?? '');
        const newRow = ws.addRow(rowValues);
        newRow.alignment = { vertical: 'middle', wrapText: true };
        
        // Add borders
        newRow.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });

    // Adjust row heights based on data
    ws.eachRow((row, rowNumber) => {
        if (rowNumber > 4) {
            row.height = 20;
        }
    });

    // Export as Blob
    const buffer = await wb.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};
