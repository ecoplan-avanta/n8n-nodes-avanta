import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties,
    NodeApiError
} from "n8n-workflow";
import type {JsonObject} from "n8n-workflow";

import {updateDisplayOptions} from "../../helpers/displayOptions";
import {formatExtensionAttributes, prepareErrorData} from "../../helpers/utils";
import type {DownloadItem} from "../../transport";
import {createApiRequest} from "../../transport";

const additionalFieldsOptions: INodeProperties[] = [
    {
        displayName: 'Show in Portal',
        name: 'show_in_portal',
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
        displayName: 'Visibility',
        name: 'visibility',
        type: 'number',
        default: '',
    },
    {
        displayName: 'Product All',
        name: 'product_all',
        type: 'number',
        default: '',
    },
    {
        displayName: 'Filename',
        name: 'filename',
        type: 'string',
        default: '',
    },
    {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        default: '',
    },
    {
        displayName: 'Short Description',
        name: 'short_description',
        type: 'string',
        default: '',
    },
    {
        displayName: 'Company IDs',
        name: 'company_ids',
        type: 'fixedCollection',
        placeholder: 'Add Company ID',
        typeOptions: {
            multipleValues: true,
        },
        default: {},
        options: [
            {
                displayName: 'Company ID',
                name: 'ids',
                values: [
                    {
                        displayName: 'ID',
                        name: 'id',
                        type: 'number',
                        default: 0,
                    },
                ],
            },
        ],
    },
    {
        displayName: 'Category IDs',
        name: 'category_ids',
        type: 'fixedCollection',
        placeholder: 'Add Category ID',
        typeOptions: {
            multipleValues: true,
        },
        default: {},
        options: [
            {
                displayName: 'Category ID',
                name: 'ids',
                values: [
                    {
                        displayName: 'ID',
                        name: 'id',
                        type: 'number',
                        default: 0,
                    },
                ],
            },
        ],
    },
    {
        displayName: 'Company Group IDs',
        name: 'company_group_ids',
        type: 'string',
        default: '',
    },
    {
        displayName: 'Item Dir',
        name: 'item_dir',
        type: 'string',
        default: '',
    },
    {
        displayName: 'Preview',
        name: 'preview',
        type: 'string',
        default: '',
    },
    {
        displayName: 'Extracted Text',
        name: 'extracted_text',
        type: 'string',
        default: '',
    },
    {
        displayName: 'Type',
        name: 'type',
        type: 'string',
        default: '',
    },
    {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        default: '',
    },
    {
        displayName: 'Extension Attributes',
        name: 'extension_attributes',
        type: 'fixedCollection',
        typeOptions: {
            multipleValues: true,
        },
        default: {},
        placeholder: 'Add Extension Attribute',
        options: [
            {
                displayName: 'Extension Attribute',
                name: 'extension_attribute',
                values: [
                    {
                        displayName: 'Extension Attribute Name or ID',
                        name: 'attribute_code',
                        type: 'options',
                                                                                            description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                        typeOptions: {
                            loadOptionsMethod: 'getExtensionAttributes',
                        },
                        default: '',
                    },
                    {
                        displayName: 'Value',
                        name: 'value',
                        type: 'string',
                        default: '',
                    },
                ],
            },
        ],
    },
];

const properties: INodeProperties[] = [
    {
        displayName: 'Status',
        name: 'status',
        type: 'boolean',
        required: true,
        default: false,
        displayOptions: {
            show: {
                resource: ['download'],
                operation: ['createItem'],
            },
        },
        description: 'Whether the item is active',
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
                operation: ['createItem'],
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
                operation: ['createItem'],
            },
        },
        options: additionalFieldsOptions,
    },
]

const displayOptions = {
    show: {
        resource: ['download'],
        operation: ['createItem']
    }
}

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/download/item/create';

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
            let item = {
                'item': {} as DownloadItem
            }
            item.item = {
                status: this.getNodeParameter('status', i) as number,
                title: this.getNodeParameter('title', i) as string,
            };
            item.item = {...item.item, ...additionalFields};

            if (!bulk) {
                const executionData = await createApiRequest.call(this, item, restUrl, false, i);
                returnData.push(...executionData);
            } else {
                data.push(item);
            }
        } catch (error) {
            if (this.continueOnFail()) {
                returnData.push(...prepareErrorData.call(this, error, i));
                continue;
            }

            throw new NodeApiError(this.getNode(), error as JsonObject);
        }
    }
    try {
        const executionData = await createApiRequest.call(this, data, restUrl);
        returnData.push(...executionData);
    } catch (error) {
        if (this.continueOnFail()) {
            returnData.push(...prepareErrorData.call(this, error, 0));
        } else {
            throw new NodeApiError(this.getNode(), error as JsonObject);
        }
    }
    return returnData;
}
