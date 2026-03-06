/*
 * Copyright (c) 2026 by ECOPLAN E-Commerce GmbH
 *
 * Diese Software ist urheberrechtlich geschützt.
 * Es ist verboten, den Quelltext zu entschlüsseln oder zu verändern,
 * sowie die Software mehr als lizenziert zu nutzen.
 * Zuwiderhandlungen werden strafrechtlich verfolgt.
 */

import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties
} from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import type { CompanyRule } from '../../transport';
import { prepareErrorData } from '../../helpers/utils';
import { createApiRequest } from '../../transport';

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
                operation: ['create'],
            },
        },
        description: 'External Role ID for the company rule',
    },
    {
        displayName: 'Resource ID',
        name: 'resource_id',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['companyRule'],
                operation: ['create'],
            },
        },
        description: 'Resource ID for the company rule',
    },
    {
        displayName: 'Permission',
        name: 'permission',
        type: 'options',
        required: true,
        options: [
            {
                name: 'Deny',
                value: 'deny',
            },
            {
                name: 'Allow',
                value: 'allow',
            }
        ],
        default: 'deny',
        displayOptions: {
            show: {
                resource: ['companyRule'],
                operation: ['create'],
            },
        },
        description: 'Permission of the company rule',
    }
];

const displayOptions = {
    show: {
        resource: ['companyRule'],
        operation: ['create'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/companyrule';

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
    const bulk = this.getNodeParameter('bulk', 0) as boolean;
    const items = this.getInputData();
    const data: { companyRule: CompanyRule }[] = [];
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
        try {
            const external_role_id = this.getNodeParameter('external_role_id', i) as string;
            const resource_id = this.getNodeParameter('resource_id', i) as string;
            const permission = this.getNodeParameter('permission', i) as string;

            const companyRule = {
                companyRule: {
                    external_role_id: external_role_id || undefined,
                    resource_id: resource_id || undefined,
                    permission: permission || undefined,
                } as CompanyRule
            };

            if (!bulk) {
                const executionData = await createApiRequest.call(this, companyRule, restUrl, false, i);
                returnData.push(...executionData);
            } else {
                data.push(companyRule);
            }
        } catch (error) {
            if (this.continueOnFail()) {
                returnData.push(...prepareErrorData.call(this, error, i));
                continue;
            }
            throw error;
        }
    }

    if (bulk && data.length > 0) {
        try {
            const executionData = await createApiRequest.call(this, data, restUrl);
            returnData.push(...executionData);
        } catch (error) {
            if (this.continueOnFail()) {
                returnData.push(...prepareErrorData.call(this, error, 0));
            } else {
                throw error;
            }
        }
    }

    return returnData;
}
