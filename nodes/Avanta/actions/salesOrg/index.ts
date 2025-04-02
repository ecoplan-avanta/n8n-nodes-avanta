import type {INodeProperties} from 'n8n-workflow';

import * as getAll from './getAll.operation';

export {getAll};

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['salesOrg'],
			},
		},
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many sales organisations',
				action: 'Get many sales organisations',
			},
		],
		default: 'create',
	},
	...getAll.description
];
