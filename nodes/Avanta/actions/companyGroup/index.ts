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
				resource: ['companyGroup'],
			},
		},
		options: [
			{
				name: 'Create/Update',
				value: 'create',
				description: 'Create or update a company group',
				action: 'Create or update a company group',
			},
			{
				name: 'Delete',
				value: 'remove',
				description: 'Delete a company group',
				action: 'Delete a company group',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many company groups',
				action: 'Get many company groups',
			},
		],
		default: 'create',
	},
	...create.description,
	...getAll.description,
	...remove.description
];
