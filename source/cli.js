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
			--fast   Start a round with a robot having high typing speed.
			--medium Start a round with a robot having medium typing speed.
			--low    Start a round with a robot having low typing speed.

		Examples
		  $ typing-game-cli
		  $ typing-game-cli --fast
		  $ typing-game-cli --medium
		  $ typing-game-cli --low
	`,
	{
		importMeta: import.meta,
		flags: {
			fast: {
				type: 'boolean',
				shortFlag: 'f',
			},
			medium: {
				type: 'boolean',
				shortFlag: 'm',
			},
			low: {
				type: 'boolean',
				shortFlag: 'l',
			},
		},
	},
);

const robotLevel = compose(
	flags => pick(flags, ['fast', 'medium', 'low']),
	flags => filter(flags, (_, value) => value),
	flags => Object.keys(flags)[0] || 'medium',
)(cli.flags);

render(<App robotLevel={robotLevel} />);
