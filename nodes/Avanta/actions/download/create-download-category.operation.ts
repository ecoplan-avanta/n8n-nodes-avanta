import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties
} from "n8n-workflow";

import {updateDisplayOptions} from "../../helpers/displayOptions";
import {formatExtensionAttributes, prepareErrorData} from "../../helpers/utils";
import type {Company} from "../../transport";
import {createApiRequest} from "../../transport";


const properties: INodeProperties[] = [
    {
        displayName: 'Store ID',
        name: 'store_id',
        type: 'options',
        required: true,
        description:
            'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
        typeOptions: {
            loadOptionsMethod: 'getStoreViews',
        },
        default: '',
    },
    {
        displayName: 'Status',
        name: 'status',
        type: 'boolean',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['download'],
                operation: ['createDownloadCategory'],
            },
        },
        description: 'Category status: active or inactive',
    }
]

const displayOptions = {
    show: {
        resource: ['download'],
        operation: ['createDownloadCategory']
    }
}

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/download/category';

export async function execute(
    this: IExecuteFunctions
): Promise<INodeExecutionData[]> {
    const bulk = this.getNodeParameter('bulk', 0) as boolean;
    const items = this.getInputData();
    const data = [];
    const returnData: INodeExecutionData[] = [];
    for (let i = 0; i < items.length; i++) {
        try {
            const name = this.getNodeParameter('name', i) as string;
            const customer_id = this.getNodeParameter('customer_id', i) as string;
            const status = this.getNodeParameter('status', i) as boolean ? 1 : 0;
            const external_company_customergroup_id = this.getNodeParameter('external_company_customergroup_id', i) as string;
            const external_sales_org_id = this.getNodeParameter('external_sales_org_id', i) as string;
            let additionalFields = this.getNodeParameter(
                'additionalFields',
                i,
            );

            additionalFields = formatExtensionAttributes.call(this, additionalFields);
            let company = {
                'company': {} as Company
            }
            company.company = {
                name: name,
                customer_id: customer_id,
                status: status
            };
            company.company = {...company.company, ...additionalFields};

            company.company.extension_attributes = {
                ...company.company.extension_attributes, ...{
                    'external_company_customergroup_id': external_company_customergroup_id,
                    'external_sales_org_id': external_sales_org_id
                }
            };

            if (!('group_id' in company.company)) {
                company.company.group_id = 1
            }

            if (!('company_role_id' in company.company)) {
                company.company.company_role_id = 1
            }

            if (!bulk) {
                const executionData = await createApiRequest.call(this, company, restUrl, false, i);
                returnData.push(...executionData);
            } else {
                data.push(company);
            }
        } catch (error) {
            if (this.continueOnFail()) {
                returnData.push(...prepareErrorData.call(this, error, i));
                continue;
            }

            throw error;
        }
    }
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
    return returnData;
}
