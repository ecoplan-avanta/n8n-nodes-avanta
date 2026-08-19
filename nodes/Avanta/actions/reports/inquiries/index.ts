/*
 * Copyright (c) 2026 by ECOPLAN E-Commerce GmbH
 *
 * This software is protected by copyright.
 * Decompiling or modifying the source code, as well as using the
 * software beyond the licensed scope, is prohibited.
 * Violations will be prosecuted.
 */

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
                resource: ['inquiries'],
            },
        },
        options: [
            {
                name: 'Create or Update',
                value: 'create',
                description: 'Create a new inquiry, or update it if it already exists (available from avanta v3.6)',
                action: 'Create or update an inquiry',
            },
            {
                name: 'Get Many',
                value: 'getAll',
                description: 'Retrieve a list of inquiries (available from avanta v3.6)',
                action: 'Retrieve a list of inquiries',
            },
        ],
        default: 'create',
    },
    ...create.description,
    ...getAll.description
];
