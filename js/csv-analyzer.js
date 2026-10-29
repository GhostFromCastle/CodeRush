const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const demoBtn = document.getElementById('demoBtn');
const resultsGrid = document.getElementById('resultsGrid');
const resultsActions = document.getElementById('resultsActions');
const pythonCodeBlock = document.getElementById('pythonCodeBlock');
const mappingCard = document.getElementById('mappingCard');
const globalError = document.getElementById('globalError');

const selectAmount = document.getElementById('selectAmount');
const selectCategory = document.getElementById('selectCategory');
const applyMappingBtn = document.getElementById('applyMappingBtn');
const mappingCancelBtn = document.getElementById('mappingCancelBtn');
const changeMappingBtn = document.getElementById('changeMappingBtn');
const loadAnotherBtn = document.getElementById('loadAnotherBtn');

const statCount = document.getElementById('statCount');
const statSum = document.getElementById('statSum');
const statMax = document.getElementById('statMax');
const statAvg = document.getElementById('statAvg');

const lblSum = document.getElementById('lblSum');
const lblMax = document.getElementById('lblMax');
const lblAvg = document.getElementById('lblAvg');

const pyColVal = document.getElementById('pyColVal');
const pyColVal2 = document.getElementById('pyColVal2');
const pyColCat = document.getElementById('pyColCat');

const chartCanvas = document.getElementById('expensesChart');
const chartFallback = document.getElementById('chartFallback');

let chartInstance = null;
let parsedData = { headers: [], rows: [], delimiter: ',' };

const DEMO_DATA = `id,name,age,city,score
1,Alice,24,Stockholm,87.5
2,Markus,31,Gothenburg,92.0
3,Sofia,19,Malmö,76.25
4,Daniel,42,Uppsala,68.0
5,Emma,27,Örebro,95.75
6,Noah,35,Västerås,81.0
7,Olivia,22,Linköping,88.25
8,Liam,29,Helsingborg,73.5
9,Freja,38,Jönköping,90.0
10,Oscar,26,Lund,84.75`;

function showError(message) {
    if (!globalError) return;
    globalError.innerHTML = `<i class="ph ph-warning-circle"></i> ${message}`;
    globalError.hidden = false;
}

function clearError() {
    if (!globalError) return;
    globalError.hidden = true;
    globalError.innerHTML = '';
}

function normalizeNumber(str) {
    if (str === null || str === undefined) return NaN;
    let s = String(str).trim();
    if (!s) return NaN;
    s = s.replace(/[^\d.,\-+]/g, '');
    if (!s || s === '-' || s === '+' || s === '.' || s === ',') return NaN;

    const hasComma = s.includes(',');
    const hasDot = s.includes('.');

    if (hasComma && hasDot) {
        if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
            s = s.replace(/\./g, '').replace(/,/g, '.');
        } else {
            s = s.replace(/,/g, '');
        }
    } else if (hasComma) {
        const parts = s.split(',');
        if (parts.length === 2) {
            s = s.replace(',', '.');
        } else {
            s = s.replace(/,/g, '');
        }
    }

    const n = parseFloat(s);
    return Number.isFinite(n) ? n : NaN;
}

function resetToUpload() {
    resultsGrid.classList.remove('active');
    resultsActions.classList.remove('active');
    pythonCodeBlock.classList.remove('active');
    mappingCard.classList.remove('active');
    dropZone.style.display = 'block';
    fileInput.value = '';
    clearError();
    parsedData = { headers: [], rows: [], delimiter: ',' };
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
}

dropZone.addEventListener('click', (e) => {
    if (e.target.closest('#demoBtn')) return;
    fileInput.click();
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
    fileInput.value = '';
});

demoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearError();
    parseRawText(DEMO_DATA);
});

mappingCancelBtn.addEventListener('click', resetToUpload);
loadAnotherBtn.addEventListener('click', resetToUpload);

changeMappingBtn.addEventListener('click', () => {
    resultsGrid.classList.remove('active');
    resultsActions.classList.remove('active');
    pythonCodeBlock.classList.remove('active');
    mappingCard.classList.add('active');
    clearError();
});

function processFile(file) {
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.csv') && !lowerName.endsWith('.txt')) {
        showError('Пожалуйста, загрузите файл с расширением .csv или .txt');
        return;
    }

    clearError();
    const reader = new FileReader();
    reader.onload = (e) => {
        const buffer = e.target.result;
        const utf8Decoder = new TextDecoder('utf-8');
        let text = utf8Decoder.decode(buffer);

        if (text.includes('\uFFFD')) {
            try {
                const cp1251Decoder = new TextDecoder('windows-1251');
                text = cp1251Decoder.decode(buffer);
            } catch (err) {
                console.warn('Не удалось декодировать в windows-1251', err);
            }
        }
        parseRawText(text);
    };
    reader.onerror = () => {
        showError('Не удалось прочитать файл. Попробуйте другой.');
    };
    reader.readAsArrayBuffer(file);
}

function parseCSVLine(line, delimiter) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let wasQuoted = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (inQuotes) {
            if (char === '"') {
                if (line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
                wasQuoted = true;
            } else if (char === delimiter) {
                result.push(wasQuoted ? current : current.trim());
                current = '';
                wasQuoted = false;
            } else {
                current += char;
            }
        }
    }
    result.push(wasQuoted ? current : current.trim());
    return result;
}

function parseRawText(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    if (lines.length < 2) {
        showError('Файл пуст или содержит только заголовки');
        return;
    }

    const sample = lines.slice(0, 20).join('\n');
    const counts = {
        ',': (sample.match(/,/g) || []).length,
        ';': (sample.match(/;/g) || []).length,
        '\t': (sample.match(/\t/g) || []).length
    };
    const delimiter = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

    const cleanFirstLine = lines[0].replace(/^\uFEFF/, '');
    lines[0] = cleanFirstLine;

    const headers = parseCSVLine(lines[0], delimiter);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i], delimiter);
        if (cols.length > 1) rows.push(cols);
    }

    if (rows.length === 0) {
        showError('В файле нет строк с данными');
        return;
    }

    parsedData = { headers, rows, delimiter };
    showMapping();
}

function countUnique(colIdx) {
    const set = new Set();
    parsedData.rows.forEach(row => {
        const v = row[colIdx];
        if (v !== undefined && v !== '') set.add(v);
    });
    return set.size;
}

function showMapping() {
    mappingCard.classList.add('active');
    resultsGrid.classList.remove('active');
    resultsActions.classList.remove('active');
    pythonCodeBlock.classList.remove('active');
    dropZone.style.display = 'none';
    clearError();

    selectAmount.innerHTML = '';
    selectCategory.innerHTML = '';

    const colStats = parsedData.headers.map((h, idx) => {
        let numCount = 0, strCount = 0;
        parsedData.rows.slice(0, 30).forEach(row => {
            const v = row[idx];
            if (v !== undefined && v !== '') {
                if (!isNaN(normalizeNumber(v))) numCount++;
                else strCount++;
            }
        });
        return { idx, numCount, strCount, unique: countUnique(idx) };
    });

    const totalRows = parsedData.rows.length;

    const numericCandidates = colStats
        .filter(s => s.numCount > s.strCount && s.numCount >= totalRows * 0.5);

    const guessAmount = (
        numericCandidates.find(s => s.idx > 0 && s.unique < totalRows) ||
        numericCandidates[0] ||
        colStats.find(s => s.numCount > s.strCount)
    )?.idx ?? 0;

    const textCandidates = colStats
        .filter(s => s.strCount > s.numCount && s.idx !== guessAmount)
        .sort((a, b) => a.unique - b.unique);

    const guessCategory = (
        textCandidates[0] ||
        colStats.find(s => s.idx !== guessAmount)
    )?.idx ?? (parsedData.headers.length > 1 ? (guessAmount === 0 ? 1 : 0) : 0);

    parsedData.headers.forEach((header, index) => {
        const displayHeader = header || `Колонка ${index + 1}`;

        const optAmount = document.createElement('option');
        optAmount.value = index;
        optAmount.textContent = displayHeader;
        if (index === guessAmount) optAmount.selected = true;
        selectAmount.appendChild(optAmount);

        const optCategory = document.createElement('option');
        optCategory.value = index;
        optCategory.textContent = displayHeader;
        if (index === guessCategory) optCategory.selected = true;
        selectCategory.appendChild(optCategory);
    });

    applyMappingBtn.onclick = () => {
        const aIdx = parseInt(selectAmount.value, 10);
        const cIdx = parseInt(selectCategory.value, 10);
        if (aIdx === cIdx) {
            showError('Пожалуйста, выберите разные колонки для анализа и группировки.');
            return;
        }
        clearError();
        mappingCard.classList.remove('active');
        processData(aIdx, cIdx);
    };
}

function processData(amountIdx, categoryIdx) {
    let totalSum = 0;
    let maxAmount = -Infinity;
    let count = 0;
    const categories = {};
    const colName = parsedData.headers[amountIdx] || 'Значение';

    lblSum.textContent = `(${colName})`;
    lblMax.textContent = `(${colName})`;
    lblAvg.textContent = `(${colName})`;

    const amountKey = colName.toLowerCase().replace(/'/g, '');
    const catKey = (parsedData.headers[categoryIdx] || 'category').toLowerCase().replace(/'/g, '');

    pyColVal.textContent = `'${amountKey}'`;
    pyColVal2.textContent = `'${amountKey}'`;
    pyColCat.textContent = `'${catKey}'`;

    for (let i = 0; i < parsedData.rows.length; i++) {
        const cols = parsedData.rows[i];
        if (cols.length <= Math.max(amountIdx, categoryIdx)) continue;

        const amount = normalizeNumber(cols[amountIdx]);
        const category = cols[categoryIdx] || 'Без категории';

        if (!isNaN(amount)) {
            totalSum += amount;
            if (amount > maxAmount) maxAmount = amount;
            count++;
            categories[category] = (categories[category] || 0) + amount;
        }
    }

    if (count === 0) {
        showError('В выбранной колонке нет числовых данных. Пожалуйста, выберите другую.');
        mappingCard.classList.add('active');
        return;
    }

    renderResults({ totalSum, maxAmount, count, categories });
}

function formatNum(num) {
    return Number.isInteger(num)
        ? num.toLocaleString('ru-RU')
        : num.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}

function renderResults(data) {
    resultsGrid.classList.add('active');
    resultsActions.classList.add('active');
    pythonCodeBlock.classList.add('active');

    statCount.textContent = data.count;
    statSum.textContent = formatNum(data.totalSum);
    statMax.textContent = formatNum(data.maxAmount);
    statAvg.textContent = formatNum(Math.round((data.totalSum / data.count) * 100) / 100);

    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }

    if (typeof Chart === 'undefined') {
        chartCanvas.style.display = 'none';
        chartFallback.hidden = false;
        return;
    }

    chartCanvas.style.display = '';
    chartFallback.hidden = true;

    const sortedCats = Object.entries(data.categories).sort((a, b) => b[1] - a[1]);
    const topCats = sortedCats.slice(0, 7);
    const otherSum = sortedCats.slice(7).reduce((acc, curr) => acc + curr[1], 0);

    const labels = topCats.map(item => item[0]);
    const values = topCats.map(item => item[1]);

    if (otherSum > 0) {
        labels.push('Другое');
        values.push(otherSum);
    }

    const ctx = chartCanvas.getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    'rgba(255, 90, 0, 0.8)', 'rgba(255, 140, 74, 0.8)', 'rgba(252, 165, 165, 0.8)',
                    'rgba(148, 163, 184, 0.8)', 'rgba(71, 85, 105, 0.8)', 'rgba(40, 40, 40, 0.8)', 'rgba(100, 100, 100, 0.8)'
                ],
                borderColor: '#1e1e1e',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#ccc', font: { family: 'Manrope', size: 13 }, padding: 20 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) label += ': ';
                            if (context.parsed !== null) {
                                label += context.parsed.toLocaleString('ru-RU');
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}