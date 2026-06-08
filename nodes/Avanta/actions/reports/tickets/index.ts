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
                resource: ['tickets'],
            },
        },
        options: [
            {
                name: 'Create or Update',
                value: 'create',
                description: 'Create a new ticket, or update it if it already exists (available from avanta v3.6)',
                action: 'Create or update a ticket',
            },
            {
                name: 'Get Many',
                value: 'getAll',
                description: 'Retrieve a list of tickets (available from avanta v3.6)',
                action: 'Retrieve a list of tickets',
            },
        ],
        default: 'create',
    },
    ...create.description,
    ...getAll.description
];
