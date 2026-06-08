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
				name: 'Create or Update',
				value: 'create',
				description: 'Create a new company, or update it if it already exists',
				action: 'Create or update a company',
			},
			{
				name: 'Deactivate',
				value: 'deactivate',
				description: 'Deactivate one or more companies',
				action: 'Deactivate companies',
			},
			{
				name: 'Delete',
				value: 'remove',
				description: 'Delete one or more companies',
				action: 'Delete companies',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Retrieve a list of companies',
				action: 'Retrieve a list of companies',
			},
		],
		default: 'create',
	},
	...create.description,
	...getAll.description,
	...deactivate.description,
	...remove.description
];
