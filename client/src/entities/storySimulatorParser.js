import * as XLSX from 'xlsx';

function cleanId(str) {
    return (str || '').toString().trim().replace(/[^a-zA-Z0-9_א-ת]/g, '_');
}

function parseTargetString(rawStr, aliasMap) {
    const str = (rawStr || '').toString().trim();
    if (!str) return [];

    let results = [];

    const knownPatterns = [
        { test: s => s.includes('ג1') && s.includes('ג3'), targets: [['NODE_G_1','1,2'],['NODE_G_2','3,4'],['NODE_G_3','5,6']] },
        { test: s => s.includes('ג4') && s.includes('ג6'), targets: [['NODE_G_4','1,2'],['NODE_G_5','3,4'],['NODE_G_6','5,6']] },
        { test: s => s.includes('ג7') && s.includes('ג9'), targets: [['NODE_G_7','1,2'],['NODE_G_8','3,4'],['NODE_G_9','5,6']] },
    ];

    const known = knownPatterns.find(p => p.test(str));
    if (known) {
        results = known.targets.map(([target, diceOptions]) => ({ target, diceOptions }));
    } else if (str.includes('=>')) {
        results = str.split(';').map(part => {
            const sides = part.split('=>');
            if (sides.length < 2) return null;
            const cond = sides[0].trim();
            const target = sides[1].trim();
            let diceOptions = 'NULL';
            if (cond.includes('אי-זוגי') || cond.includes('אי זוגי') || cond.includes('1/3/5')) {
                diceOptions = '1,3,5';
            } else if (cond.includes('זוגי') || cond.includes('2/4/6')) {
                diceOptions = '2,4,6';
            } else {
                diceOptions = cond.replace(/-/g, ',');
            }
            return { target, diceOptions };
        }).filter(Boolean);
    } else {
        results = [{ target: str, diceOptions: 'NULL' }];
    }

    return results.map(r => {
        const cleaned = cleanId(r.target);
        return { ...r, target: aliasMap[cleaned] || r.target };
    });
}

export function resolveRoute(routingRules, choiceKey, diceRoll) {
    const diceNums = diceRoll != null ? [diceRoll] : null;

    // Combined choice + dice (e.g. NODE_5_x): match both key and dice range
    if (choiceKey != null && diceNums != null) {
        const match = routingRules.find(r =>
            r.key === choiceKey &&
            r.diceOptions !== 'NULL' &&
            r.diceOptions.split(',').map(Number).some(n => diceNums.includes(n))
        );
        return match?.targetNodeId ?? null;
    }
    // Pure dice: key is null, match only on dice range
    if (diceNums != null) {
        const match = routingRules.find(r =>
            r.diceOptions !== 'NULL' &&
            r.diceOptions.split(',').map(Number).some(n => diceNums.includes(n))
        );
        return match?.targetNodeId ?? null;
    }
    // Pure choice: deterministic target (diceOptions must be NULL)
    if (choiceKey != null) {
        const match = routingRules.find(r => r.key === choiceKey && r.diceOptions === 'NULL');
        return match?.targetNodeId ?? null;
    }
    return null;
}

export async function parseStoryExcel(file) {
    const bstr = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsBinaryString(file);
    });

    const wb = XLSX.read(bstr, { type: 'binary', defval: '' });

    const flowSheet = wb.Sheets['זרימה_מרכזית'] ?? wb.Sheets[wb.SheetNames[0]];
    const segSheet = wb.Sheets['קטעי_כתיבה'] ?? wb.Sheets[wb.SheetNames[1]];

    const flowRows = XLSX.utils.sheet_to_json(flowSheet, { defval: '' });
    const segRows = XLSX.utils.sheet_to_json(segSheet, { defval: '' });

    // Pass 1 — alias map (Segment_ID → Node_ID)
    const aliasMap = {};
    flowRows.forEach(row => {
        const nodeId = cleanId(row['Node_ID']);
        const segId = cleanId(row['Segment_ID']);
        if (nodeId && segId && nodeId !== segId) aliasMap[segId] = nodeId;
    });

    // Pass 2 — nodes from Sheet 1
    const nodes = {};
    flowRows.forEach(row => {
        const nodeId = (row['Node_ID'] || '').toString().trim();
        if (!nodeId) return;

        const rawChoices = [
            { key: 1, text: row['בחירה 1'], target: row['יעד 1'] },
            { key: 2, text: row['בחירה 2'], target: row['יעד 2'] },
            { key: 3, text: row['בחירה 3'], target: row['יעד 3'] },
        ];

        const choices = [];
        const routingRules = [];

        rawChoices.forEach(c => {
            const text = (c.text || '').toString().trim();
            const target = (c.target || '').toString().trim();
            if (!target) return;

            const isAuto = text === '' || text.includes('מעבר אוטומטי');
            if (!isAuto && text) choices.push({ key: c.key, text });

            parseTargetString(target, aliasMap).forEach(route => {
                routingRules.push({
                    key: isAuto ? null : c.key,
                    diceOptions: route.diceOptions,
                    targetNodeId: route.target,
                });
            });
        });

        const autoTarget = (row['יעד קבוע'] || row['מקטע יעד'] || '').toString().trim();
        if (autoTarget) {
            parseTargetString(autoTarget, aliasMap).forEach(route => {
                routingRules.push({ key: null, diceOptions: route.diceOptions, targetNodeId: route.target });
            });
        }

        const diceOdd = (row['קובייה אי-זוגית 1/3/5'] || '').toString().trim();
        const diceEven = (row['קובייה זוגית 2/4/6'] || '').toString().trim();
        if (diceOdd) parseTargetString(diceOdd, aliasMap).forEach(r => routingRules.push({ key: null, diceOptions: '1,3,5', targetNodeId: r.target }));
        if (diceEven) parseTargetString(diceEven, aliasMap).forEach(r => routingRules.push({ key: null, diceOptions: '2,4,6', targetNodeId: r.target }));

        nodes[nodeId] = {
            nodeId,
            segmentId: (row['Segment_ID'] || '').toString().trim(),
            level: Number(row['רמה']) || 0,
            type: (row['סוג'] || '').toString().trim() === 'מצב טכני' ? 'SYSTEM_NODE' : 'REGULAR_NODE',
            title: (row['תווית בשרטוט'] || nodeId).toString().trim(),
            choices,
            routingRules,
        };
    });

    // Pass 3 — segments from Sheet 2 (content only, no routing)
    const segments = {};
    segRows.forEach(row => {
        const segmentId = (row['Segment_ID'] || '').toString().trim();
        if (!segmentId) return;
        segments[segmentId] = {
            segmentId,
            title: (row['כותרת'] || row['תווית בשרטוט'] || '').toString().trim(),
            text: (row['טקסט להקראה'] || '').toString().trim(),
        };
    });

    const startNodeId =
        flowRows.find(r => r['Node_ID'] && Number(r['רמה']) === 1)?.['Node_ID'] ??
        flowRows.find(r => r['Node_ID'])?.['Node_ID'];

    return { nodes, segments, startNodeId };
}
