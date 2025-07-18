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
				name: 'Create/Update',
				value: 'create',
				description: 'Create or update a product',
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
				description: 'Get many products',
				action: 'Get many products',
			},
		],
		default: 'create',
	},
	...create.description,
	...getAll.description,
	...remove.description
];
