import type {INodeProperties} from 'n8n-workflow';

import * as create from './create.operation';
import * as getAll from './getAll.operation';

export {create,getAll};

export const description: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['reshipments'],
            },
        },
        options: [
            {
                name: 'Create or Update',
                value: 'create',
                description: 'Create a new reshipment, or update it if it already exists',
                action: 'Create or update a reshipment',
            },
            {
                name: 'Get Many',
                value: 'getAll',
                description: 'Retrieve a list of reshipments',
                action: 'Retrieve a list of reshipments',
            },
        ],
        default: 'create',
    },
    ...create.description,
    ...getAll.description
];
