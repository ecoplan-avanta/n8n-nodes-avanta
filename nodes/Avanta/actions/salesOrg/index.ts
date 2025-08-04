import type {INodeProperties} from 'n8n-workflow';

import * as create from './create.operation';
import * as remove from './remove.operation';
import * as getAll from './getAll.operation';

export {create,getAll,remove};

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
				name: 'Create/Update',
				value: 'create',
				description: 'Create or update a sales organisation',
				action: 'Create or update a sales organisation',
			},
			{
				name: 'Delete',
				value: 'remove',
				description: 'Delete a sales organisation',
				action: 'Delete a sales organisation',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many sales organisations',
				action: 'Get many sales organisations',
			},
		],
		default: 'create',
	},
	...create.description,
	...getAll.description,
	...remove.description
];
