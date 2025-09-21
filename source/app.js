import React, {useLayoutEffect} from 'react';
import {Text, Box, useInput, useStdout, useApp, Newline} from 'ink';
import TextInput from 'ink-text-input-2';
import {Spinner, Alert} from '@inkjs/ui';
import chalk from 'chalk';
import Gradient from 'ink-gradient';
import {proxy, useSnapshot} from 'valtio';
import random from 'just-random';
import {formatISO} from 'date-fns';
import {
	getBorderColor,
	getDefaultSuite,
	getHaLeft,
	getRobotBorderColor,
	getStatusVariant,
	getMessageOrPlaceholder,
	isFinished,
	isWordTyped,
	calculateWPM,
	getTypingWord,
	getRemainingPart,
	getWpmTextColor,
	calculateCPS,
	calculateCPM,
	getBestResult,
	getScoreTextColor,
	getCompetitionResult,
	registerResult,
	registerBestFrames,
	getBestFrames,
	getOpponentFrames,
	getSuiteByTopic,
	getHaCount,
	isLastNum,
} from './helpers.js';
import {maxHandicapCount, numerics, optionKeyColor} from './constants.js';
import Results from './Results.js';
import {config} from './config.js';
import Menu from './Menu.js';
import {exitNow} from './cli.js';

const currentTime = () => Date.now();

const state = proxy({
	status: 'PAUSED',
	topic: null,
	suite: getDefaultSuite(),
	source: null,
	firstPart: '',
	highlightedPart: '',
	erroredPart: '',
	highlightingColor: 'green',
	showOkCancelQuestion: false,
	gameOver: false,
	okCancelMessage: '',
	startTime: null,
	finishTime: null,
	wordCount: 0,
	charCount: 0,
	robotWordCount: 0,
	robotCharCount: 0,
	robotText: '',
	userText: '',
	printedByUserText: '',
	handicap: false,
	handicapCount: 0,
	inputHandicapCount: '',
	usingBestResult: false,
	isAgainstMyselft: false,
	nextAndRemaining: '',
	intervalId: null,
	level: 'medium',
	wpm: 0,
	cpm: 0,
	robotWpm: 0,
	robotCpm: 0,
	handicappedWpm: 0,
	cps: 0,
	robotCps: 0,
	bestRslt: null,
	passed: 0,
	frms: [],
	opponentFrames: [],
	outgoingFrames: [],
	timerValue: 0,
	isTimerVisible: true,
	timerVisibilityCounter: 0,
	isAnimatingEnd: false,
	showGameResult: false,
	topN: undefined,
});

export default function App({
	robotLevel,
	topic,
	handicap,
	handicapCount,
	displayResults = false,
	sortBy,
	isShowAllHistory,
	isCompactFormat,
	isCompetingAgainstBestResult,
	topN,
}) {
	const snap = useSnapshot(state);
	const {stdout} = useStdout();
	const {exit} = useApp();

	useLayoutEffect(() => {
		if (displayResults) {
			state.status = 'RESULTS';
		} else if (handicap && handicapCount > maxHandicapCount) {
			state.status = 'QUESTION';
		}

		if (isCompetingAgainstBestResult) {
			state.isAgainstMyselft = true;
		}

		if (topN) {
			state.topN = topN;
		}

		if (topic) {
			state.topic = topic;
			state.suite = getSuiteByTopic(topic);
		}
	}, [
		displayResults,
		isCompetingAgainstBestResult,
		topN,
		topic,
		handicap,
		handicapCount,
	]);

	useInput(
		(input, key) => {
			if (state.status === 'QUESTION') {
				if (numerics.includes(input)) {
					state.inputHandicapCount += input;
				} else if (key.backspace) {
					if (state.inputHandicapCount.length > 0) {
						state.inputHandicapCount = state.inputHandicapCount.slice(0, -1);
					}
				} else if (key.return) {
					state.status = 'PAUSED';
				}

				return;
			}

			if (input === 'y') {
				const foundBestResult = getBestResult();
				if (foundBestResult) {
					state.bestRslt = foundBestResult.value;
				}

				if (snap.isAgainstMyselft) {
					const bestFrames = getBestFrames();
					if (foundBestResult && bestFrames) {
						state.usingBestResult = true;
						state.opponentFrames = bestFrames;
					} else {
						state.showOkCancelQuestion = true;
						state.okCancelMessage = `There is no registered value with the best result. Do you want to compete against robot now?`;
					}
				} else {
					state.level = robotLevel || 'medium';
					state.opponentFrames = getOpponentFrames({robotLevel: state.level});
					state.usingBestResult = false;
				}

				const currentRoundSentences = random(state.suite.sentences);
				const currentHaCount = getHaCount(
					handicapCount,
					state.inputHandicapCount,
				);
				const initFirstPart = handicap
					? getHaLeft(currentRoundSentences, currentHaCount)
					: '';

				state.userText = initFirstPart;
				state.printedByUserText = '';
				state.handicap = handicap;
				state.handicapCount = currentHaCount;
				state.robotText = '';
				state.source = currentRoundSentences;
				state.firstPart = initFirstPart;
				state.highlightedPart = '';
				state.erroredPart = '';
				state.startTime = currentTime();
				state.finishTime = null;
				state.wordCount = 0;
				state.robotWordCount = 0;
				state.wpm = 0;
				state.cpm = 0;
				state.charCount = 0;
				state.robotWpm = 0;
				state.robotCpm = 0;
				state.frms = [];
				state.outgoingFrames = [];
				state.timerValue = 0;
				state.timerVisibilityCounter = 0;
				state.isTimerVisible = true;
				state.showGameResult = false;
				state.gameOver = false;
				if (state.showOkCancelQuestion) return;

				state.status = 'RUNNING';
				const interval = setInterval(() => {
					const now = currentTime();
					const isFinished =
						state.userText === state.source || state.robotText === state.source;

					let newRobotText;
					const incrTimes = 1;
					const passedMs = now - state.startTime;

					if (!isFinished) {
						state.cpm = calculateCPM(state.charCount, state.startTime, now);
						state.robotWpm = calculateWPM(
							state.robotWordCount,
							state.startTime,
							now,
							isFinished,
						);
						state.robotCps = calculateCPS(
							state.robotCharCount,
							state.startTime,
							now,
						);

						const isRobotLastChar = state.source === state.robotText;
						state.robotCpm =
							state.usingBestResult && isRobotLastChar
								? state.bestRslt.cpm
								: calculateCPM(state.robotText.length, state.startTime, now);

						state.timerValue = Math.round(passedMs / 1000);
						let isRightChanging = false;
						if (passedMs / 1000 >= 53) {
							if (state.timerVisibilityCounter === 60) {
								state.isTimerVisible = !state.isTimerVisible;
								state.timerVisibilityCounter = 0;
							} else {
								state.timerVisibilityCounter++;
							}
						}

						const nextFrame = state.opponentFrames[state.outgoingFrames.length];

						if (now - state.startTime >= nextFrame) {
							isRightChanging = true;
							state.outgoingFrames.push(nextFrame);
						}

						if (isRightChanging) {
							newRobotText =
								state.robotText +
								state.source.slice(
									state.robotText.length,
									state.robotText.length + incrTimes,
								);
							state.robotText = newRobotText;
							state.robotCharCount += incrTimes;
							if (isWordTyped(state.source, newRobotText)) {
								const newRobotWordCount = state.robotWordCount + 1;
								state.robotWordCount = newRobotWordCount;
							}

							state.robotCharCount++;
						}

						if (passedMs >= 60_000) {
							state.wpm = calculateWPM(
								state.wordCount,
								state.startTime,
								now,
								isFinished,
							);
							const entryValue = {
								wpm: state.wpm,
								cps: state.cps,
								cpm: state.cpm,
								chars: state.source.length,
								passedSeconds: (now - state.startTime) / 1000,
								passedMs: now - state.startTime,
							};

							state.status = getCompetitionResult(
								state.userText,
								state.robotText,
							);
							state.finishTime = now;
							config.addEntry({[formatISO(new Date())]: entryValue});
							if (
								!state.bestRslt ||
								(state.bestRslt && state.cpm > state.bestRslt.cpm)
							) {
								registerBestFrames(config, state.frms);
							}

							state.isAnimatingEnd = true;
							state.gameOver = true;
							state.showGameResult = true;
							clearInterval(interval);
							const animatingInterval = setInterval(() => {
								state.showGameResult = !state.showGameResult;
								if ((Date.now() - state.startTime) / 1000 >= 62) {
									state.showGameResult = true;
									state.isAnimatingEnd = false;
									clearInterval(animatingInterval);
								}
							}, 300);
						}
					}
				}, 1);
				state.intervalId = interval;
			} else if (input === 'r') {
				state.status = 'RESULTS';
			} else if (input === 'q') {
				exit();
				exitNow();
			} else if (key.return && state.showOkCancelQuestion) {
				state.isAgainstMyselft = false;
				state.showOkCancelQuestion = false;
			}
		},
		{isActive: state.status !== 'RUNNING'},
	);

	useInput(
		(input, _key) => {
			if (input === 'r') {
				state.status = 'RESULTS';
			}
		},
		{
			isActive: state.status !== 'RESULTS' && state.status !== 'RUNNING',
		},
	);
	if (snap.status === 'QUESTION') {
		return (
			<Text>
				Handicap count was exceeded max value ({maxHandicapCount}), please
				specify another one.
				<Newline />
				<TextInput
					value={snap.inputHandicapCount}
					onChange={value => {
						if (isLastNum(value)) {
							state.inputHandicapCount = value;
							state.handicapCount = Number(value);
						}
					}}
				/>
				{/* {snap.inputHandicapCount === '' ? (
					<TextInput
						value={snap.inputHandicapCount}
						onChange={value => {
							if (isLastNum(value)) {
								state.inputHandicapCount = value;
							}
						}}
					/>
				) : (
					<Text>{snap.inputHandicapCount}</Text>
				)} */}
			</Text>
		);
	}

	if (snap.status === 'RESULTS') {
		return (
			<Results
				sortBy={sortBy}
				isShowAllHistory={isShowAllHistory}
				isCompactFormat={isCompactFormat}
				topN={topN}
			/>
		);
	}

	return snap.status === 'PAUSED' ? (
		<Box flexDirection="column" alignItems="center">
			<Box marginY={2} flexDirection="column" justifyContent="center">
				<Gradient name="rainbow">
					<Text>TYPING-GAME-CLI</Text>
				</Gradient>
			</Box>
			{snap.showOkCancelQuestion ? (
				<Box flexDirection="column" alignItems="center" rowGap={1}>
					<Text>{snap.okCancelMessage}</Text>
					<Text backgroundColor="green">
						OK [<Text bold>Enter</Text>]
					</Text>
					<Menu />
				</Box>
			) : snap.isAgainstMyselft ? (
				<Box flexDirection="column" alignItems="center">
					<Box flexDirection="column">
						<Text>
							You are going to compete against your best result (according to
							cpm).
						</Text>
					</Box>
					<Menu />
				</Box>
			) : (
				<Box
					rowGap={1}
					flexDirection="column"
					justifyContent="center"
					alignItems="center"
				>
					<Text>Typer-robot challenges you: who will type a text faster?</Text>
					<Text>Duration of a round is 1 minute.</Text>
					<Box justifyContent="flex-start" flexDirection="column">
						<Text>
							Press{' '}
							<Text bold color={optionKeyColor}>
								y
							</Text>{' '}
							if you want to accept a challenge and start a round.
						</Text>
						<Text>
							Press{' '}
							<Text bold color={optionKeyColor}>
								r
							</Text>{' '}
							to show your results.
						</Text>
						<Text>
							Press{' '}
							<Text bold color={optionKeyColor}>
								q
							</Text>{' '}
							to quit.
						</Text>
					</Box>
				</Box>
			)}
		</Box>
	) : (
		<Box width="100%" flexDirection="column" alignItems="center">
			{isFinished(snap.status) ? (
				<Box
					flexDirection="column"
					alignItems="center"
					justifyContent="center"
					marginBottom={1}
				>
					<Alert variant={getStatusVariant(snap.status)}>
						{getMessageOrPlaceholder(snap.status, {
							againstMyself: snap.usingBestResult,
							asPlaceholder: !snap.showGameResult,
						})}
					</Alert>
				</Box>
			) : (
				<Box justifyContent="space-between" paddingBottom={1}>
					<Box
						marginBottom={1}
						borderStyle="single"
						alignItems="center"
						justifyContent="center"
					>
						<Spinner />
						<Text> Running </Text>
						<Text color={snap.isTimerVisible ? 'yellow' : 'blue'}>
							{snap.isTimerVisible
								? snap.timerValue.toString().padStart(2, '0')
								: '  '}
						</Text>
					</Box>
				</Box>
			)}
			<Box
				height={3}
				alignItems="center"
				marginBottom={1}
				paddingX={2}
				flexDirection="row"
			>
				<Text>
					{chalk.gray(snap.firstPart)}
					{snap.erroredPart && chalk.bgRed(snap.erroredPart)}
					{chalk.bold.cyan(
						getTypingWord(
							state.source,
							snap.firstPart,
							snap.erroredPart !== '',
						),
					)}
					{getRemainingPart(
						state.source,
						snap.firstPart,
						snap.erroredPart !== '',
					)}
				</Text>
			</Box>
			<Box alignItems="center" justifyContent="center" flexDirection="row">
				<Box
					width={stdout.columns / 2.05}
					alignItems="center"
					flexDirection="column"
				>
					<Box marginTop={1}>
						<Text>You</Text>
					</Box>
					<Box
						width="97%"
						borderStyle="single"
						borderColor={getBorderColor(snap.status)}
					>
						{isFinished(snap.status) ? (
							<Text color={snap.gameOver ? 'gray' : ''}>{snap.userText}</Text>
						) : (
							<TextInput
								value={snap.userText}
								onChange={value => {
									if (snap.source.indexOf(value) === 0) {
										if (snap.userText.length < value.length) {
											const now = currentTime();
											const actualPrinted = state.handicap
												? value.slice(
														getHaLeft(state.source, state.handicapCount).length,
													)
												: value;
											state.firstPart = value;
											state.erroredPart = '';
											state.userText = value;
											state.printedByUserText = actualPrinted;
											state.charCount = actualPrinted.length;
											state.cps = calculateCPS(
												actualPrinted.length,
												snap.startTime,
												now,
											);
											const newWordCount = state.wordCount + 1;

											if (isWordTyped(snap.source, value)) {
												state.wordCount = newWordCount;
												state.wpm = calculateWPM(
													newWordCount,
													snap.startTime,
													now,
													snap.source === value,
												);
												state.handicappedWpm = calculateWPM(
													newWordCount + snap.handicapCount,
													snap.startTime,
													now,
													snap.source === value,
												);
											}

											state.frms.push(now - state.startTime);

											if (snap.source === value) {
												if (state.intervalId) {
													clearInterval(state.intervalId);
												}

												state.status = 'WON';
												state.finishTime = now;
												state.cpm = calculateCPM(
													actualPrinted.length,
													snap.startTime,
													now,
												);

												registerResult(config, new Date(), {
													wpm: state.wpm,
													cps: state.cps,
													cpm: state.cpm,
													chars: state.source.length,
													passedSeconds: (now - state.startTime) / 1000,
													passedMs: now - state.startTime,
												});
											}
										}
									} else {
										state.firstPart = snap.userText;
										state.erroredPart = snap.source.slice(
											value.length - 1,
											value.length,
										);
									}
								}}
							/>
						)}
					</Box>
					<Box>
						<Text color={getScoreTextColor(snap.cpm, snap.robotCpm)}>
							CPM: {snap.cpm}
						</Text>
						<Text> </Text>
						<Text color={getWpmTextColor(snap.wpm, snap.robotWpm)}>
							WPM: {snap.wpm}
						</Text>
						{snap.handicap && <Text> (W. handicap </Text>}
						{snap.handicap && (
							<Text color={getWpmTextColor(snap.handicappedWpm, snap.robotWpm)}>
								WPM: {snap.handicappedWpm}
							</Text>
						)}
						{snap.handicap && <Text>)</Text>}
					</Box>
				</Box>
				<Box
					width={stdout.columns / 2.05}
					alignItems="center"
					flexDirection="column"
					marginTop={1}
				>
					<Box>
						<Text>{snap.usingBestResult ? 'Your best result' : 'Robot'}</Text>
					</Box>
					<Box
						width="97%"
						borderStyle="single"
						borderColor={getRobotBorderColor(snap.status)}
						flexDirection="column"
					>
						<Box>
							<Text color={snap.gameOver ? 'gray' : ''}>{snap.robotText}</Text>
						</Box>
					</Box>
					<Box>
						<Text color={getScoreTextColor(snap.robotCpm, snap.cpm)}>
							CPM: {snap.robotCpm}
						</Text>
						<Text> </Text>
						<Text color={getWpmTextColor(snap.robotWpm, snap.wpm)}>
							WPM: {snap.robotWpm}
						</Text>
					</Box>
				</Box>
			</Box>
			{isFinished(snap.status) && <Menu />}
		</Box>
	);
}
