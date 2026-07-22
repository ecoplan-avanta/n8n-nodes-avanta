import type {INodeProperties} from 'n8n-workflow';

import * as createCategory from './create-download-category.operation';
import * as removeCategory from './remove-download-category.operation';
import * as createItem from './create-download-item.operation';
import * as removeItem from './remove-download-item.operation';
import * as getAllItems from './getAll-items.operation';
import * as getAllCategories from './getAll-categories.operation';

export {createCategory, removeCategory, createItem, removeItem, getAllItems, getAllCategories};

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
                name: 'Create Category',
                value: 'createCategory',
                description: 'Create a new download category, or update it if it already exists',
                action: 'Create or update a download category',
            },
            {
                name: 'Remove Category',
                value: 'removeCategory',
                description: 'Delete one or more download categories',
                action: 'Remove download categories',
            },
            {
                name: 'Create Item',
                value: 'createItem',
                description: 'Create a new download item, or update it if it already exists',
                action: 'Create or update a download item',
            },
            {
                name: 'Remove Item',
                value: 'removeItem',
                description: 'Delete one or more download items',
                action: 'Remove download items',
            },
            {
                name: 'Get All Items',
                value: 'getAllItems',
                description: 'Retrieve all download items',
                action: 'Get all download items',
            },
            {
                name: 'Get All Categories',
                value: 'getAllCategories',
                description: 'Retrieve all download categories',
                action: 'Get all download categories',
            },
        ],
        default: 'createCategory',
    },
    ...createCategory.description,
    ...removeCategory.description,
    ...createItem.description,
    ...removeItem.description,
    ...getAllItems.description,
    ...getAllCategories.description,
];
