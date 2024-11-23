import React from 'react';
import {Text, Box} from 'ink';
import {nanoid} from 'nanoid';
import {format, parseISO} from 'date-fns';
import {
	getBestResultCompactString,
	getResults,
	getSortedByString,
} from './helpers.js';
import Menu from './Menu.js';

export default function Results({sortBy, isShowAllHistory, isCompactFormat}) {
	return isCompactFormat ? (
		<Box flexDirection="column" justifyContent="center" paddingX={1}>
			<Text>{` ${getBestResultCompactString()}`}</Text>
			<Menu />
		</Box>
	) : (
		<Box flexDirection="column">
			<Box
				flexDirection="row"
				justifyContent="space-around"
				alignItems="center"
				paddingY={1}
			>
				<Box flexDirection="column" alignItems="center">
					<Box>
						<Text>Top results</Text>
					</Box>
					<Box flexDirection="column">
						{getResults({sortBy: '-cpm', showAll: false}).map(
							(result, i, array) => (
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
									<Text>
										{`wpm: `}
										<Text
											color={
												Number(result.value.wpm) > 30 ? '#0bc923' : '#e9c154'
											}
										>
											{result.value.wpm}
										</Text>
										{`  cpm: `}
										<Text
											color={
												Number(result.value.cpm) > 200 ? '#0bc923' : '#e9c154'
											}
										>
											{result.value.cpm}
										</Text>
									</Text>
								</Box>
							),
						)}
					</Box>
				</Box>
				<Box flexDirection="column" alignItems="center">
					<Text>Results sorted by {getSortedByString(sortBy)}:</Text>
					<Box flexDirection="column">
						{getResults({sortBy, showAll: isShowAllHistory}).map(
							(result, i, array) => (
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
									<Text>
										{`wpm: `}
										<Text
											color={
												Number(result.value.wpm) > 30 ? '#0bc923' : '#e9c154'
											}
										>
											{result.value.wpm}
										</Text>
										{`  cpm: `}
										<Text
											color={
												Number(result.value.cpm) > 200 ? '#0bc923' : '#e9c154'
											}
										>
											{result.value.cpm}
										</Text>
									</Text>
								</Box>
							),
						)}
					</Box>
				</Box>
			</Box>
			<Menu />
		</Box>
	);
}
