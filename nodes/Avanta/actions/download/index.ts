import type {INodeProperties} from 'n8n-workflow';

import * as createCategory from './create-download-category.operation';
import * as removeCategory from './remove-download-category.operation';
import * as createItem from './create-download-item.operation';
import * as removeItem from './remove-download-item.operation';

export {createCategory, removeCategory, createItem, removeItem};

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
            },
            {
                name: 'Remove category',
                value: 'removeCategory',
                description: 'Remove download categories',
                action: 'Remove download categories',
            },
            {
                name: 'Create item',
                value: 'createItem',
                description: 'Create or update a download item',
                action: 'Create or update a download item',
            },
            {
                name: 'Remove item',
                value: 'removeItem',
                description: 'Remove download item',
                action: 'Remove download item',
            }
        ],
        default: 'createCategory',
    },
    ...createCategory.description,
    ...removeCategory.description,
    ...createItem.description,
    ...removeItem.description,
];
