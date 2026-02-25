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
                resource: ['companyRule'],
            },
        },
        options: [
            {
                name: 'Create/Update',
                value: 'create',
                description: 'Create or update a company rule  (available from avanta v3.6)',
                action: 'Create or update a company rule  (available from avanta v3.6)',
            },
            {
                name: 'Get Many',
                value: 'getAll',
                description: 'Get many company rules  (available from avanta v3.6)',
                action: 'Get many company rules  (available from avanta v3.6)',
            },
        ],
        default: 'create',
    },
    ...create.description,
    ...getAll.description
];
