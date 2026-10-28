const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const demoBtn = document.getElementById('demoBtn');
const resultsGrid = document.getElementById('resultsGrid');
const pythonCodeBlock = document.getElementById('pythonCodeBlock');
const mappingCard = document.getElementById('mappingCard');

const selectAmount = document.getElementById('selectAmount');
const selectCategory = document.getElementById('selectCategory');
const applyMappingBtn = document.getElementById('applyMappingBtn');

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

dropZone.addEventListener('click', (e) => {
    if (!e.target.closest('#demoBtn')) fileInput.click();
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
});

demoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    parseRawText(DEMO_DATA);
});

function processFile(file) {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
        alert('Пожалуйста, загрузите файл с расширением .csv или .txt');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const buffer = e.target.result;
        const utf8Decoder = new TextDecoder('utf-8');
        let text = utf8Decoder.decode(buffer);
        
        // Проверка на битые символы (если файл в windows-1251)
        if (text.includes('\uFFFD')) {
            try {
                const cp1251Decoder = new TextDecoder('windows-1251');
                text = cp1251Decoder.decode(buffer);
            } catch (err) {
                console.warn("Не удалось декодировать в windows-1251", err);
            }
        }
        parseRawText(text);
    };
    reader.readAsArrayBuffer(file);
}

function parseCSVLine(line, delimiter) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result.map(s => s.trim().replace(/^"|"$/g, ''));
}

function parseRawText(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    if (lines.length < 2) {
        alert('Файл пуст или содержит только заголовки');
        return;
    }

    // Автоопределение разделителя
    const sample = lines.slice(0, 20).join('\n');
    const counts = {
        ',': (sample.match(/,/g) || []).length,
        ';': (sample.match(/;/g) || []).length,
        '\t': (sample.match(/\t/g) || []).length
    };
    const delimiter = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

    // Убираем BOM (невидимый символ в начале файла), если он есть
    const cleanFirstLine = lines[0].replace(/^\uFEFF/, '');
    lines[0] = cleanFirstLine;

    const headers = parseCSVLine(lines[0], delimiter);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i], delimiter);
        if (cols.length > 1) rows.push(cols);
    }

    parsedData = { headers, rows, delimiter };
    showMapping();
}

function showMapping() {
    mappingCard.classList.add('active');
    resultsGrid.classList.remove('active');
    pythonCodeBlock.classList.remove('active');
    
    selectAmount.innerHTML = '';
    selectCategory.innerHTML = '';

    // Эвристика: пытаемся угадать, где числа, а где текст
    const colStats = parsedData.headers.map((h, idx) => {
        let numCount = 0, strCount = 0;
        parsedData.rows.slice(0, 10).forEach(row => {
            if (row[idx]) {
                const val = row[idx].replace(',', '.'); // Замена запятой для проверки
                if (!isNaN(parseFloat(val)) && isFinite(val)) numCount++;
                else strCount++;
            }
        });
        return { idx, numCount, strCount };
    });

    const guessAmount = colStats.find(s => s.numCount > s.strCount)?.idx ?? 0;
    const guessCategory = colStats.find(s => s.strCount > s.numCount)?.idx ?? (parsedData.headers.length > 1 ? 1 : 0);

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
            alert('Пожалуйста, выберите разные колонки для анализа и группировки.');
            return;
        }
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
    
    pyColVal.textContent = `'${colName.toLowerCase()}'`;
    pyColVal2.textContent = `'${colName.toLowerCase()}'`;
    pyColCat.textContent = `'${(parsedData.headers[categoryIdx] || 'category').toLowerCase()}'`;

    for (let i = 0; i < parsedData.rows.length; i++) {
        const cols = parsedData.rows[i];
        if (cols.length <= Math.max(amountIdx, categoryIdx)) continue;

        let amountStr = cols[amountIdx].replace(/[^0-9.,-]+/g, '');
        
        // Обработка чисел: 1,500.50 (англ) vs 1500,50 (рус)
        if (amountStr.includes(',') && amountStr.includes('.')) {
            if (amountStr.lastIndexOf(',') > amountStr.lastIndexOf('.')) {
                amountStr = amountStr.replace(/\./g, '').replace(',', '.'); // 1.500,50 -> 1500.50
            } else {
                amountStr = amountStr.replace(/,/g, ''); // 1,500.50 -> 1500.50
            }
        } else if (amountStr.includes(',')) {
            amountStr = amountStr.replace(',', '.');
        }
        
        const amount = parseFloat(amountStr);
        let category = cols[categoryIdx] || 'Без категории';

        if (!isNaN(amount)) {
            totalSum += amount;
            if (amount > maxAmount) maxAmount = amount;
            count++;
            categories[category] = (categories[category] || 0) + amount;
        }
    }

    if (count === 0) {
        alert('В выбранной колонке нет числовых данных. Пожалуйста, выберите другую.');
        mappingCard.classList.add('active');
        return;
    }

    renderResults({ totalSum, maxAmount, count, categories });
}

function renderResults(data) {
    resultsGrid.classList.add('active');
    pythonCodeBlock.classList.add('active');
    dropZone.style.display = 'none';

    statCount.textContent = data.count;
    
    // Если сумма очень большая, округляем для красоты
    const formatNum = (num) => {
        return Number.isInteger(num) ? num.toLocaleString('ru-RU') : num.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
    };

    statSum.textContent = formatNum(data.totalSum);
    statMax.textContent = formatNum(data.maxAmount);
    statAvg.textContent = formatNum(Math.round((data.totalSum / data.count) * 100) / 100);

    const sortedCats = Object.entries(data.categories).sort((a, b) => b[1] - a[1]);
    const topCats = sortedCats.slice(0, 7);
    const otherSum = sortedCats.slice(7).reduce((acc, curr) => acc + curr[1], 0);
    
    const labels = topCats.map(item => item[0]);
    const values = topCats.map(item => item[1]);
    
    if (otherSum > 0) {
        labels.push('Другое');
        values.push(otherSum);
    }

    if (chartInstance) chartInstance.destroy();

    const ctx = document.getElementById('expensesChart').getContext('2d');
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