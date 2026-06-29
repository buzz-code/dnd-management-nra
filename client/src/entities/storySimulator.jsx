import * as XLSX from 'xlsx';
import { useState } from 'react';
import { Title } from 'react-admin';
import {
    Box, Button, Card, CardContent, CardActions, Chip, CircularProgress,
    Divider, Typography, Stack, Paper, IconButton, Tooltip,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CasinoIcon from '@mui/icons-material/Casino';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

// ─── Parser ────────────────────────────────────────────────────────────────────

function cleanId(str) {
    return (str || '').toString().trim().replace(/[^a-zA-Z0-9_א-ת]/g, '_');
}

function parseTargetString(rawStr, aliasMap) {
    const str = (rawStr || '').toString().trim();
    if (!str) return [];

    let results = [];

    // Known free-text dice patterns (e.g. "ג1-ג3")
    const knownPatterns = [
        { test: s => s.includes('ג1') && s.includes('ג3'), targets: [['NODE_G_1','1,2'],['NODE_G_2','3,4'],['NODE_G_3','5,6']] },
        { test: s => s.includes('ג4') && s.includes('ג6'), targets: [['NODE_G_4','1,2'],['NODE_G_5','3,4'],['NODE_G_6','5,6']] },
        { test: s => s.includes('ג7') && s.includes('ג9'), targets: [['NODE_G_7','1,2'],['NODE_G_8','3,4'],['NODE_G_9','5,6']] },
    ];
    const known = knownPatterns.find(p => p.test(str));
    if (known) {
        results = known.targets.map(([target, diceOptions]) => ({ target, diceOptions }));
    } else if (str.includes('=>')) {
        // Arrow format: "1-2=>NODE_X; 3-4=>NODE_Y"
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
                // "1-2" → "1,2"
                diceOptions = cond.replace(/-/g, ',');
            }
            return { target, diceOptions };
        }).filter(Boolean);
    } else {
        results = [{ target: str, diceOptions: 'NULL' }];
    }

    // Resolve aliases (SEG_xxx → NODE_xxx)
    return results.map(r => {
        const cleaned = cleanId(r.target);
        return { ...r, target: aliasMap[cleaned] || r.target };
    });
}

async function parseStoryExcel(file) {
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

    // Pass 1 — build alias map (Segment_ID → Node_ID)
    const aliasMap = {};
    flowRows.forEach(row => {
        const nodeId = cleanId(row['Node_ID']);
        const segId = cleanId(row['Segment_ID']);
        if (nodeId && segId && nodeId !== segId) {
            aliasMap[segId] = nodeId;
        }
    });

    // Pass 2 — build nodes from Sheet 1
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
            if (!isAuto && text) {
                choices.push({ key: c.key, text });
            }

            parseTargetString(target, aliasMap).forEach(route => {
                routingRules.push({
                    key: isAuto ? null : c.key,
                    diceOptions: route.diceOptions,
                    targetNodeId: route.target,
                });
            });
        });

        // Fallback auto-transition columns
        const autoTarget = (row['יעד קבוע'] || row['מקטע יעד'] || '').toString().trim();
        if (autoTarget) {
            parseTargetString(autoTarget, aliasMap).forEach(route => {
                routingRules.push({ key: null, diceOptions: route.diceOptions, targetNodeId: route.target });
            });
        }

        // Explicit odd/even dice columns
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

    // Pass 3 — build segments from Sheet 2 (content only)
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

// ─── Simulator Game ─────────────────────────────────────────────────────────

function resolveRoute(routingRules, choiceKey, diceRoll) {
    // diceRoll mode
    if (diceRoll != null) {
        const match = routingRules.find(r => {
            if (r.diceOptions === 'NULL') return false;
            const nums = r.diceOptions.split(',').map(Number);
            return nums.includes(diceRoll);
        });
        return match?.targetNodeId ?? null;
    }
    // choice key mode
    if (choiceKey != null) {
        const match = routingRules.find(r => r.key === choiceKey && r.diceOptions === 'NULL');
        return match?.targetNodeId ?? null;
    }
    return null;
}

function SimulatorGame({ nodes, segments, startNodeId, onReset }) {
    const [currentNodeId, setCurrentNodeId] = useState(startNodeId);
    const [history, setHistory] = useState([]);
    const [diceRoll, setDiceRoll] = useState(null);
    const [diceTarget, setDiceTarget] = useState(null);

    const node = nodes[currentNodeId];
    const segment = node ? segments[node.segmentId] : null;

    function navigate(targetNodeId) {
        if (!targetNodeId || !nodes[targetNodeId]) return;
        setHistory(h => [...h, currentNodeId]);
        setCurrentNodeId(targetNodeId);
        setDiceRoll(null);
        setDiceTarget(null);
    }

    function goBack() {
        if (!history.length) return;
        const prev = history[history.length - 1];
        setHistory(h => h.slice(0, -1));
        setCurrentNodeId(prev);
        setDiceRoll(null);
        setDiceTarget(null);
    }

    function handleChoice(choiceKey) {
        const target = resolveRoute(node.routingRules, choiceKey, null);
        if (target) navigate(target);
    }

    function handleDiceRoll() {
        const roll = Math.floor(Math.random() * 6) + 1;
        const target = resolveRoute(node.routingRules, null, roll);
        setDiceRoll(roll);
        setDiceTarget(target);
    }

    function handleDiceContinue() {
        if (diceTarget) navigate(diceTarget);
    }

    function handleAutoAdvance() {
        const autoRule = node.routingRules.find(r => r.key === null && r.diceOptions === 'NULL');
        if (autoRule) navigate(autoRule.targetNodeId);
    }

    if (!node) {
        return (
            <Box p={3}>
                <Typography color="error">צומת לא נמצא: {currentNodeId}</Typography>
                <Button onClick={onReset} startIcon={<RestartAltIcon />} sx={{ mt: 2 }}>חזור להתחלה</Button>
            </Box>
        );
    }

    const hasDice = node.routingRules.some(r => r.diceOptions !== 'NULL');
    const hasChoices = node.choices.length > 0 && !hasDice;
    const hasAutoOnly = !hasDice && node.choices.length === 0 && node.routingRules.some(r => r.key === null);
    const isEnd = node.routingRules.length === 0;

    const diceEmojis = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

    return (
        <Box dir="rtl" sx={{ maxWidth: 760, mx: 'auto', p: 2 }}>
            {/* Top bar */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Tooltip title="חזור">
                        <span>
                            <IconButton onClick={goBack} disabled={!history.length} size="small">
                                <ArrowBackIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Chip label={`רמה ${node.level}`} size="small" color="primary" />
                    <Chip label={node.type === 'SYSTEM_NODE' ? 'מצב טכני' : 'צומת'} size="small" variant="outlined" />
                </Stack>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                    {node.title}
                </Typography>
                <Tooltip title="אפס משחק">
                    <IconButton onClick={onReset} size="small">
                        <RestartAltIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>

            {/* Narrative card */}
            <Card elevation={3}>
                <CardContent>
                    {segment?.title && (
                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                            {segment.title}
                        </Typography>
                    )}
                    <Divider sx={{ mb: 2 }} />
                    <Typography
                        variant="body1"
                        component="pre"
                        sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.8 }}
                    >
                        {segment?.text || '(אין טקסט למקטע זה)'}
                    </Typography>
                </CardContent>

                <CardActions sx={{ flexDirection: 'column', alignItems: 'stretch', p: 2, gap: 1 }}>
                    {/* Choices */}
                    {hasChoices && node.choices.map(choice => (
                        <Button
                            key={choice.key}
                            variant="outlined"
                            fullWidth
                            onClick={() => handleChoice(choice.key)}
                            sx={{ justifyContent: 'flex-start', textAlign: 'right' }}
                        >
                            {choice.key}. {choice.text}
                        </Button>
                    ))}

                    {/* Dice */}
                    {hasDice && (
                        <Box>
                            {diceRoll == null ? (
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    fullWidth
                                    startIcon={<CasinoIcon />}
                                    onClick={handleDiceRoll}
                                >
                                    גלגל קובייה
                                </Button>
                            ) : (
                                <Stack spacing={1}>
                                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="h3">{diceEmojis[diceRoll]}</Typography>
                                        <Typography variant="h6">הטלת {diceRoll}</Typography>
                                        {!diceTarget && (
                                            <Typography color="error" variant="caption">לא נמצא יעד לתוצאה זו</Typography>
                                        )}
                                    </Paper>
                                    {diceTarget && (
                                        <Button variant="contained" fullWidth onClick={handleDiceContinue} startIcon={<PlayArrowIcon />}>
                                            המשך
                                        </Button>
                                    )}
                                    <Button variant="text" size="small" onClick={() => { setDiceRoll(null); setDiceTarget(null); }}>
                                        הטל שוב
                                    </Button>
                                </Stack>
                            )}
                        </Box>
                    )}

                    {/* Auto-transition */}
                    {hasAutoOnly && (
                        <Button variant="contained" fullWidth onClick={handleAutoAdvance} startIcon={<PlayArrowIcon />}>
                            המשך →
                        </Button>
                    )}

                    {/* End */}
                    {isEnd && (
                        <Box textAlign="center" py={2}>
                            <Typography variant="h6" color="text.secondary">סוף הסיפור</Typography>
                            <Button onClick={onReset} startIcon={<RestartAltIcon />} sx={{ mt: 1 }}>
                                שחק שוב
                            </Button>
                        </Box>
                    )}
                </CardActions>
            </Card>
        </Box>
    );
}

// ─── Upload Stage ────────────────────────────────────────────────────────────

function SimulatorUpload({ onLoaded }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function handleFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        setError(null);
        try {
            const data = await parseStoryExcel(file);
            onLoaded(data);
        } catch (err) {
            setError(err.message || 'שגיאה בפענוח הקובץ');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            minHeight="60vh"
            dir="rtl"
        >
            <Card sx={{ maxWidth: 480, width: '100%', textAlign: 'center', p: 4 }}>
                <CardContent>
                    <UploadFileIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>סימולטור סיפור</Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        בחר קובץ Excel של מפת הסיפור (.xlsx) כדי להתחיל
                    </Typography>
                    {loading ? (
                        <CircularProgress />
                    ) : (
                        <Button
                            variant="contained"
                            size="large"
                            component="label"
                            startIcon={<UploadFileIcon />}
                        >
                            בחר קובץ
                            <input type="file" accept=".xlsx,.xls" hidden onChange={handleFile} />
                        </Button>
                    )}
                    {error && (
                        <Typography color="error" mt={2} variant="body2">{error}</Typography>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}

// ─── Loaded Stage ────────────────────────────────────────────────────────────

function SimulatorLoaded({ data, onStart, onReset }) {
    const { nodes, segments, startNodeId } = data;
    const nodeCount = Object.keys(nodes).length;
    const segCount = Object.keys(segments).length;
    const startNode = nodes[startNodeId];
    const startSegment = startNode ? segments[startNode.segmentId] : null;

    return (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight="60vh" dir="rtl">
            <Card sx={{ maxWidth: 480, width: '100%', p: 3 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom>הקובץ נטען בהצלחה</Typography>
                    {startSegment?.title && (
                        <Typography variant="h6" color="primary" gutterBottom>{startSegment.title}</Typography>
                    )}
                    <Divider sx={{ my: 2 }} />
                    <Stack spacing={1} mb={3}>
                        <Stack direction="row" spacing={1}>
                            <Chip label={`${nodeCount} צמתים`} color="primary" />
                            <Chip label={`${segCount} מקטעים`} color="secondary" />
                        </Stack>
                        {startNodeId && (
                            <Typography variant="body2" color="text.secondary">
                                נקודת כניסה: <strong>{startNodeId}</strong>
                            </Typography>
                        )}
                    </Stack>
                </CardContent>
                <CardActions sx={{ flexDirection: 'column', gap: 1, px: 2, pb: 2 }}>
                    <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        startIcon={<PlayArrowIcon />}
                        onClick={onStart}
                        disabled={!startNodeId}
                    >
                        התחל משחק
                    </Button>
                    <Button variant="text" fullWidth onClick={onReset} startIcon={<UploadFileIcon />}>
                        טען קובץ אחר
                    </Button>
                </CardActions>
            </Card>
        </Box>
    );
}

// ─── Page Root ───────────────────────────────────────────────────────────────

export default function StorySimulatorPage() {
    const [stage, setStage] = useState('upload'); // 'upload' | 'loaded' | 'playing'
    const [data, setData] = useState(null);

    function handleLoaded(parsed) {
        setData(parsed);
        setStage('loaded');
    }

    function handleStart() {
        setStage('playing');
    }

    function handleReset() {
        setData(null);
        setStage('upload');
    }

    return (
        <Box>
            <Title title="סימולטור סיפור" />
            {stage === 'upload' && <SimulatorUpload onLoaded={handleLoaded} />}
            {stage === 'loaded' && <SimulatorLoaded data={data} onStart={handleStart} onReset={handleReset} />}
            {stage === 'playing' && (
                <SimulatorGame
                    nodes={data.nodes}
                    segments={data.segments}
                    startNodeId={data.startNodeId}
                    onReset={handleReset}
                />
            )}
        </Box>
    );
}
