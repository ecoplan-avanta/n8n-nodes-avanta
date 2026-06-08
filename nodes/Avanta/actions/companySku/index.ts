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
				name: 'Create or Update',
				value: 'create',
				description: 'Create a new company SKU mapping, or update it if it already exists',
				action: 'Create or update a company SKU mapping',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a company SKU mapping',
				action: 'Delete a company SKU mapping',
			}
		],
		default: 'create',
	},
	...create.description,
	...remove.description
];
