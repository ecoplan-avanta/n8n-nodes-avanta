import type {INodeProperties} from 'n8n-workflow';

import * as create from './create.operation';
import * as remove from './remove.operation';

export {create, remove};

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['companySku'],
			},
		},
		options: [
			{
				name: 'Create/Update',
				value: 'create',
				description: 'Create or update a company sku',
				action: 'Create or update a company sku',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a company sku',
				action: 'Delete a company sku',
			}
		],
		default: 'create',
	},
	...create.description,
	...remove.description
];
