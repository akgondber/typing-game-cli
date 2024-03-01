import React from 'react';
import {Text, Box, useInput, useStdout} from 'ink';
import TextInput from 'ink-text-input-2';
import {Spinner, Alert} from '@inkjs/ui';
import chalk from 'chalk';
import Gradient from 'ink-gradient';
import {proxy, useSnapshot} from 'valtio';
import random from 'just-random';
import {
	getBorderColor,
	getDefaultSuite,
	getRobotBorderColor,
	getStatusVariant,
	getMessage,
	isFinished,
	getIntervalMs,
} from './helpers.js';
import {optionKeyColor} from './constants.js';

const state = proxy({
	status: 'PAUSED',
	suite: getDefaultSuite(),
	source: null,
	firstPart: '',
	highlightedPart: '',
	erroredPart: '',
	highlighingColor: 'green',
	lastPart: '',
	robotText: '',
	userText: '',
	intervalId: null,
	level: 'medium',
});

export default function App({robotLevel}) {
	const snap = useSnapshot(state);
	const {stdout} = useStdout();

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
				state.lastPart = state.source;
				state.level = robotLevel || 'medium';
				const interval = setInterval(() => {
					state.robotText += state.source.slice(
						state.robotText.length,
						state.robotText.length + 1,
					);

					if (state.robotText === state.source) {
						state.status = 'LOST';
						clearInterval(interval);
					} else if (state.userText === state.source) {
						state.status = 'WON';
						clearInterval(interval);
					}
				}, getIntervalMs(state.level));
				state.intervalId = interval;
			}
		},
		{isActive: state.status !== 'RUNNING'},
	);

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
				<Text>Typer-robot challenges you: who will type a text faster.</Text>
				<Text>
					Press{' '}
					<Text bold color={optionKeyColor}>
						y
					</Text>{' '}
					if you want to accept a challenge and start a round.
				</Text>
			</Box>
		</Box>
	) : (
		<Box flexDirection="column" alignItems="center">
			{isFinished(snap.status) ? (
				<Box flexDirection="column">
					<Box paddingY={1}>
						<Text>
							Press{' '}
							<Text bold color={optionKeyColor}>
								y
							</Text>{' '}
							to start a new round.
						</Text>
					</Box>
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
				</Box>
			) : (
				<Box>
					<Box borderStyle="single" alignItems="center" justifyContent="center">
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
					{chalk.bgGreen(snap.firstPart)}
					{snap.erroredPart && chalk.bgRed(snap.erroredPart)}
					{snap.lastPart}
				</Text>
			</Box>
			<Box alignItems="center" justifyContent="center">
				<Box
					borderStyle="single"
					width={stdout.columns / 2.15}
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
									state.lastPart = snap.source.slice(value.length);
									state.userText = value;
								} else {
									state.firstPart = snap.userText;
									state.erroredPart = snap.source.slice(
										value.length - 1,
										value.length,
									);
									state.lastPart = snap.source.slice(value.length);
								}
							}}
						/>
					)}
				</Box>
				<Box
					borderStyle="single"
					width={stdout.columns / 2.15}
					borderColor={getRobotBorderColor(snap.status)}
				>
					<Text>{snap.robotText}</Text>
				</Box>
			</Box>
		</Box>
	);
}
