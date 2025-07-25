import type {INodeProperties} from 'n8n-workflow';

import * as create from './create.operation';
import * as getAll from './getAll.operation';
import * as remove from './remove.operation';

export {create, getAll, remove};

export const description: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['companyContact'],
            },
        },
        options: [
            {
                name: 'Create',
                value: 'create',
                description: 'Create a contact',
                action: 'Create a contact',
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
                description: 'Get many company contacts',
                action: 'Get many company contacts'
            }
        ],
        default: 'create',
    },
    ...create.description,
    ...getAll.description,
    ...remove.description
];
