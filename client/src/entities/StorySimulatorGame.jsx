import { useEffect, useRef, useState } from 'react';
import { Box, Button, Chip, Divider, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CasinoIcon from '@mui/icons-material/Casino';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { resolveRoute } from './storySimulatorParser';

const DICE_FACE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// ─── Chat bubbles ─────────────────────────────────────────────────────────────

function NarratorBubble({ title, text, dimmed }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Paper
                elevation={dimmed ? 0 : 2}
                sx={{
                    maxWidth: '85%',
                    p: 2,
                    bgcolor: dimmed ? 'action.hover' : 'primary.light',
                    color: dimmed ? 'text.secondary' : 'primary.contrastText',
                    borderRadius: '4px 16px 16px 16px',
                    opacity: dimmed ? 0.8 : 1,
                    transition: 'all 0.2s',
                }}
            >
                {title && (
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {title}
                    </Typography>
                )}
                <Typography
                    variant="body2"
                    component="pre"
                    sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.7 }}
                >
                    {text || '(אין טקסט)'}
                </Typography>
            </Paper>
        </Box>
    );
}

function PlayerBubble({ text }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Paper
                elevation={1}
                sx={{
                    maxWidth: '60%',
                    p: 1.5,
                    bgcolor: 'secondary.light',
                    color: 'secondary.contrastText',
                    borderRadius: '16px 4px 16px 16px',
                }}
            >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {text}
                </Typography>
            </Paper>
        </Box>
    );
}

// ─── Interaction panel ────────────────────────────────────────────────────────

function InteractionPanel({ node, onChoice, onDiceNavigate, onAutoAdvance, onRestart }) {
    const [diceRoll, setDiceRoll] = useState(null);
    const [diceTarget, setDiceTarget] = useState(null);
    const [pendingChoiceKey, setPendingChoiceKey] = useState(null);
    const [pendingChoiceText, setPendingChoiceText] = useState(null);

    useEffect(() => {
        setDiceRoll(null);
        setDiceTarget(null);
        setPendingChoiceKey(null);
        setPendingChoiceText(null);
    }, [node.id]);

    const diceRules = node.routingRules.filter((r) => r.diceOptions !== 'NULL');
    const hasDice = diceRules.length > 0;
    // All dice rules are tied to a player choice → choice picks the path, dice picks the variant
    const isChoiceThenDice = hasDice && node.choices.length > 0 && diceRules.every((r) => r.key !== null);
    const isPureDice = hasDice && !isChoiceThenDice;
    const isPureChoice = !hasDice && node.choices.length > 0;
    const hasAutoOnly = !hasDice && node.choices.length === 0 && node.routingRules.some((r) => r.key === null);
    const isEnd = node.routingRules.length === 0;

    function rollDiceForChoice(choiceKey, choiceText) {
        const roll = Math.floor(Math.random() * 6) + 1;
        const target = resolveRoute(node.routingRules, choiceKey, roll);
        setPendingChoiceKey(choiceKey);
        setPendingChoiceText(choiceText);
        setDiceRoll(roll);
        setDiceTarget(target);
    }

    function handlePureDiceRoll() {
        const roll = Math.floor(Math.random() * 6) + 1;
        const target = resolveRoute(node.routingRules, null, roll);
        setDiceRoll(roll);
        setDiceTarget(target);
    }

    if (isEnd) {
        return (
            <Box textAlign="center" py={3}>
                <Typography variant="h6" color="text.secondary">
                    סוף הסיפור
                </Typography>
                <Button onClick={onRestart} startIcon={<RestartAltIcon />} sx={{ mt: 1 }}>
                    שחק שוב
                </Button>
            </Box>
        );
    }

    // Choice + auto-dice: show choices; clicking one auto-rolls and shows result
    if (isChoiceThenDice) {
        if (diceRoll == null) {
            return (
                <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="flex-end">
                    {node.choices.map((choice) => (
                        <Button
                            key={choice.key}
                            variant="outlined"
                            color="secondary"
                            onClick={() => rollDiceForChoice(choice.key, choice.text)}
                            sx={{ borderRadius: 4 }}
                        >
                            {choice.key}. {choice.text}
                        </Button>
                    ))}
                </Stack>
            );
        }
        // After choice + auto-roll: show result
        return (
            <Stack spacing={1} alignItems="flex-end">
                <Typography variant="body2" color="text.secondary">
                    בחרת: {pendingChoiceText}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', minWidth: 160 }}>
                    <Typography variant="h3">{DICE_FACE[diceRoll]}</Typography>
                    <Typography variant="body2">גלגול קובייה: {diceRoll}</Typography>
                    {!diceTarget && (
                        <Typography color="error" variant="caption">
                            לא נמצא יעד לשילוב זה
                        </Typography>
                    )}
                </Paper>
                <Stack direction="row" spacing={1}>
                    <Button
                        size="small"
                        onClick={() => {
                            setDiceRoll(null);
                            setDiceTarget(null);
                        }}
                    >
                        חזור לבחירות
                    </Button>
                    {diceTarget && (
                        <Button
                            variant="contained"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => onDiceNavigate(diceRoll, diceTarget, pendingChoiceText)}
                            sx={{ borderRadius: 4 }}
                        >
                            המשך
                        </Button>
                    )}
                </Stack>
            </Stack>
        );
    }

    // Pure choice: deterministic routing
    if (isPureChoice) {
        return (
            <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="flex-end">
                {node.choices.map((choice) => (
                    <Button
                        key={choice.key}
                        variant="outlined"
                        color="secondary"
                        onClick={() => onChoice(choice.key, choice.text)}
                        sx={{ borderRadius: 4 }}
                    >
                        {choice.key}. {choice.text}
                    </Button>
                ))}
            </Stack>
        );
    }

    // Pure dice: no choice, just roll
    if (isPureDice) {
        return (
            <Stack spacing={1} alignItems="flex-end">
                {diceRoll == null ? (
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<CasinoIcon />}
                        onClick={handlePureDiceRoll}
                        sx={{ borderRadius: 4 }}
                    >
                        גלגל קובייה
                    </Button>
                ) : (
                    <>
                        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', minWidth: 160 }}>
                            <Typography variant="h3">{DICE_FACE[diceRoll]}</Typography>
                            <Typography variant="body2">הטלת {diceRoll}</Typography>
                            {!diceTarget && (
                                <Typography color="error" variant="caption">
                                    לא נמצא יעד לתוצאה זו
                                </Typography>
                            )}
                        </Paper>
                        <Stack direction="row" spacing={1}>
                            <Button
                                size="small"
                                onClick={() => {
                                    setDiceRoll(null);
                                    setDiceTarget(null);
                                }}
                            >
                                הטל שוב
                            </Button>
                            {diceTarget && (
                                <Button
                                    variant="contained"
                                    startIcon={<PlayArrowIcon />}
                                    onClick={() => onDiceNavigate(diceRoll, diceTarget, null)}
                                    sx={{ borderRadius: 4 }}
                                >
                                    המשך
                                </Button>
                            )}
                        </Stack>
                    </>
                )}
            </Stack>
        );
    }

    if (hasAutoOnly) {
        return (
            <Stack direction="row" justifyContent="flex-end">
                <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={onAutoAdvance}
                    sx={{ borderRadius: 4 }}
                >
                    המשך →
                </Button>
            </Stack>
        );
    }

    return null;
}

// ─── Main game component ──────────────────────────────────────────────────────

/**
 * Reusable story simulator component.
 *
 * Props:
 *   nodes       — Map<nodeId, Node> from parseStoryExcel
 *   segments    — Map<segmentId, Segment> from parseStoryExcel
 *   startNodeId — ID of the first node to display
 *   onReset     — called when the player wants to restart / exit
 */
export default function StorySimulatorGame({ nodes, segments, startNodeId, onReset }) {
    // chatHistory: visual chat bubbles for completed turns
    const [chatHistory, setChatHistory] = useState([]);
    // nodeHistory: stack of visited nodeIds for Back navigation
    const [nodeHistory, setNodeHistory] = useState([]);
    const [currentNodeId, setCurrentNodeId] = useState(startNodeId);
    const currentRef = useRef(null);

    useEffect(() => {
        if (currentRef.current) {
            currentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [currentNodeId]);

    const node = nodes[currentNodeId];
    const segment = node ? segments[node.segmentId] : null;

    function navigate(targetNodeId, playerBubbleText) {
        if (!targetNodeId || !nodes[targetNodeId]) return;
        setChatHistory((h) => [
            ...h,
            { type: 'narrator', title: segment?.title, text: segment?.text },
            { type: 'player', text: playerBubbleText },
        ]);
        setNodeHistory((h) => [...h, currentNodeId]);
        setCurrentNodeId(targetNodeId);
    }

    function handleBack() {
        if (!nodeHistory.length) return;
        const prevNodeId = nodeHistory[nodeHistory.length - 1];
        setNodeHistory((h) => h.slice(0, -1));
        setChatHistory((h) => h.slice(0, -2)); // remove last narrator + player bubble
        setCurrentNodeId(prevNodeId);
    }

    function handleChoice(choiceKey, choiceText) {
        const target = resolveRoute(node.routingRules, choiceKey, null);
        if (target) navigate(target, `בחרתי: ${choiceText}`);
    }

    function handleDiceNavigate(roll, target, choiceText) {
        const label = choiceText
            ? `${choiceText} — גלגול ${DICE_FACE[roll]} (${roll})`
            : `הטלתי ${DICE_FACE[roll]} (${roll})`;
        navigate(target, label);
    }

    function handleAutoAdvance() {
        const autoRule = node.routingRules.find((r) => r.key === null && r.diceOptions === 'NULL');
        if (autoRule) navigate(autoRule.targetNodeId, '→');
    }

    if (!node) {
        return (
            <Box p={3} dir="rtl">
                <Typography color="error">צומת לא נמצא: {currentNodeId}</Typography>
                <Button onClick={onReset} startIcon={<RestartAltIcon />} sx={{ mt: 2 }}>
                    חזור להתחלה
                </Button>
            </Box>
        );
    }

    return (
        <Box dir="rtl" sx={{ maxWidth: 720, mx: 'auto', p: 2 }}>
            {/* Top bar */}
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                mb={2}
                position="sticky"
                top={0}
                zIndex={10}
                bgcolor="background.default"
                py={1}
            >
                <Stack direction="row" spacing={1} alignItems="center">
                    <Tooltip title="חזור">
                        <span>
                            <IconButton onClick={handleBack} disabled={nodeHistory.length === 0} size="small">
                                <ArrowBackIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Chip label={`רמה ${node.level}`} size="small" color="primary" />
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

            {/* Chat history */}
            {chatHistory.length > 0 && (
                <Stack spacing={1.5} mb={2}>
                    {chatHistory.map((item, i) =>
                        item.type === 'narrator' ? (
                            <NarratorBubble key={i} title={item.title} text={item.text} dimmed />
                        ) : (
                            <PlayerBubble key={i} text={item.text} />
                        ),
                    )}
                    <Divider sx={{ my: 1 }} />
                </Stack>
            )}

            {/* Current section — scroll target */}
            <Box ref={currentRef} sx={{ scrollMarginTop: 56 }}>
                <NarratorBubble title={segment?.title} text={segment?.text} dimmed={false} />
                <Box mt={2}>
                    <InteractionPanel
                        node={node}
                        onChoice={handleChoice}
                        onDiceNavigate={handleDiceNavigate}
                        onAutoAdvance={handleAutoAdvance}
                        onRestart={onReset}
                    />
                </Box>
            </Box>
        </Box>
    );
}
