#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import pick from 'just-pick';
import compose from 'just-compose';
import filter from 'just-filter-object';
import App from './app.js';

const cli = meow(
	`
		Usage
		  $ typing-game-cli

		Options
			--fast            Start a round with a robot having high typing speed.
			--extra-fast      Start a round with a robot having high typing speed.
			--medium          Start a round with a robot having medium typing speed.
			--low             Start a round with a robot having low typing speed.
			--display-results Show wpm results
			--sort-by         Sort wpm results by specified value (-wpm, wpm, -date, date), Starting "-" indicates descending order, default is "-date"
			--all-hostory     Show all history when displaying results (otherwise (default) display last 10 results respecting sorting parameter)


		Examples
		  $ typing-game-cli
		  $ typing-game-cli --fast
		  $ typing-game-cli -f
		  $ typing-game-cli --extra-fast
		  $ typing-game-cli --medium
		  $ typing-game-cli -m
		  $ typing-game-cli --low
		  $ typing-game-cli --display-results
		  $ typing-game-cli -r
		  $ typing-game-cli -r --sort-by="-wpm"
		  $ typing-game-cli -r -s="wpm"
		  $ typing-game-cli -r -s="-wpm" --all-history
		  $ typing-game-cli -r -s="-wpm" -a
	`,
	{
		importMeta: import.meta,
		flags: {
			fast: {
				type: 'boolean',
				shortFlag: 'f',
			},
			extraFast: {
				type: 'boolean',
				shortFlag: 'e',
			},
			medium: {
				type: 'boolean',
				shortFlag: 'm',
			},
			low: {
				type: 'boolean',
				shortFlag: 'l',
			},
			displayResults: {
				type: 'boolean',
				shortFlag: 'r',
				default: false,
			},
			sortBy: {
				type: 'string',
				shortFlag: 's',
				default: '-date',
			},
			showAllHistory: {
				type: 'boolean',
				shortFlag: 'a',
				aliases: ['allHistory', 'all'],
				default: false,
			},
		},
	},
);

const robotLevel = compose(
	flags => pick(flags, ['extraFast', 'fast', 'medium', 'low']),
	flags => filter(flags, (_, value) => value),
	flags => Object.keys(flags)[0] || 'medium',
)(cli.flags);
const {displayResults, sortBy, showAllHistory} = cli.flags;

render(
	<App
		robotLevel={robotLevel}
		displayResults={displayResults}
		sortBy={sortBy}
		isShowAllHistory={showAllHistory}
	/>,
);

const exitNow = () => process.exit(); // eslint-disable-line n/prefer-global/process

export {exitNow};
