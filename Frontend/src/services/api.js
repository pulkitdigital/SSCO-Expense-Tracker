import { saveExcelFile, savePDFFile } from '../utils/fileDownload';

const API_BASE =
  process.env.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:5000';

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data;
}

export async function getExpenses() {
  try {
    const response = await fetch(`${API_BASE}/api/expenses`);
    return await parseJsonResponse(response);
  } catch (error) {
    console.error('getExpenses failed:', error);
    throw error;
  }
}

export async function addExpense(data) {
  try {
    const response = await fetch(`${API_BASE}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await parseJsonResponse(response);
  } catch (error) {
    console.error('addExpense failed:', error);
    throw error;
  }
}

export async function getExpenseByDate(date) {
  try {
    const response = await fetch(`${API_BASE}/api/expenses/${encodeURIComponent(date)}`);
    return await parseJsonResponse(response);
  } catch (error) {
    console.error('getExpenseByDate failed:', error);
    throw error;
  }
}

export async function getProfile() {
  try {
    const response = await fetch(`${API_BASE}/api/profile`);
    return await parseJsonResponse(response);
  } catch (error) {
    console.error('getProfile failed:', error);
    throw error;
  }
}

export async function saveProfile(data) {
  try {
    const response = await fetch(`${API_BASE}/api/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: data.companyName,
        address: data.address,
        gstin: data.gstin,
        phone: data.phone,
        email: data.email,
      }),
    });
    return await parseJsonResponse(response);
  } catch (error) {
    console.error('saveProfile failed:', error);
    throw error;
  }
}

export async function triggerSync() {
  try {
    const response = await fetch(`${API_BASE}/api/sync`);
    return await parseJsonResponse(response);
  } catch (error) {
    console.error('triggerSync failed:', error);
    throw error;
  }
}

export async function downloadExcel() {
  try {
    const response = await fetch(`${API_BASE}/api/export/excel`);
    if (!response.ok) {
      throw new Error(`Excel download failed with status ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    const result = await saveExcelFile(buffer);
    return result;
  } catch (error) {
    console.error('downloadExcel failed:', error);
    throw error;
  }
}

export async function updateExpense(id, data) {
  console.log('[api] updateExpense', id, data);
  try {
    const response = await fetch(`${API_BASE}/api/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || `Update failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('updateExpense failed:', error);
    throw error;
  }
}

export async function deleteExpense(id) {
  console.log('[api] deleteExpense', id);
  try {
    const response = await fetch(`${API_BASE}/api/expenses/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || `Delete failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('deleteExpense failed:', error);
    throw error;
  }
}

export function getPDFPreviewUrl(dateFrom, dateTo) {
  const params = new URLSearchParams();
  if (dateFrom) params.set('from', dateFrom);
  if (dateTo) params.set('to', dateTo);
  const query = params.toString();
  return query
    ? `${API_BASE}/api/export/pdf-preview?${query}`
    : `${API_BASE}/api/export/pdf-preview`;
}

export function getSinglePDFPreviewUrl(id) {
  return `${API_BASE}/api/export/pdf-preview/${id}`;
}

export async function fetchPDFPreviewHtml(previewUrl) {
  try {
    const response = await fetch(previewUrl);
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || `Preview failed with status ${response.status}`);
    }
    return response.text();
  } catch (error) {
    console.error('fetchPDFPreviewHtml failed:', error);
    throw error;
  }
}

export async function downloadPDFFile(dateFrom, dateTo) {
  try {
    const params = new URLSearchParams();
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    const query = params.toString();
    const url = query
      ? `${API_BASE}/api/export/pdf?${query}`
      : `${API_BASE}/api/export/pdf`;

    const response = await fetch(url);
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || `PDF download failed with status ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    return savePDFFile(buffer);
  } catch (error) {
    console.error('downloadPDFFile failed:', error);
    throw error;
  }
}

export async function downloadSinglePDFFile(id) {
  try {
    const response = await fetch(`${API_BASE}/api/export/pdf/${id}`);
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || `PDF download failed with status ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    return savePDFFile(buffer, `SSCO_Expense_${id}.pdf`);
  } catch (error) {
    console.error('downloadSinglePDFFile failed:', error);
    throw error;
  }
}

/** @deprecated Use downloadPDFFile */
export async function downloadPDF(dateFrom, dateTo) {
  return downloadPDFFile(dateFrom, dateTo);
}

/** @deprecated Use downloadSinglePDFFile */
export async function downloadRowPDF(id) {
  return downloadSinglePDFFile(id);
}

// NEW — Fill actuals for a receipt-only entry (PATCH /api/expenses/:id/entry)
export async function fillExpenseEntry(id, data) {
  try {
    const response = await fetch(`${API_BASE}/api/expenses/${id}/entry`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || `Fill entry failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('fillExpenseEntry failed:', error);
    throw error;
  }
}