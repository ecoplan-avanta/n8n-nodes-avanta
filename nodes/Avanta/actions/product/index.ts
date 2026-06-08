import type {INodeProperties} from 'n8n-workflow';

import * as create from './create.operation';
import * as getAll from './getAll.operation';
import * as remove from './remove.operation';

export {create,getAll,remove};

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['product'],
			},
		},
		options: [
			{
				name: 'Create or Update',
				value: 'create',
				description: 'Create a new product, or update it if it already exists',
				action: 'Create or update a product',
			},
			{
				name: 'Delete',
				value: 'remove',
				description: 'Delete a product',
				action: 'Delete a product',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Retrieve a list of products',
				action: 'Retrieve a list of products',
			},
		],
		default: 'create',
	},
	...create.description,
	...getAll.description,
	...remove.description
];
