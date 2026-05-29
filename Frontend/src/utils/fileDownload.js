function getDateStamp() {
  return new Date().toISOString().split('T')[0];
}

function isElectron() {
  return Boolean(window.electron?.ipcRenderer?.invoke);
}

async function toUint8Array(data) {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (data instanceof Blob) return new Uint8Array(await data.arrayBuffer());
  return new Uint8Array(data);
}

function downloadWithBlobUrl(buffer, filename, mimeType) {
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { success: true, path: filename };
}

export async function saveExcelFile(buffer) {
  const fileData = await toUint8Array(buffer);
  const filename = `SSCO_Expenses_${getDateStamp()}.xlsx`;

  if (isElectron()) {
    return window.electron.ipcRenderer.invoke('save-excel', fileData);
  }

  return downloadWithBlobUrl(
    fileData,
    filename,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}

export async function savePDFFile(buffer, filename) {
  const fileData = await toUint8Array(buffer);
  const name = filename || `SSCO_Report_${getDateStamp()}.pdf`;

  if (isElectron()) {
    return window.electron.ipcRenderer.invoke('save-pdf', fileData);
  }

  return downloadWithBlobUrl(fileData, name, 'application/pdf');
}
