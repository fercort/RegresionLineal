import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ColumnProfile, ColumnType, ImputationConfig, DummyEncodingConfig } from '../types/econometrics';

/**
 * Parses CSV or TXT text with PapaParse
 */
export function parseCSV(fileContent: string): { headers: string[]; data: Record<string, any>[] } {
  const parsed = Papa.parse(fileContent, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    comments: '#',
  });

  const headers = (parsed.meta.fields || []).map(h => h.trim()).filter(h => h.length > 0);
  const data = (parsed.data as Record<string, any>[]).filter(row => {
    return headers.some(h => row[h] !== null && row[h] !== undefined && row[h] !== '');
  });

  return { headers, data };
}

/**
 * Parses XLSX / XLS binary buffer with SheetJS
 */
export function parseExcel(buffer: ArrayBuffer): { headers: string[]; data: Record<string, any>[] } {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

  if (rawJson.length === 0) {
    return { headers: [], data: [] };
  }

  const rawHeaders = (rawJson[0] as any[]).map(h => String(h || '').trim());
  const headers = rawHeaders.filter(h => h.length > 0);

  const data: Record<string, any>[] = [];
  for (let r = 1; r < rawJson.length; r++) {
    const rowObj: Record<string, any> = {};
    const rowArr = rawJson[r] as any[];
    let hasValue = false;
    headers.forEach((h, idx) => {
      let val = rowArr ? rowArr[idx] : null;
      if (val !== null && val !== undefined && val !== '') {
        hasValue = true;
        // Try parsing number if string looks like numeric
        if (typeof val === 'string') {
          const num = Number(val.replace(',', '.'));
          if (!isNaN(num) && val.trim() !== '') {
            val = num;
          }
        }
      }
      rowObj[h] = val;
    });
    if (hasValue) {
      data.push(rowObj);
    }
  }

  return { headers, data };
}

/**
 * Profiles all columns to detect types, nulls, and distributions
 */
export function profileColumns(data: Record<string, any>[], headers: string[]): ColumnProfile[] {
  const rowCount = data.length;

  return headers.map(colName => {
    let nullCount = 0;
    const values: any[] = [];
    let numericCount = 0;
    const valueFreq: Record<string, number> = {};

    data.forEach(row => {
      const val = row[colName];
      if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) {
        nullCount++;
      } else {
        values.push(val);
        const strVal = String(val);
        valueFreq[strVal] = (valueFreq[strVal] || 0) + 1;
        if (typeof val === 'number' || (!isNaN(Number(val)) && typeof val !== 'boolean')) {
          numericCount++;
        }
      }
    });

    const validCount = values.length;
    const isNumeric = validCount > 0 && numericCount / validCount >= 0.85;

    // Detect if column is an ID or constant
    const uniqueCount = Object.keys(valueFreq).length;
    let type: ColumnType = isNumeric ? 'numeric' : 'categorical';
    if (uniqueCount === 1 && validCount > 1) {
      type = 'id_or_constant';
    } else if (!isNumeric && uniqueCount === rowCount && rowCount > 10) {
      type = 'id_or_constant';
    }

    // Compute mode
    let modeVal: string | number | undefined;
    let maxFreq = -1;
    for (const [v, freq] of Object.entries(valueFreq)) {
      if (freq > maxFreq) {
        maxFreq = freq;
        modeVal = v;
      }
    }

    const profile: ColumnProfile = {
      name: colName,
      type,
      totalCount: rowCount,
      nullCount,
      nullPercentage: rowCount > 0 ? Math.round((nullCount / rowCount) * 1000) / 10 : 0,
      uniqueCount,
      sampleValues: values.slice(0, 5),
      mode: modeVal,
    };

    if (isNumeric && validCount > 0) {
      const numVals = values.map(v => Number(v)).filter(v => Number.isFinite(v));
      if (numVals.length > 0) {
        numVals.sort((a, b) => a - b);
        const sum = numVals.reduce((acc, v) => acc + v, 0);
        const mean = sum / numVals.length;
        const min = numVals[0];
        const max = numVals[numVals.length - 1];
        const median = numVals.length % 2 === 0
          ? (numVals[numVals.length / 2 - 1] + numVals[numVals.length / 2]) / 2
          : numVals[Math.floor(numVals.length / 2)];
        const variance = numVals.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (numVals.length > 1 ? numVals.length - 1 : 1);
        const stdDev = Math.sqrt(variance);

        profile.mean = Math.round(mean * 100) / 100;
        profile.median = Math.round(median * 100) / 100;
        profile.min = Math.round(min * 100) / 100;
        profile.max = Math.round(max * 100) / 100;
        profile.stdDev = Math.round(stdDev * 100) / 100;
      }
    }

    return profile;
  });
}

/**
 * Applies missing value imputation according to configuration
 */
export function imputeDataset(
  data: Record<string, any>[],
  profiles: ColumnProfile[],
  config: ImputationConfig
): Record<string, any>[] {
  const profileMap = new Map(profiles.map(p => [p.name, p]));
  let result = data.map(r => ({ ...r }));

  // First handle 'drop' strategy
  const columnsToDropNulls = Object.entries(config)
    .filter(([_, strat]) => strat === 'drop')
    .map(([col]) => col);

  if (columnsToDropNulls.length > 0) {
    result = result.filter(row => {
      return columnsToDropNulls.every(col => {
        const val = row[col];
        return val !== null && val !== undefined && val !== '' && !Number.isNaN(val);
      });
    });
  }

  // Handle value imputations (mean, median, mode)
  for (const [col, strat] of Object.entries(config)) {
    if (strat === 'drop') continue;
    const prof = profileMap.get(col);
    if (!prof) continue;

    let fillVal: any = null;
    if (strat === 'mean' && prof.mean !== undefined) fillVal = prof.mean;
    else if (strat === 'median' && prof.median !== undefined) fillVal = prof.median;
    else if (strat === 'mode' && prof.mode !== undefined) {
      fillVal = prof.type === 'numeric' ? Number(prof.mode) : prof.mode;
    }

    if (fillVal !== null) {
      result.forEach(row => {
        const val = row[col];
        if (val === null || val === undefined || val === '' || Number.isNaN(val)) {
          row[col] = fillVal;
        }
      });
    }
  }

  return result;
}

/**
 * Applies One-Hot / Dummy Encoding with drop-first rule to prevent multicollinearity
 */
export function applyDummyEncoding(
  data: Record<string, any>[],
  encodingConfig: DummyEncodingConfig
): {
  encodedData: Record<string, any>[];
  allColumns: string[];
  dummyColumnNames: string[];
  mappings: DummyEncodingConfig['mappings'];
} {
  const { columnsToEncode, dropFirst } = encodingConfig;
  const mappings: DummyEncodingConfig['mappings'] = {};
  const dummyColumnNames: string[] = [];

  // Determine categories and reference category (the one dropped)
  columnsToEncode.forEach(col => {
    const rawCategories = Array.from(new Set(data.map(r => String(r[col] ?? 'Desconocido')))).sort();
    const referenceCategory = rawCategories[0]; // first category dropped by default
    const activeCategories = dropFirst ? rawCategories.slice(1) : rawCategories;

    const createdDummies = activeCategories.map(cat => {
      // Clean name: replace spaces and special chars
      const cleanCat = cat.replace(/[^\w]/g, '_');
      return `${col}_${cleanCat}`;
    });

    mappings[col] = {
      categories: rawCategories,
      referenceCategory,
      dummyColumns: createdDummies,
    };

    dummyColumnNames.push(...createdDummies);
  });

  // Transform data
  const encodedData = data.map(row => {
    const newRow = { ...row };

    columnsToEncode.forEach(col => {
      const mapping = mappings[col];
      const currentVal = String(row[col] ?? 'Desconocido');

      mapping.dummyColumns.forEach(dummyCol => {
        // Find corresponding category
        const suffix = dummyCol.slice(col.length + 1);
        const matchCat = mapping.categories.find(c => c.replace(/[^\w]/g, '_') === suffix);
        newRow[dummyCol] = currentVal === matchCat ? 1 : 0;
      });

      // Keep original or remove? For regression matrices, the user will select the dummies
    });

    return newRow;
  });

  const allColumns = Object.keys(encodedData[0] || {});
  return { encodedData, allColumns, dummyColumnNames, mappings };
}
