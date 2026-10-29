export function initSketchpad() {
    const canvas = document.getElementById('sketchCanvas');
    if (!canvas) return;
    const wrapper = document.getElementById('canvasWrapper');
    if (!wrapper) return;
    const ctx = canvas.getContext('2d');

    const colorPicker = document.getElementById('colorPicker');
    const customColor = document.getElementById('customColor');
    const brushSizeInput = document.getElementById('brushSize');
    
    const toolSelect = document.getElementById('toolSelect');
    const toolPen = document.getElementById('toolPen');
    const toolEraser = document.getElementById('toolEraser');
    const toolEyedropper = document.getElementById('toolEyedropper');
    const toolText = document.getElementById('toolText');
    const toolRect = document.getElementById('toolRect');
    const toolCircle = document.getElementById('toolCircle');
    const toolTriangle = document.getElementById('toolTriangle');
    const toolPolygon = document.getElementById('toolPolygon');
    const toolStar = document.getElementById('toolStar');
    const toolTable = document.getElementById('toolTable');
    const toolClear = document.getElementById('toolClear');
    
    const textPanel = document.getElementById('textPanel');
    const fontFamilySelect = document.getElementById('fontFamily');
    const fontSizeInput = document.getElementById('fontSize');
    const alignBtns = document.querySelectorAll('[data-align]');
    const shapeOptions = document.getElementById('shapeOptions');
    const shapeSidesInput = document.getElementById('shapeSides');

    const savePng = document.getElementById('savePng');
    const saveJpg = document.getElementById('saveJpg');
    const saveWebp = document.getElementById('saveWebp');
    const recordVideo = document.getElementById('recordVideo');
    const recordText = document.getElementById('recordText');
    const fileNameInput = document.getElementById('fileName');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const zoomValue = document.getElementById('zoomValue');

    const clearModal = document.getElementById('clearModal');
    const clearCancel = document.getElementById('clearCancel');
    const clearConfirm = document.getElementById('clearConfirm');

    const tablePopover = document.getElementById('tablePopover');
    const tableGrid = document.getElementById('tableGrid');
    const tableSizeLabel = document.getElementById('tableSizeLabel');

    const MIN_ZOOM = 0.05;
    const MAX_ZOOM = 20;
    const MAX_HISTORY = 30;
    const BG_COLOR = '#151515';

    let strokes = [];
    let currentStroke = null;
    let undoStack = [];
    let redoStack = [];

    let currentTool = 'pen';
    let currentColor = '#ffffff';
    let currentSize = 4;
    let currentFont = 'Manrope, sans-serif';
    let currentFontSize = 16;
    let currentAlign = 'center';
    let currentSides = 5;

    let zoom = 1;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let spacePressed = false;
    let panStartX = 0;
    let panStartY = 0;
    let isDrawing = false;
    let wrapperHovered = false;

    let selectedStroke = null;
    let isDraggingObject = false;
    let isRotating = false;
    let isResizingCell = false;
    let resizeCellData = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let rotStartAngle = 0;

    let pendingTable = { rows: 1, cols: 1 };
    let editingInput = null;

    let mediaRecorder = null;
    let recordedChunks = [];
    let isRecording = false;

    let popoverCloseTimer = null;

    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const getDpr = () => window.devicePixelRatio || 1;

    function cloneStrokes(arr) {
        return JSON.parse(JSON.stringify(arr));
    }

    function schedulePopoverClose(popover) {
        clearTimeout(popoverCloseTimer);
        popoverCloseTimer = setTimeout(() => {
            popover.classList.remove('active');
        }, 200);
    }

    function cancelPopoverClose() {
        clearTimeout(popoverCloseTimer);
    }

    function setupCanvas() {
        const rect = wrapper.getBoundingClientRect();
        const d = getDpr();
        canvas.width = Math.max(1, Math.round(rect.width * d));
        canvas.height = Math.max(1, Math.round(rect.height * d));
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
    }

    function applyTransform(target) {
        const d = getDpr();
        target.setTransform(d * zoom, 0, 0, d * zoom, d * panX, d * panY);
    }

    function getShapePoints(stroke) {
        const pts = [];
        const cx = stroke.cx;
        const cy = stroke.cy;
        const rx = stroke.w / 2;
        const ry = stroke.h / 2;
        
        if (stroke.tool === 'triangle') {
            pts.push({ x: 0, y: -ry });
            pts.push({ x: rx, y: ry });
            pts.push({ x: -rx, y: ry });
        } else if (stroke.tool === 'polygon' || stroke.tool === 'star') {
            const sides = stroke.sides || 5;
            const star = stroke.tool === 'star';
            const totalPts = star ? sides * 2 : sides;
            const angleStep = (Math.PI * 2) / totalPts;
            let angle = -Math.PI / 2;
            
            for (let i = 0; i < totalPts; i++) {
                const r = star ? (i % 2 === 0 ? 1 : 0.4) : 1;
                pts.push({
                    x: Math.cos(angle) * rx * r,
                    y: Math.sin(angle) * ry * r
                });
                angle += angleStep;
            }
        }
        return pts;
    }

    function drawStrokeTo(target, stroke) {
        target.lineCap = 'round';
        target.lineJoin = 'round';
        target.lineWidth = stroke.size || 1;

        target.globalCompositeOperation = 'source-over';
        if (stroke.tool === 'eraser') {
            target.strokeStyle = BG_COLOR;
            target.fillStyle = BG_COLOR;
        } else {
            target.strokeStyle = stroke.color;
            target.fillStyle = stroke.color;
        }

        if (stroke.tool === 'pen' || stroke.tool === 'eraser') {
            const pts = stroke.points;
            if (!pts || !pts.length) return;
            if (pts.length === 1) {
                target.beginPath();
                target.arc(pts[0].x, pts[0].y, stroke.size / 2, 0, Math.PI * 2);
                target.fill();
                return;
            }
            target.beginPath();
            target.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) target.lineTo(pts[i].x, pts[i].y);
            target.stroke();
        } else if (['rect', 'circle', 'triangle', 'polygon', 'star'].includes(stroke.tool)) {
            target.save();
            target.translate(stroke.cx, stroke.cy);
            target.rotate(stroke.rot || 0);
            
            if (stroke.tool === 'rect') {
                target.strokeRect(-stroke.w / 2, -stroke.h / 2, stroke.w, stroke.h);
            } else if (stroke.tool === 'circle') {
                target.beginPath();
                target.ellipse(0, 0, stroke.w / 2, stroke.h / 2, 0, 0, Math.PI * 2);
                target.stroke();
            } else {
                const pts = getShapePoints(stroke);
                if (pts.length) {
                    target.beginPath();
                    target.moveTo(pts[0].x, pts[0].y);
                    for (let i = 1; i < pts.length; i++) target.lineTo(pts[i].x, pts[i].y);
                    target.closePath();
                    target.stroke();
                }
            }
            target.restore();
        } else if (stroke.tool === 'table') {
            const { x, y, colWidths, rowHeights, cells } = stroke;
            const totalW = colWidths.reduce((a, b) => a + b, 0);
            const totalH = rowHeights.reduce((a, b) => a + b, 0);
            
            target.strokeRect(x, y, totalW, totalH);
            
            let curX = x;
            for (let i = 0; i < colWidths.length - 1; i++) {
                curX += colWidths[i];
                target.beginPath();
                target.moveTo(curX, y);
                target.lineTo(curX, y + totalH);
                target.stroke();
            }
            
            let curY = y;
            for (let i = 0; i < rowHeights.length - 1; i++) {
                curY += rowHeights[i];
                target.beginPath();
                target.moveTo(x, curY);
                target.lineTo(x + totalW, curY);
                target.stroke();
            }

            target.textAlign = 'center';
            target.textBaseline = 'middle';
            
            curY = y;
            for (let r = 0; r < rowHeights.length; r++) {
                let cellX = x;
                for (let c = 0; c < colWidths.length; c++) {
                    const text = cells[`${r},${c}`];
                    if (text) {
                        const cellH = rowHeights[r];
                        const fs = Math.max(10, Math.min(cellH * 0.4, 24));
                        target.font = `bold ${fs}px Manrope, sans-serif`;
                        target.fillText(text, cellX + colWidths[c] / 2, curY + cellH / 2);
                    }
                    cellX += colWidths[c];
                }
                curY += rowHeights[r];
            }
        } else if (stroke.tool === 'text') {
            target.textBaseline = 'top';
            target.font = `${stroke.fontSize || 16}px ${stroke.fontFamily || 'Manrope, sans-serif'}`;
            
            if (stroke.align === 'center') {
                target.textAlign = 'center';
                target.fillText(stroke.text, stroke.x, stroke.y);
            } else if (stroke.align === 'right') {
                target.textAlign = 'right';
                target.fillText(stroke.text, stroke.x, stroke.y);
            } else {
                target.textAlign = 'left';
                target.fillText(stroke.text, stroke.x, stroke.y);
            }
        }
    }

    function drawGrid(target) {
        let step = 20;
        while (step * zoom < 12) step *= 2;
        while (step * zoom > 80) step /= 2;

        const dpr = getDpr();
        const width = target.canvas.width / dpr;
        const height = target.canvas.height / dpr;

        const top = -panY / zoom;
        const bottom = (height - panY) / zoom;
        const left = -panX / zoom;
        const right = (width - panX) / zoom;

        const startX = Math.floor(left / step) * step;
        const endX = Math.ceil(right / step) * step;
        const startY = Math.floor(top / step) * step;
        const endY = Math.ceil(bottom / step) * step;

        target.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        target.lineWidth = 1 / zoom;
        target.beginPath();

        for (let x = startX; x <= endX; x += step) {
            target.moveTo(x, top);
            target.lineTo(x, bottom);
        }
        for (let y = startY; y <= endY; y += step) {
            target.moveTo(left, y);
            target.lineTo(right, y);
        }
        target.stroke();
    }

    function drawSelection() {
        if (!selectedStroke) return;
        
        ctx.save();
        applyTransform(ctx);
        
        let cx = 0, cy = 0, w = 0, h = 0, rot = 0;
        
        if (['rect', 'circle', 'triangle', 'polygon', 'star'].includes(selectedStroke.tool)) {
            cx = selectedStroke.cx;
            cy = selectedStroke.cy;
            w = selectedStroke.w;
            h = selectedStroke.h;
            rot = selectedStroke.rot || 0;
        } else if (selectedStroke.tool === 'table') {
            cx = selectedStroke.x + selectedStroke.colWidths.reduce((a, b) => a + b, 0) / 2;
            cy = selectedStroke.y + selectedStroke.rowHeights.reduce((a, b) => a + b, 0) / 2;
            w = selectedStroke.colWidths.reduce((a, b) => a + b, 0);
            h = selectedStroke.rowHeights.reduce((a, b) => a + b, 0);
            rot = 0;
        } else if (selectedStroke.tool === 'text') {
            ctx.font = `${selectedStroke.fontSize || 16}px ${selectedStroke.fontFamily || 'Manrope, sans-serif'}`;
            const m = ctx.measureText(selectedStroke.text);
            w = Math.max(20, m.width);
            h = Math.max(20, selectedStroke.fontSize * 1.2);
            
            if (selectedStroke.align === 'center') cx = selectedStroke.x;
            else if (selectedStroke.align === 'right') cx = selectedStroke.x - w / 2;
            else cx = selectedStroke.x + w / 2;
            
            cy = selectedStroke.y + h / 2;
            rot = 0;
        }

        ctx.translate(cx, cy);
        ctx.rotate(rot);
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 4 / zoom;
        ctx.setLineDash([]);
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        
        ctx.strokeStyle = '#ff5a00';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([6 / zoom, 4 / zoom]);
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        
        ctx.setLineDash([]);
        ctx.fillStyle = '#ff5a00';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 2 / zoom;
        
        const handleY = -h / 2 - 20 / zoom;
        
        ctx.beginPath();
        ctx.moveTo(0, -h / 2);
        ctx.lineTo(0, handleY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, handleY, 6 / zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    function render() {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = BG_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        ctx.save();
        applyTransform(ctx);
        drawGrid(ctx);
        for (const s of strokes) drawStrokeTo(ctx, s);
        if (currentStroke) drawStrokeTo(ctx, currentStroke);
        ctx.restore();
        
        if (selectedStroke && !isDrawing && !isRotating && !isResizingCell) {
            drawSelection();
        }

        ctx.globalCompositeOperation = 'source-over';
        zoomValue.textContent = Math.round(zoom * 100) + '%';
    }

    function toWorld(clientX, clientY) {
        const rect = wrapper.getBoundingClientRect();
        return {
            x: (clientX - rect.left - panX) / zoom,
            y: (clientY - rect.top - panY) / zoom
        };
    }

    function applyZoom(newZoom, ax, ay) {
        newZoom = clamp(newZoom, MIN_ZOOM, MAX_ZOOM);
        if (newZoom === zoom) return;
        const cx = (ax - panX) / zoom;
        const cy = (ay - panY) / zoom;
        zoom = newZoom;
        panX = ax - cx * zoom;
        panY = ay - cy * zoom;
        render();
    }

    function getContentBounds() {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const s of strokes) {
            if (s.tool === 'eraser') continue;
            if (s.tool === 'table') {
                if (s.x < minX) minX = s.x;
                if (s.y < minY) minY = s.y;
                const w = s.colWidths.reduce((a, b) => a + b, 0);
                const h = s.rowHeights.reduce((a, b) => a + b, 0);
                if (s.x + w > maxX) maxX = s.x + w;
                if (s.y + h > maxY) maxY = s.y + h;
                continue;
            }
            if (s.tool === 'text') {
                ctx.font = `${s.fontSize || 16}px ${s.fontFamily || 'Manrope, sans-serif'}`;
                const m = ctx.measureText(s.text);
                const tw = Math.max(20, m.width);
                const th = Math.max(20, s.fontSize * 1.2);
                
                let tx = s.x, ty = s.y;
                if (s.align === 'center') tx = s.x - tw / 2;
                else if (s.align === 'right') tx = s.x - tw;
                
                if (tx < minX) minX = tx;
                if (ty < minY) minY = ty;
                if (tx + tw > maxX) maxX = tx + tw;
                if (ty + th > maxY) maxY = ty + th;
                continue;
            }
            if (['rect', 'circle', 'triangle', 'polygon', 'star'].includes(s.tool)) {
                const r = Math.max(s.w, s.h) / 2;
                if (s.cx - r < minX) minX = s.cx - r;
                if (s.cy - r < minY) minY = s.cy - r;
                if (s.cx + r > maxX) maxX = s.cx + r;
                if (s.cy + r > maxY) maxY = s.cy + r;
                continue;
            }
            const pad = s.size / 2;
            for (const p of s.points) {
                if (p.x - pad < minX) minX = p.x - pad;
                if (p.y - pad < minY) minY = p.y - pad;
                if (p.x + pad > maxX) maxX = p.x + pad;
                if (p.y + pad > maxY) maxY = p.y + pad;
            }
        }
        if (!isFinite(minX) || !isFinite(minY)) return null;
        return { minX, minY, maxX, maxY };
    }

    function pushHistory() {
        undoStack.push(cloneStrokes(strokes));
        if (undoStack.length > MAX_HISTORY) undoStack.shift();
        redoStack = [];
    }

    function undo() {
        if (editingInput) closeEditor();
        if (undoStack.length === 0) return;
        redoStack.push(cloneStrokes(strokes));
        strokes = undoStack.pop();
        selectedStroke = null;
        render();
    }

    function redo() {
        if (editingInput) closeEditor();
        if (redoStack.length === 0) return;
        undoStack.push(cloneStrokes(strokes));
        strokes = redoStack.pop();
        selectedStroke = null;
        render();
    }

    function closeEditor() {
        if (!editingInput) return;
        const { input, stroke, r, c, isNew } = editingInput;
        
        if (stroke.tool === 'text') {
            const val = input.value.trim();
            if (!val) {
                if (!isNew) {
                    const idx = strokes.indexOf(stroke);
                    if (idx !== -1) {
                        pushHistory();
                        strokes.splice(idx, 1);
                    }
                }
            } else {
                const oldVal = stroke.text || '';
                if (isNew) {
                    stroke.text = val;
                    pushHistory();
                    strokes.push(stroke);
                } else if (val !== oldVal) {
                    stroke.text = val;
                    pushHistory();
                }
            }
        } else {
            const key = `${r},${c}`;
            const newVal = input.value.trim();
            const oldVal = stroke.cells[key] || '';
            if (newVal !== oldVal) {
                stroke.cells[key] = newVal;
                pushHistory();
            }
        }
        
        input.remove();
        editingInput = null;
        render();
    }

    function openEditor(stroke, r, c, isNew = false) {
        if (editingInput) closeEditor();
        
        const input = document.createElement(stroke.tool === 'text' ? 'textarea' : 'input');
        
        if (stroke.tool === 'text') {
            input.className = 'sketchpad-text-input';
            input.value = stroke.text || '';
            input.style.left = `${panX + stroke.x * zoom}px`;
            input.style.top = `${panY + stroke.y * zoom}px`;
            input.style.fontSize = `${stroke.fontSize * zoom}px`;
            input.style.fontFamily = stroke.fontFamily;
            input.style.color = stroke.color;
            input.rows = 1;
            input.style.width = '100px';
            input.style.height = `${stroke.fontSize * 1.5 * zoom}px`;
            
            input.addEventListener('input', () => {
                input.style.width = Math.max(100, input.scrollWidth) + 'px';
            });
        } else {
            input.className = 'sketchpad-cell-input';
            input.type = 'text';
            input.value = stroke.cells[`${r},${c}`] || '';
            
            let cellX = stroke.x;
            for (let i = 0; i < c; i++) cellX += stroke.colWidths[i];
            let cellY = stroke.y;
            for (let i = 0; i < r; i++) cellY += stroke.rowHeights[i];
            
            const cellW = stroke.colWidths[c];
            const cellH = stroke.rowHeights[r];
            
            input.style.left = `${panX + cellX * zoom}px`;
            input.style.top = `${panY + cellY * zoom}px`;
            input.style.width = `${cellW * zoom}px`;
            input.style.height = `${cellH * zoom}px`;
            input.style.fontSize = `${Math.max(10, Math.min(cellH * 0.4, 24)) * zoom}px`;
        }
        
        wrapper.appendChild(input);
        input.focus();
        if (stroke.tool === 'text') input.setSelectionRange(input.value.length, input.value.length);
        
        editingInput = { input, stroke, r, c, isNew };

        input.addEventListener('blur', closeEditor);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                closeEditor();
            }
            if (e.key === 'Escape') {
                if (stroke.tool === 'text') input.value = stroke.text || '';
                else input.value = stroke.cells[`${r},${c}`] || '';
                closeEditor();
            }
        });
    }

    for (let r = 1; r <= 10; r++) {
        for (let c = 1; c <= 10; c++) {
            const cell = document.createElement('div');
            cell.className = 'table-popover-cell';
            cell.dataset.r = r;
            cell.dataset.c = c;
            
            cell.addEventListener('mouseenter', () => {
                tableSizeLabel.textContent = `${c} x ${r}`;
                document.querySelectorAll('.table-popover-cell').forEach(el => {
                    if (parseInt(el.dataset.r) <= r && parseInt(el.dataset.c) <= c) {
                        el.classList.add('active');
                    } else {
                        el.classList.remove('active');
                    }
                });
            });
            
            cell.addEventListener('click', () => {
                pendingTable = { rows: r, cols: c };
                tablePopover.classList.remove('active');
                setTool('table', toolTable);
            });
            
            tableGrid.appendChild(cell);
        }
    }

    toolTable.addEventListener('mouseenter', () => {
        cancelPopoverClose();
        tablePopover.classList.add('active');
        shapeOptions.classList.remove('active');
        textPanel.classList.remove('active');
    });
    toolTable.addEventListener('mouseleave', () => {
        if (currentTool !== 'table') schedulePopoverClose(tablePopover);
    });
    tablePopover.addEventListener('mouseenter', cancelPopoverClose);
    tablePopover.addEventListener('mouseleave', () => schedulePopoverClose(tablePopover));

    toolPolygon.addEventListener('mouseenter', () => {
        cancelPopoverClose();
        shapeOptions.classList.add('active');
        tablePopover.classList.remove('active');
        textPanel.classList.remove('active');
    });
    toolStar.addEventListener('mouseenter', () => {
        cancelPopoverClose();
        shapeOptions.classList.add('active');
        tablePopover.classList.remove('active');
        textPanel.classList.remove('active');
    });
    toolPolygon.addEventListener('mouseleave', () => {
        if (currentTool !== 'polygon') schedulePopoverClose(shapeOptions);
    });
    toolStar.addEventListener('mouseleave', () => {
        if (currentTool !== 'star') schedulePopoverClose(shapeOptions);
    });
    shapeOptions.addEventListener('mouseenter', cancelPopoverClose);
    shapeOptions.addEventListener('mouseleave', () => schedulePopoverClose(shapeOptions));

    shapeSidesInput.addEventListener('change', (e) => {
        currentSides = clamp(parseInt(e.target.value, 10) || 5, 3, 20);
        if (selectedStroke && (selectedStroke.tool === 'polygon' || selectedStroke.tool === 'star')) {
            selectedStroke.sides = currentSides;
            pushHistory();
            render();
        }
    });

    toolText.addEventListener('click', () => {
        setTool('text', toolText);
        textPanel.classList.toggle('active');
    });

    fontFamilySelect.addEventListener('change', (e) => {
        currentFont = e.target.value;
        if (selectedStroke && selectedStroke.tool === 'text') {
            selectedStroke.fontFamily = currentFont;
            pushHistory();
            render();
        }
    });

    fontSizeInput.addEventListener('change', (e) => {
        currentFontSize = clamp(parseInt(e.target.value, 10) || 16, 8, 200);
        if (selectedStroke && selectedStroke.tool === 'text') {
            selectedStroke.fontSize = currentFontSize;
            pushHistory();
            render();
        }
    });

    alignBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            alignBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentAlign = btn.dataset.align;
            
            if (selectedStroke && selectedStroke.tool === 'text') {
                selectedStroke.align = currentAlign;
                pushHistory();
                render();
            }
        });
    });

    wrapper.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (editingInput) closeEditor();
        tablePopover.classList.remove('active');
        shapeOptions.classList.remove('active');
        const rect = wrapper.getBoundingClientRect();
        const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        applyZoom(zoom * f, e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: false });

    zoomInBtn.addEventListener('click', () => {
        const r = wrapper.getBoundingClientRect();
        applyZoom(zoom * 1.2, r.width / 2, r.height / 2);
    });

    zoomOutBtn.addEventListener('click', () => {
        const r = wrapper.getBoundingClientRect();
        applyZoom(zoom / 1.2, r.width / 2, r.height / 2);
    });

    wrapper.addEventListener('pointerenter', () => { wrapperHovered = true; });
    wrapper.addEventListener('pointerleave', () => { wrapperHovered = false; });

    document.addEventListener('keydown', (e) => {
        const el = document.activeElement;
        const tag = el ? el.tagName.toLowerCase() : '';
        const typing = tag === 'input' || tag === 'textarea' || (el && el.isContentEditable);

        if (e.code === 'Space' && !typing && (wrapperHovered || el === canvas)) {
            if (!spacePressed) {
                spacePressed = true;
                if (!isDrawing && !isPanning) wrapper.classList.add('panning');
            }
            e.preventDefault();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && !typing) {
            if (e.code === 'KeyZ' && !e.shiftKey) { e.preventDefault(); undo(); }
            else if (e.code === 'KeyY' || (e.code === 'KeyZ' && e.shiftKey)) { e.preventDefault(); redo(); }
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            spacePressed = false;
            if (!isPanning) wrapper.classList.remove('panning');
        }
    });

    function pickColor(e) {
        const d = getDpr();
        const rect = wrapper.getBoundingClientRect();
        const px = Math.floor((e.clientX - rect.left) * d);
        const py = Math.floor((e.clientY - rect.top) * d);
        if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) return;
        const data = ctx.getImageData(px, py, 1, 1).data;
        if (data[3] === 0) return;
        const hex = '#' + [data[0], data[1], data[2]].map(v => v.toString(16).padStart(2, '0')).join('');
        currentColor = hex;
        customColor.value = hex;
        colorPicker.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        setTool('pen', toolPen);
    }

    function checkTableCellResize(p) {
        if (!selectedStroke || selectedStroke.tool !== 'table') return false;
        
        const s = selectedStroke;
        const threshold = 10 / zoom;
        const totalW = s.colWidths.reduce((a,b)=>a+b, 0);
        const totalH = s.rowHeights.reduce((a,b)=>a+b, 0);
        
        let cellX = s.x;
        for (let c = 0; c < s.colWidths.length; c++) {
            cellX += s.colWidths[c];
            if (Math.abs(p.x - cellX) < threshold && p.y >= s.y && p.y <= s.y + totalH) {
                isResizingCell = true;
                resizeCellData = { type: 'col', index: c, startX: p.x, origWidths: [...s.colWidths] };
                return true;
            }
        }
        
        let cellY = s.y;
        for (let r = 0; r < s.rowHeights.length; r++) {
            cellY += s.rowHeights[r];
            if (Math.abs(p.y - cellY) < threshold && p.x >= s.x && p.x <= s.x + totalW) {
                isResizingCell = true;
                resizeCellData = { type: 'row', index: r, startY: p.y, origHeights: [...s.rowHeights] };
                return true;
            }
        }
        return false;
    }

    function getSelectionHandleHit(p) {
        if (!selectedStroke) return false;
        if (!['rect', 'circle', 'triangle', 'polygon', 'star'].includes(selectedStroke.tool)) return false;
        
        const cx = selectedStroke.cx;
        const cy = selectedStroke.cy;
        const h = selectedStroke.h;
        const rot = selectedStroke.rot || 0;
        
        const handleDist = 20 / zoom;
        const hx = cx + Math.sin(rot) * (h / 2 + handleDist);
        const hy = cy - Math.cos(rot) * (h / 2 + handleDist);
        
        const dx = p.x - hx;
        const dy = p.y - hy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        return dist < 15 / zoom;
    }

    function startPosition(e) {
        canvas.focus({ preventScroll: true });
        if (editingInput) closeEditor();
        tablePopover.classList.remove('active');
        shapeOptions.classList.remove('active');

        if (spacePressed || e.button === 1) {
            e.preventDefault();
            isPanning = true;
            wrapper.classList.add('panning');
            panStartX = e.clientX - panX;
            panStartY = e.clientY - panY;
            try { wrapper.setPointerCapture(e.pointerId); } catch (_) {}
            return;
        }
        if (e.button !== 0) return;
        
        if (currentTool === 'eyedropper') {
            pickColor(e);
            return;
        }

        const p = toWorld(e.clientX, e.clientY);

        if (currentTool === 'select') {
            if (getSelectionHandleHit(p)) {
                isRotating = true;
                const cx = selectedStroke.cx;
                const cy = selectedStroke.cy;
                rotStartAngle = Math.atan2(p.y - cy, p.x - cx) - (selectedStroke.rot || 0);
                try { wrapper.setPointerCapture(e.pointerId); } catch (_) {}
                return;
            }
            
            if (checkTableCellResize(p)) {
                try { wrapper.setPointerCapture(e.pointerId); } catch (_) {}
                return;
            }

            for (let i = strokes.length - 1; i >= 0; i--) {
                const s = strokes[i];
                let hit = false;
                
                if (['rect', 'circle', 'triangle', 'polygon', 'star'].includes(s.tool)) {
                    const dx = p.x - s.cx;
                    const dy = p.y - s.cy;
                    const rot = -(s.rot || 0);
                    const lx = dx * Math.cos(rot) - dy * Math.sin(rot);
                    const ly = dx * Math.sin(rot) + dy * Math.cos(rot);
                    
                    if (Math.abs(lx) <= s.w / 2 && Math.abs(ly) <= s.h / 2) hit = true;
                    else if (Math.sqrt(lx*lx + ly*ly) < 20 / zoom) hit = true;
                } else if (s.tool === 'table') {
                    const w = s.colWidths.reduce((a, b) => a + b, 0);
                    const h = s.rowHeights.reduce((a, b) => a + b, 0);
                    if (p.x >= s.x && p.x <= s.x + w && p.y >= s.y && p.y <= s.y + h) hit = true;
                } else if (s.tool === 'text') {
                    ctx.font = `${s.fontSize || 16}px ${s.fontFamily || 'Manrope, sans-serif'}`;
                    const m = ctx.measureText(s.text);
                    let bw = Math.max(20, m.width);
                    let bh = Math.max(20, s.fontSize * 1.2);
                    let bx = s.x, by = s.y;
                    if (s.align === 'center') bx -= bw / 2;
                    else if (s.align === 'right') bx -= bw;
                    
                    if (p.x >= bx && p.x <= bx + bw && p.y >= by && p.y <= by + bh) hit = true;
                }

                if (hit) {
                    selectedStroke = s;
                    isDraggingObject = true;
                    dragStartX = p.x;
                    dragStartY = p.y;
                    try { wrapper.setPointerCapture(e.pointerId); } catch (_) {}
                    render();
                    return;
                }
            }
            
            selectedStroke = null;
            isPanning = true;
            wrapper.classList.add('panning');
            panStartX = e.clientX - panX;
            panStartY = e.clientY - panY;
            try { wrapper.setPointerCapture(e.pointerId); } catch (_) {}
            render();
            return;
        }
        
        e.preventDefault();
        selectedStroke = null;
        
        if (currentTool === 'text') {
            const newTextStroke = {
                tool: 'text',
                text: '',
                x: p.x,
                y: p.y,
                color: currentColor,
                fontSize: currentFontSize,
                fontFamily: currentFont,
                align: currentAlign
            };
            openEditor(newTextStroke, 0, 0, true);
            return;
        }

        isDrawing = true;
        try { wrapper.setPointerCapture(e.pointerId); } catch (_) {}
        
        if (['pen', 'eraser'].includes(currentTool)) {
            currentStroke = {
                tool: currentTool,
                color: currentColor,
                size: currentSize,
                points: [{ x: p.x, y: p.y }]
            };
        } else if (['rect', 'circle', 'triangle', 'polygon', 'star'].includes(currentTool)) {
            currentStroke = {
                tool: currentTool,
                color: currentColor,
                size: currentSize,
                cx: p.x,
                cy: p.y,
                w: 0,
                h: 0,
                rot: 0,
                sides: currentSides
            };
        } else if (currentTool === 'table') {
            const cw = [];
            const rh = [];
            for (let i = 0; i < pendingTable.cols; i++) cw.push(100);
            for (let i = 0; i < pendingTable.rows; i++) rh.push(40);
            currentStroke = {
                tool: 'table',
                color: currentColor,
                size: currentSize,
                x: p.x,
                y: p.y,
                colWidths: cw,
                rowHeights: rh,
                cells: {}
            };
        }
        render();
    }

    function draw(e) {
        if (isPanning) {
            panX = e.clientX - panStartX;
            panY = e.clientY - panStartY;
            render();
            return;
        }
        
        const p = toWorld(e.clientX, e.clientY);

        if (isRotating && selectedStroke) {
            const angle = Math.atan2(p.y - selectedStroke.cy, p.x - selectedStroke.cx);
            selectedStroke.rot = angle - rotStartAngle;
            render();
            return;
        }

        if (isResizingCell && selectedStroke) {
            if (resizeCellData.type === 'col') {
                const dx = p.x - resizeCellData.startX;
                const idx = resizeCellData.index;
                selectedStroke.colWidths[idx] = Math.max(20, resizeCellData.origWidths[idx] + dx);
            } else {
                const dy = p.y - resizeCellData.startY;
                const idx = resizeCellData.index;
                selectedStroke.rowHeights[idx] = Math.max(20, resizeCellData.origHeights[idx] + dy);
            }
            render();
            return;
        }
        
        if (isDraggingObject && selectedStroke) {
            const dx = p.x - dragStartX;
            const dy = p.y - dragStartY;

            if (selectedStroke.tool === 'table') {
                selectedStroke.x += dx;
                selectedStroke.y += dy;
            } else if (selectedStroke.tool === 'text') {
                selectedStroke.x += dx;
                selectedStroke.y += dy;
            } else {
                selectedStroke.cx += dx;
                selectedStroke.cy += dy;
            }
            dragStartX = p.x;
            dragStartY = p.y;
            render();
            return;
        }

        if (!isDrawing || !currentStroke) return;
        e.preventDefault();

        const events = (typeof e.getCoalescedEvents === 'function' && e.getCoalescedEvents().length)
            ? e.getCoalescedEvents() : [e];

        if (['pen', 'eraser'].includes(currentTool)) {
            for (const ev of events) {
                const lp = toWorld(ev.clientX, ev.clientY);
                const prev = currentStroke.points[currentStroke.points.length - 1];
                if (prev.x === lp.x && prev.y === lp.y) continue;
                currentStroke.points.push(lp);
            }
        } else if (['rect', 'circle', 'triangle', 'polygon', 'star'].includes(currentTool)) {
            const ev = events[events.length - 1];
            const lp = toWorld(ev.clientX, ev.clientY);
            currentStroke.w = Math.abs(lp.x - currentStroke.cx) * 2;
            currentStroke.h = Math.abs(lp.y - currentStroke.cy) * 2;
        } else if (currentTool === 'table') {
            const ev = events[events.length - 1];
            const lp = toWorld(ev.clientX, ev.clientY);
            const w = Math.abs(lp.x - currentStroke.x);
            const h = Math.abs(lp.y - currentStroke.y);
            const cw = currentStroke.colWidths.length;
            const rh = currentStroke.rowHeights.length;
            for (let i = 0; i < cw; i++) currentStroke.colWidths[i] = w / cw;
            for (let i = 0; i < rh; i++) currentStroke.rowHeights[i] = h / rh;
        }
        render();
    }

    function endPosition(e) {
        if (isPanning) {
            isPanning = false;
            if (!spacePressed) wrapper.classList.remove('panning');
            try { wrapper.releasePointerCapture(e.pointerId); } catch (_) {}
            return;
        }
        
        if (isDraggingObject) {
            isDraggingObject = false;
            try { wrapper.releasePointerCapture(e.pointerId); } catch (_) {}
            return;
        }
        
        if (isRotating) {
            isRotating = false;
            try { wrapper.releasePointerCapture(e.pointerId); } catch (_) {}
            return;
        }

        if (isResizingCell) {
            isResizingCell = false;
            try { wrapper.releasePointerCapture(e.pointerId); } catch (_) {}
            return;
        }

        if (isDrawing) {
            isDrawing = false;
            if (currentStroke) {
                if (['pen', 'eraser'].includes(currentTool)) {
                    if (currentStroke.points.length > 0) {
                        pushHistory();
                        strokes.push(currentStroke);
                    }
                } else {
                    if (currentTool === 'table' && (currentStroke.colWidths[0] < 20 || currentStroke.rowHeights[0] < 20)) {
                        currentStroke = null;
                        render();
                        try { wrapper.releasePointerCapture(e.pointerId); } catch (_) {}
                        return;
                    }
                    if (['rect', 'circle', 'triangle', 'polygon', 'star'].includes(currentTool) && currentStroke.w < 20) {
                        currentStroke = null;
                        render();
                        try { wrapper.releasePointerCapture(e.pointerId); } catch (_) {}
                        return;
                    }
                    pushHistory();
                    strokes.push(currentStroke);
                }
                currentStroke = null;
            }
            render();
            try { wrapper.releasePointerCapture(e.pointerId); } catch (_) {}
        }
    }

    wrapper.addEventListener('pointerdown', startPosition);
    wrapper.addEventListener('pointermove', draw);
    wrapper.addEventListener('pointerup', endPosition);
    wrapper.addEventListener('pointercancel', endPosition);

    wrapper.addEventListener('dblclick', (e) => {
        if (editingInput) return;
        const p = toWorld(e.clientX, e.clientY);
        for (let i = strokes.length - 1; i >= 0; i--) {
            const s = strokes[i];
            if (s.tool === 'table') {
                const w = s.colWidths.reduce((a, b) => a + b, 0);
                const h = s.rowHeights.reduce((a, b) => a + b, 0);
                if (p.x >= s.x && p.x <= s.x + w && p.y >= s.y && p.y <= s.y + h) {
                    let cellX = s.x;
                    let c = 0;
                    while (c < s.colWidths.length - 1 && p.x > cellX + s.colWidths[c]) {
                        cellX += s.colWidths[c];
                        c++;
                    }
                    let cellY = s.y;
                    let r = 0;
                    while (r < s.rowHeights.length - 1 && p.y > cellY + s.rowHeights[r]) {
                        cellY += s.rowHeights[r];
                        r++;
                    }
                    openEditor(s, r, c, false);
                    return;
                }
            } else if (s.tool === 'text') {
                ctx.font = `${s.fontSize || 16}px ${s.fontFamily || 'Manrope, sans-serif'}`;
                const m = ctx.measureText(s.text);
                let bw = Math.max(20, m.width);
                let bh = Math.max(20, s.fontSize * 1.2);
                let bx = s.x, by = s.y;
                if (s.align === 'center') bx -= bw / 2;
                else if (s.align === 'right') bx -= bw;
                
                if (p.x >= bx && p.x <= bx + bw && p.y >= by && p.y <= by + bh) {
                    openEditor(s, 0, 0, false);
                    return;
                }
            }
        }
    });

    wrapper.addEventListener('pointermove', (e) => {
        if (currentTool === 'select' && !isDraggingObject && !isPanning && !isRotating && !isResizingCell) {
            const p = toWorld(e.clientX, e.clientY);
            
            if (getSelectionHandleHit(p)) {
                wrapper.style.cursor = 'grab';
                return;
            }

            if (selectedStroke && selectedStroke.tool === 'table') {
                const s = selectedStroke;
                const threshold = 10 / zoom;
                let hitBorder = false;
                const totalH = s.rowHeights.reduce((a,b)=>a+b, 0);
                const totalW = s.colWidths.reduce((a,b)=>a+b, 0);
                
                let cellX = s.x;
                for (let c = 0; c < s.colWidths.length; c++) {
                    cellX += s.colWidths[c];
                    if (Math.abs(p.x - cellX) < threshold && p.y >= s.y && p.y <= s.y + totalH) {
                        wrapper.style.cursor = 'col-resize';
                        hitBorder = true;
                        break;
                    }
                }
                if (!hitBorder) {
                    let cellY = s.y;
                    for (let r = 0; r < s.rowHeights.length; r++) {
                        cellY += s.rowHeights[r];
                        if (Math.abs(p.y - cellY) < threshold && p.x >= s.x && p.x <= s.x + totalW) {
                            wrapper.style.cursor = 'row-resize';
                            hitBorder = true;
                            break;
                        }
                    }
                }
                if (hitBorder) return;
            }
            
            wrapper.style.cursor = 'default';
        }
    });

    function setTool(tool, btn) {
        currentTool = tool;
        document.querySelectorAll('.sketchpad-btn').forEach(b => {
            if (b.id && b.id.startsWith('tool') && b.id !== 'toolClear') b.classList.remove('active');
        });
        if (btn) btn.classList.add('active');
        wrapper.classList.toggle('tool-eyedropper', tool === 'eyedropper');
        wrapper.classList.toggle('tool-select', tool === 'select');
        
        if (tool !== 'table') tablePopover.classList.remove('active');
        if (tool !== 'polygon' && tool !== 'star') shapeOptions.classList.remove('active');
        if (tool !== 'text') textPanel.classList.remove('active');
        
        if (tool !== 'select') {
            selectedStroke = null;
            render();
        }
    }

    toolSelect.addEventListener('click', () => setTool('select', toolSelect));
    toolPen.addEventListener('click', () => setTool('pen', toolPen));
    toolEraser.addEventListener('click', () => setTool('eraser', toolEraser));
    toolEyedropper.addEventListener('click', () => setTool('eyedropper', toolEyedropper));
    toolRect.addEventListener('click', () => setTool('rect', toolRect));
    toolCircle.addEventListener('click', () => setTool('circle', toolCircle));
    toolTriangle.addEventListener('click', () => setTool('triangle', toolTriangle));
    toolPolygon.addEventListener('click', () => setTool('polygon', toolPolygon));
    toolStar.addEventListener('click', () => setTool('star', toolStar));
    
    toolClear.addEventListener('click', () => {
        clearModal.classList.add('active');
    });

    clearCancel.addEventListener('click', () => {
        clearModal.classList.remove('active');
    });

    clearConfirm.addEventListener('click', () => {
        clearModal.classList.remove('active');
        pushHistory();
        strokes = [];
        selectedStroke = null;
        render();
    });

    customColor.addEventListener('input', (e) => {
        currentColor = e.target.value;
        colorPicker.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        if (currentTool !== 'pen' && currentTool !== 'text' && currentTool !== 'select') setTool('pen', toolPen);
    });

    colorPicker.addEventListener('click', (e) => {
        const swatch = e.target.closest('.color-swatch');
        if (!swatch) return;
        colorPicker.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        currentColor = swatch.dataset.color;
        customColor.value = currentColor;
        if (currentTool !== 'pen' && currentTool !== 'text' && currentTool !== 'select') setTool('pen', toolPen);
    });

    brushSizeInput.addEventListener('input', (e) => {
        currentSize = parseInt(e.target.value, 10);
    });

    function getFileName(ext) {
        let name = fileNameInput.value.trim();
        if (!name) name = 'sketch_' + Date.now();
        return `${name}.${ext}`;
    }

    function download(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function exportImage(type, quality) {
        const b = getContentBounds();
        if (!b) {
            alert('Холст пуст - сначала что-нибудь нарисуйте');
            return;
        }

        const padding = 40;
        const rawW = Math.max(1, (b.maxX - b.minX) + padding * 2);
        const rawH = Math.max(1, (b.maxY - b.minY) + padding * 2);

        const MAX_DIM = 8192;
        const scale = Math.min(1, MAX_DIM / rawW, MAX_DIM / rawH);
        const outW = Math.max(1, Math.round(rawW * scale));
        const outH = Math.max(1, Math.round(rawH * scale));

        const out = document.createElement('canvas');
        out.width = outW;
        out.height = outH;
        const t = out.getContext('2d');

        t.fillStyle = BG_COLOR;
        t.fillRect(0, 0, outW, outH);

        t.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        t.lineWidth = 1;
        t.beginPath();
        
        const gridStep = 20;
        const startXWorld = Math.floor((b.minX - padding) / gridStep) * gridStep;
        const endXWorld = Math.ceil((b.maxX + padding) / gridStep) * gridStep;
        
        for (let x = startXWorld; x <= endXWorld; x += gridStep) {
            const outX = (x - (b.minX - padding)) * scale;
            t.moveTo(outX, 0);
            t.lineTo(outX, outH);
        }
        
        const startYWorld = Math.floor((b.minY - padding) / gridStep) * gridStep;
        const endYWorld = Math.ceil((b.maxY + padding) / gridStep) * gridStep;
        
        for (let y = startYWorld; y <= endYWorld; y += gridStep) {
            const outY = (y - (b.minY - padding)) * scale;
            t.moveTo(0, outY);
            t.lineTo(outW, outY);
        }
        t.stroke();

        t.save();
        t.scale(scale, scale);
        t.translate(-(b.minX - padding), -(b.minY - padding));
        t.lineCap = 'round';
        t.lineJoin = 'round';
        for (const s of strokes) drawStrokeTo(t, s);
        t.restore();

        const ext = type === 'image/jpeg' ? 'jpg' : type.split('/')[1];

        out.toBlob((blob) => {
            if (!blob) {
                alert('Не удалось сохранить файл - попробуйте другой формат');
                return;
            }
            const url = URL.createObjectURL(blob);
            download(url, getFileName(ext));
            setTimeout(() => URL.revokeObjectURL(url), 2000);
        }, type, quality);
    }

    savePng.addEventListener('click', () => exportImage('image/png'));
    saveJpg.addEventListener('click', () => exportImage('image/jpeg', 0.9));
    saveWebp.addEventListener('click', () => exportImage('image/webp', 0.9));

    recordVideo.addEventListener('click', () => {
        if (isRecording) {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            isRecording = false;
            recordVideo.classList.remove('recording-active');
            recordText.textContent = 'Запись';
            recordVideo.querySelector('i').className = 'ph-fill ph-record';
            return;
        }

        if (typeof MediaRecorder === 'undefined' || typeof canvas.captureStream !== 'function') {
            alert('Ваш браузер не поддерживает запись видео с холста');
            return;
        }

        recordedChunks = [];
        const stream = canvas.captureStream(30);
        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                alert('Ваш браузер не поддерживает формат WebM для записи видео');
                return;
            }
        }

        try {
            mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) recordedChunks.push(e.data);
            };
            mediaRecorder.onstop = () => {
                if (recordedChunks.length === 0) {
                    console.warn('Запись пуста - файл не создан');
                    return;
                }
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                if (blob.size === 0) {
                    console.warn('Blob пустой - файл не создан');
                    return;
                }
                const url = URL.createObjectURL(blob);
                download(url, getFileName('webm'));
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            };
            mediaRecorder.start(500);
            isRecording = true;
            recordVideo.classList.add('recording-active');
            recordText.textContent = 'Стоп';
            recordVideo.querySelector('i').className = 'ph-fill ph-stop-circle';
        } catch (err) {
            console.error('Не удалось начать запись:', err);
            alert('Ваш браузер не поддерживает запись видео с холста');
        }
    });

    window.addEventListener('beforeunload', (e) => {
        if (isRecording) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    const ro = new ResizeObserver(() => {
        setupCanvas();
        render();
    });
    ro.observe(wrapper);

    setupCanvas();
    const rect = wrapper.getBoundingClientRect();
    panX = rect.width / 2;
    panY = rect.height / 2;
    zoom = 1;
    render();
}