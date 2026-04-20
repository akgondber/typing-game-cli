#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import pick from 'just-pick';
import compose from 'just-compose';
import filter from 'just-filter-object';
import App from './app.js';
import {config} from './config.js';
import {getBestWpmResult, getGoal, wasGoalAchieved} from './helpers.js';

const cli = meow(
	`
		Usage
		  $ typing-game-cli
		
		Shorthand command aliases:
		  $ typing-game
		  $ tpngm
		  $ tgc

		Options
		  --against-my-best Play against your best result (available after you have competed against a robot at least once)
		  --fast            Start a round with a robot having high typing speed.
		  --extra-fast      Start a round with a robot having extra high typing speed.
		  --medium          Start a round with a robot having medium typing speed.
		  --low             Start a round with a robot having low typing speed.
		  --handicap        Start a round with handicap given by opponent to you by specified count of chars
		  --handicap-count  How many chars you wish to ask from opponent
		  --display-results Show cpm and wpm results
		  --sort-by         Sort results by specified value (-cpm, cpm, -wpm, wpm, -date, date), Starting "-" indicates descending order, default is "-date"
		  --all-history     Show all history when displaying results (otherwise (default) display last 10 results respecting sorting parameter)
		  --topic           Use sentences from works written by specified author
	      --top-n           Display top n results in displaying results mode
		  --set-goal        Set a goal (in wpm) that you wish to achieve
		  --goal-achieved   Let you know whether a goal was achieved

		Short flags and aliases for options:
		  --against-my-best:  -b, --best, --my-best, --myself, --against-my-best-result
		  --fast:             -f
		  --extra-fast:       -e
		  --medium:           -m
		  --low:              -l
		  --display-results:  -r
		  --sort-by           -s
		  --show-all-history: -a, --all, --all-history
		  --clear-results:    -c, --clear
		  --topic:            -t, --author, --tpc
		  --top-n:            --top
		  --handicap          --ha, --hndcp, --hdc, --han
		  --handicap-count    --hanco, --hanCo, --hndco, --haco
		  --set-goal          --sgoal, --goal
		  --goal-achieved     --goalach, --coolprogress, --progone, --goaldone, --aic


		Examples
		  $ typing-game-cli
		  $ typing-game-cli --fast
		  $ typing-game-cli -f
		  $ typing-game-cli --extra-fast
		  $ typing-game-cli --medium
		  $ typing-game-cli -m
		  $ typing-game-cli --low
		  $ typing-game-cli --display-results
		  $ typing-game-cli --display-results --top 5
		  $ typing-game-cli -r
		  $ typing-game-cli -r --sort-by="-wpm"
		  $ typing-game-cli -r -s="wpm"
		  $ typing-game-cli -r -s="-wpm" --all-history
		  $ typing-game-cli -r -s="-wpm" -a
		  $ typing-game-cli --topic mark-twain
		  $ typing-game-cli --topic ambrose-bierce
		  $ typing-game-cli --set-goal 60
		  $ typing-game-cli --goal 60
		  $ typing-game-cli --goal-achieved
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
				aliases: ['superFast'],
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
			handicap: {
				type: 'boolean',
				aliases: ['hndcp', 'hdc', 'han', 'ha'],
			},
			handicapCount: {
				type: 'number',
				aliases: ['hanco', 'hanCo', 'hndco', 'haco'],
			},
			setGoal: {
				type: 'string',
				aliases: ['sgoal', 'goal'],
			},
			goalAchieved: {
				type: 'boolean',
				aliases: [
					'goalach',
					'coolprogress',
					'progrone',
					'progone',
					'goaldone',
					'aic',
				],
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
			clearResults: {
				type: 'boolean',
				shortFlag: 'c',
				aliases: ['clear'],
				default: false,
			},
			againstMyBest: {
				type: 'boolean',
				shortFlag: 'b',
				aliases: ['best', 'myBest', 'myself', 'againstMyBestResult'],
				default: false,
			},
			compactResult: {
				type: 'boolean',
				aliases: ['cmpc'],
				default: false,
			},
			topN: {
				type: 'number',
				aliases: ['top'],
			},
			topic: {
				type: 'string',
				shortFlag: 't',
				aliases: ['author', 'tpc'],
			},
		},
	},
);

const exitNow = () => process.exit(); // eslint-disable-line n/prefer-global/process

if (cli.flags.clearResults) {
	config.clearAll();
	exitNow();
}

if (cli.flags.setGoal) {
	config.appendGoal(cli.flags.setGoal);
	exitNow();
}

if (cli.flags.goalAchieved) {
	const achiemenceResult = wasGoalAchieved();
	if (achiemenceResult === null) {
		console.log(
			`There are no goal yet. First set a goal by --set-goal [wpm] command`,
		);
	} else {
		let messageToSay = achiemenceResult
			? `Congrats, you have achieved your goal.`
			: `You goal is not achieved yet.`;
		if (!achiemenceResult) {
			const bestResult = getBestWpmResult();
			messageToSay += ` Best result - ${bestResult.value.wpm}, goal - ${getGoal()}. Keep trying, don't give up!`;
		}

		console.log(messageToSay);
	}

	exitNow();
}

const robotLevel = compose(
	flags => pick(flags, ['extraFast', 'fast', 'medium', 'low']),
	flags => filter(flags, (_, value) => value),
	flags => Object.keys(flags)[0] || 'medium',
)(cli.flags);
const {
	handicap,
	handicapCount,
	displayResults,
	sortBy,
	showAllHistory,
	againstMyBest,
	compactResult,
	topN,
	topic,
} = cli.flags;

console.clear();
render(
	<App
		robotLevel={robotLevel}
		handicap={handicap}
		handicapCount={handicapCount}
		displayResults={displayResults}
		sortBy={sortBy}
		isShowAllHistory={showAllHistory}
		isCompetingAgainstBestResult={againstMyBest}
		isCompactFormat={compactResult}
		topN={topN}
		topic={topic}
	/>,
);

export {exitNow};
