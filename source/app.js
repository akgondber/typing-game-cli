import React, {useLayoutEffect} from 'react';
import {Text, Box, useInput, useStdout} from 'ink';
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
	getRobotBorderColor,
	getStatusVariant,
	getMessage,
	isFinished,
	getIntervalMs,
	isWordTyped,
	calculateWPM,
	getTypingWord,
	getRemainingPart,
	getWpmTextColor,
} from './helpers.js';
import {optionKeyColor} from './constants.js';
import Results from './Results.js';
import {config} from './config.js';
import Menu from './Menu.js';

const currentTime = () => Date.now();

const state = proxy({
	status: 'PAUSED',
	suite: getDefaultSuite(),
	source: null,
	firstPart: '',
	highlightedPart: '',
	erroredPart: '',
	highlighingColor: 'green',
	startTime: null,
	finishTime: null,
	wordCount: 0,
	robotWordCount: 0,
	robotText: '',
	userText: '',
	rema: '',
	nextAndRemaining: '',
	intervalId: null,
	level: 'medium',
	wpm: 0,
	robotWpm: 0,
});

export default function App({robotLevel, displayResults = false, sortBy}) {
	const snap = useSnapshot(state);
	const {stdout} = useStdout();

	useLayoutEffect(() => {
		if (displayResults) {
			state.status = 'RESULTS';
		}
	}, [displayResults]);

	useInput(
		(input, _key) => {
			if (input === 'y') {
				state.userText = '';
				state.robotText = '';
				state.status = 'RUNNING';
				state.source = random(state.suite.sentences);
				state.firstPart = '';
				state.highlightedPart = '';
				state.erroredPart = '';
				state.level = robotLevel || 'medium';
				state.startTime = currentTime();
				state.finishTime = null;
				state.wordCount = 0;
				state.robotWordCount = 0;
				state.rema = getTypingWord(state.source, state.userText, false);
				const interval = setInterval(() => {
					const now = currentTime();
					const newRobotText =
						state.robotText +
						state.source.slice(
							state.robotText.length,
							state.robotText.length + 1,
						);
					state.robotText = newRobotText;
					if (isWordTyped(state.source, newRobotText)) {
						const newRobotWordCount = state.robotWordCount + 1;
						state.robotWordCount = newRobotWordCount;
					}

					const isFinished =
						state.userText === state.source || state.robotText === state.source;
					state.wpm = calculateWPM(
						state.wordCount,
						state.startTime,
						now,
						isFinished,
					);
					state.robotWpm = calculateWPM(
						state.robotWordCount,
						state.startTime,
						now,
						isFinished,
					);

					if (state.robotText === state.source) {
						state.status = 'LOST';
						state.finishTime = now;
						config.addEntry({[formatISO(new Date())]: state.wpm});
						clearInterval(interval);
					} else if (state.userText === state.source) {
						state.status = 'WON';
						state.finishTime = now;
						config.addEntry({[formatISO(new Date())]: state.wpm});
						clearInterval(interval);
					}
				}, getIntervalMs(state.level));
				state.intervalId = interval;
			} else if (input === 'r') {
				state.status = 'RESULTS';
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
		{isActive: state.status !== 'RESULTS' && state.status !== 'RUNNING'},
	);

	if (snap.status === 'RESULTS') {
		return <Results sortBy={sortBy} />;
	}

	return snap.status === 'PAUSED' ? (
		<Box flexDirection="column" alignItems="center">
			<Box marginY={2} flexDirection="column" justifyContent="center">
				<Gradient name="rainbow">
					<Text>TYPING-GAME-CLI</Text>
				</Gradient>
			</Box>
			<Box
				rowGap={1}
				flexDirection="column"
				justifyContent="center"
				alignItems="center"
			>
				<Text>Typer-robot challenges you: who will type a text faster?</Text>
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
						to show your wpm statistics.
					</Text>
				</Box>
			</Box>
		</Box>
	) : (
		<Box width="100%" flexDirection="column" alignItems="center">
			{isFinished(snap.status) ? (
				<Box
					flexDirection="column"
					alignItems="center"
					justifyContent="center"
					paddingBottom={1}
				>
					<Alert variant={getStatusVariant(snap.status)}>
						{getMessage(snap.status)}
					</Alert>
				</Box>
			) : (
				<Box>
					<Box
						marginBottom={1}
						borderStyle="single"
						alignItems="center"
						justifyContent="center"
					>
						<Spinner />
						<Text> Running</Text>
					</Box>
				</Box>
			)}
			<Box
				height={3}
				alignItems="center"
				paddingBottom={1}
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
					<Box>
						<Text>You</Text>
					</Box>
					<Box
						width="95%"
						borderStyle="single"
						borderColor={getBorderColor(snap.status)}
					>
						{isFinished(snap.status) ? (
							<Text>{snap.userText}</Text>
						) : (
							<TextInput
								value={snap.userText}
								onChange={value => {
									if (snap.source.indexOf(value) === 0) {
										state.firstPart = value;
										state.erroredPart = '';
										state.userText = value;
										const newWordCount = state.wordCount + 1;
										const now = currentTime();
										if (isWordTyped(snap.source, value)) {
											state.wordCount = newWordCount;
											state.wpm = calculateWPM(
												newWordCount,
												snap.startTime,
												now,
												snap.source === value,
											);
										}

										if (snap.source === value) {
											if (state.intervalId) clearInterval(state.intervalId);
											state.status = 'WON';
											state.finishTime = now;
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
						<Text color={getWpmTextColor(snap.wpm, snap.robotWpm)}>
							WPM: {snap.wpm}
						</Text>
					</Box>
				</Box>
				<Box
					width={stdout.columns / 2.05}
					alignItems="center"
					flexDirection="column"
				>
					<Box>
						<Text>Robot</Text>
					</Box>
					<Box
						width="95%"
						borderStyle="single"
						borderColor={getRobotBorderColor(snap.status)}
						flexDirection="column"
					>
						<Box>
							<Text>{snap.robotText}</Text>
						</Box>
					</Box>
					<Box>
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
