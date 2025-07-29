import type {INodeProperties} from 'n8n-workflow';

import * as create from './create.operation';

export {create};

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['orderCreate'],
			},
		},
		options: [
			{
				name: 'Order create',
				value: 'orderCreate',
				description: 'Run order create',
				action: 'Run order create',
			}
		],
		default: 'orderCreate',
	},
	...create.description,
];
