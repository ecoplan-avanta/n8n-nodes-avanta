/*
 * Copyright (c) 2026 by ECOPLAN E-Commerce GmbH
 *
 * This software is protected by copyright.
 * Decompiling or modifying the source code, as well as using the
 * software beyond the licensed scope, is prohibited.
 * Violations will be prosecuted.
 */

import type {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties
} from 'n8n-workflow';

import {updateDisplayOptions} from '../../../helpers/displayOptions';
import {getSearchFilters, executeGetAll} from "../../../helpers/utils";

const properties: INodeProperties[] = [
    ...getSearchFilters('tickets'),
];

const displayOptions = {
    show: {
        resource: ['tickets'],
        operation: ['getAll'],
    },
};

const restUrl = '/V1/avanta-admin/offer/ticket';

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(
    this: IExecuteFunctions
): Promise<INodeExecutionData[]> {
    return executeGetAll.call(this, restUrl);
}
