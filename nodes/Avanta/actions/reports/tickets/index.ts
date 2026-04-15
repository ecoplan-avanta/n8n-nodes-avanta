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
                name: 'Create/Update',
                value: 'create',
                description: 'Create or update a ticket (available from avanta v3.6)',
                action: 'Create or update a ticket (available from avanta v3.6)',
            },
            {
                name: 'Get Many',
                value: 'getAll',
                description: 'Get many tickets (available from avanta v3.6)',
                action: 'Get many tickets (available from avanta v3.6)',
            },
        ],
        default: 'create',
    },
    ...create.description,
    ...getAll.description
];
