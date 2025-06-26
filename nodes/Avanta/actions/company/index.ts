import type {INodeProperties} from 'n8n-workflow';

import * as create from './create.operation';
import * as getAll from './getAll.operation';
import * as deactivate from './deactivate.operation';
import * as remove from './remove.operation';


export {create,getAll, deactivate, remove};

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['company'],
			},
		},
		options: [
			{
				name: 'Create/Update',
				value: 'create',
				description: 'Create or update a company',
				action: 'Create or update a company',
			},
			{
				name: 'Deactivate',
				value: 'deactivate',
				description: 'Deactivate companies',
				action: 'Deactivate companies',
			},
			{
				name: 'Delete',
				value: 'remove',
				description: 'Delete companies',
				action: 'Delete companies',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many companies',
				action: 'Get many companies',
			},
		],
		default: 'create',
	},
	...create.description,
	...getAll.description,
	...deactivate.description,
	...remove.description
];
