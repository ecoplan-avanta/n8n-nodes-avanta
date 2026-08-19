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

import {updateDisplayOptions} from '../../helpers/displayOptions';
import { executeGetAll} from "../../helpers/utils";

const properties: INodeProperties[] = [
    {
        displayName: 'External Role ID',
        name: 'external_role_id',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['companyRule'],
                operation: ['getAll'],
            },
        },
        description: 'Filter for External Role ID',
    },
];

const displayOptions = {
    show: {
        resource: ['companyRule'],
        operation: ['getAll'],
    },
};

const restUrl = '/V1/proline-admin/companyrule/listbyexternalid/';

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(
    this: IExecuteFunctions
): Promise<INodeExecutionData[]> {
    const external_role_id = this.getNodeParameter("external_role_id", 0) as string;

    return executeGetAll.call(this, restUrl + external_role_id);
}
