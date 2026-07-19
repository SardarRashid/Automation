import os

req_path = 'frontend/src/pages/RequestForms.tsx'
with open(req_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add xlsx import
if "import * as XLSX" not in content:
    content = content.replace(
        "import { collection, addDoc, getDocs, query, where, deleteDoc, doc, orderBy } from 'firebase/firestore';",
        "import { collection, addDoc, getDocs, query, where, deleteDoc, doc, orderBy } from 'firebase/firestore';\nimport * as XLSX from 'xlsx';"
    )

old_func = """  const handleGenerate = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const payload: any = {
        header: headerData,
        rows: rows
      };

      if (isCustom) {
        payload.columns = customColumns;
      }
      payload.intro_text = description || `Please allow the amounts below for ${isCustom ? (customSubject || 'Custom') : formType} request.`;

      const formData = new FormData();
      formData.append('form_type', isCustom ? (customSubject || 'Custom') : formType);
      formData.append('data_json', JSON.stringify(payload));
      formData.append('profile_settings', JSON.stringify(profile));

      const baseUrl = await getBackendUrl();
      const response = await fetch(`${baseUrl}/api/process-request-form`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errStr = 'Failed to generate form';
        try {
          const errData = await response.json();
          errStr = errData.detail || errStr;
        } catch(e) {}
        throw new Error(errStr);
      }

      const contentDisposition = response.headers.get('content-disposition');
      let filename = `Request_${(isCustom ? customSubject : formType).replace(/\s+/g, '_')}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating the form.');
    } finally {
      setIsProcessing(false);
    }
  };"""

new_func = """  const handleGenerate = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const wb = XLSX.utils.book_new();
      const wsData: any[][] = [];
      
      const formTypeTitle = isCustom ? (customSubject || 'Custom') : formType;
      
      wsData.push([`Request Form - ${formTypeTitle}`]);
      wsData.push([]);
      
      // Intro Text
      const introText = description || `Please allow the amounts below for ${formTypeTitle} request.`;
      wsData.push([introText]);
      wsData.push([]);
      
      // Header Data
      Object.entries(headerData).forEach(([k, v]) => {
        wsData.push([k, v]);
      });
      wsData.push([]);
      
      // Columns
      const cols = isCustom ? customColumns : formConfigs[formType]?.headers || [];
      wsData.push(cols);
      
      // Rows
      rows.forEach(r => {
        wsData.push(cols.map(c => r[c] || ''));
      });
      
      // Summary / Signature lines
      wsData.push([]);
      wsData.push(['Prepared By:', '', 'Approved By:']);
      wsData.push([profile?.name || '', '', profile?.manager_name || '']);
      wsData.push([profile?.title || '', '', profile?.manager_title || '']);
      
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Adjust column widths
      ws['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 20 }];
      
      XLSX.utils.book_append_sheet(wb, ws, "Request Form");
      
      const filename = `Request_${formTypeTitle.replace(/\\s+/g, '_')}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating the form.');
    } finally {
      setIsProcessing(false);
    }
  };"""

if old_func in content:
    content = content.replace(old_func, new_func)
    with open(req_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced handleGenerate successfully.")
else:
    print("Could not find old handleGenerate")

