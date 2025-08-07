import type {INodeProperties} from 'n8n-workflow';

import * as createCategory from './create-download-category.operation';

export {createCategory};

export const description: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['download'],
            },
        },
        options: [
            {
                name: 'Create category',
                value: 'createCategory',
                description: 'Create or update a download category',
                action: 'Create or update a download category',
            }
        ],
        default: 'create',
    },
    ...createCategory.description,
];
