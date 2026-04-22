/*
 * Copyright (c) 2026 by ECOPLAN E-Commerce GmbH
 *
 * Diese Software ist urheberrechtlich geschützt.
 * Es ist verboten, den Quelltext zu entschlüsseln oder zu verändern,
 * sowie die Software mehr als lizenziert zu nutzen.
 * Zuwiderhandlungen werden strafrechtlich verfolgt.
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
                name: 'Create/Update',
                value: 'create',
                description: 'Create or update an inquiry (available from avanta v3.7)',
                action: 'Create or update an inquiry (available from avanta v3.7)',
            },
            {
                name: 'Get Many',
                value: 'getAll',
                description: 'Get many inquiries (available from avanta v3.7)',
                action: 'Get many inquiries (available from avanta v3.7)',
            },
        ],
        default: 'create',
    },
    ...create.description,
    ...getAll.description
];
