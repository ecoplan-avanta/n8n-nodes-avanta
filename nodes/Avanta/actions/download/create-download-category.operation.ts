import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties
} from "n8n-workflow";

import {updateDisplayOptions} from "../../helpers/displayOptions";
import {formatExtensionAttributes, prepareErrorData} from "../../helpers/utils";
import type {DownloadCategory} from "../../transport";
import {createApiRequest} from "../../transport";

const properties: INodeProperties[] = [
    {
        displayName: 'Store Name or ID',
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
        default: false,
        displayOptions: {
            show: {
                resource: ['download'],
                operation: ['createCategory'],
            },
        },
        description: 'Whether the category is active',
    },
    {
        displayName: 'Title',
        name: 'title',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['download'],
                operation: ['createCategory'],
            },
        }
    },
    {
        displayName: 'Level',
        name: 'level',
        type: 'number',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['download'],
                operation: ['createCategory'],
            },
        }
    },
    {
        displayName: 'Tree Path',
        name: 'tree_path',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['download'],
                operation: ['createCategory'],
            },
        }
    },
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
            show: {
                resource: ['download'],
                operation: ['createCategory'],
            },
        },
        options: [
            {
                displayName: 'Parent Category ID',
                name: 'parent_category_id',
                type: 'number',
                default: '',
            },
            {
                displayName: 'External ID',
                name: 'external_id',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Sort Order',
                name: 'order',
                type: 'string',
                default: '',
            }
        ]
    },
]

const displayOptions = {
    show: {
        resource: ['download'],
        operation: ['createCategory']
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
            let additionalFields = this.getNodeParameter(
                'additionalFields',
                i,
            );

            additionalFields = formatExtensionAttributes.call(this, additionalFields);
            let category = {
                'category': {} as DownloadCategory
            }
            category.category = {
                store_id: this.getNodeParameter('store_id', i) as number,
                status: this.getNodeParameter('status', i) as boolean,
                title: this.getNodeParameter('title', i) as string,
                level: this.getNodeParameter('level', i) as number,
                tree_path: this.getNodeParameter('tree_path', i) as string,
            };
            category.category = {...category.category, ...additionalFields};

            if (!bulk) {
                const executionData = await createApiRequest.call(this, category, restUrl, false, i);
                returnData.push(...executionData);
            } else {
                data.push(category);
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
