import React from 'react';
import {Text, Box} from 'ink';
import {nanoid} from 'nanoid';
import {format, parseISO} from 'date-fns';
import {getResults, getSortedByString} from './helpers.js';
import Menu from './Menu.js';

export default function Results({sortBy}) {
	return (
		<Box
			flexDirection="column"
			justifyContent="center"
			alignItems="center"
			paddingY={1}
		>
			<Text>WPM results sorted by {getSortedByString(sortBy)}:</Text>
			<Box flexDirection="column">
				{getResults({sortBy}).map((result, i, array) => (
					<Box
						key={nanoid()}
						justifyContent="center"
						flexDirection="row"
						columnGap={4}
						borderStyle="single"
						borderLeft={false}
						borderRight={false}
						borderBottom={i === array.length - 1}
					>
						<Text dimColor>{`${format(
							parseISO(result.date),
							'MM/dd/yyyy HH:mm',
						)}`}</Text>
						<Text
							color={Number(result.value) > 30 ? '#0bc923' : '#e9c154'}
						>{`${result.value}`}</Text>
					</Box>
				))}
			</Box>
			<Menu />
		</Box>
	);
}
