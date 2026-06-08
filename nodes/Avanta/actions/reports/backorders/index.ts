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
                resource: ['backorders'],
            },
        },
        options: [
            {
                name: 'Create or Update',
                value: 'create',
                description: 'Create a new backorder, or update it if it already exists',
                action: 'Create or update a backorder',
            },
            {
                name: 'Get Many',
                value: 'getAll',
                description: 'Retrieve a list of backorders',
                action: 'Retrieve a list of backorders',
            },
        ],
        default: 'create',
    },
    ...create.description,
    ...getAll.description
];
