import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties
} from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import { prepareErrorData } from '../../helpers/utils';
import { createApiRequest } from '../../transport';

const properties: INodeProperties[] = [
    {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['category'],
                operation: ['create'],
            },
        },
        description: 'Category name',
    },
    {
        displayName: 'Is Active',
        name: 'is_active',
        type: 'boolean',
        required: true,
        default: true,
        displayOptions: {
            show: {
                resource: ['category'],
                operation: ['create'],
            },
        },
        description: 'Whether the category is active',
    },
    {
        displayName: 'External ID',
        name: 'proline_external_id',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                resource: ['category'],
                operation: ['create'],
            },
        },
        description: 'External category identifier used for upsert',
    },
    {
        displayName: 'External Parent ID',
        name: 'external_parent_id',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                resource: ['category'],
                operation: ['create'],
            },
        },
        description: 'External identifier of the parent category',
    },
    {
        displayName: 'ID',
        name: 'id',
        type: 'number',
        default: 0,
        displayOptions: {
            show: {
                resource: ['category'],
                operation: ['create'],
            },
        },
        description: 'Existing category ID (alternative to External ID)',
    },
    {
        displayName: 'Parent ID',
        name: 'parent_id',
        type: 'number',
        default: 0,
        displayOptions: {
            show: {
                resource: ['category'],
                operation: ['create'],
            },
        },
        description: 'Numeric parent ID (used if External Parent ID is empty)',
    },
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
            show: {
                resource: ['category'],
                operation: ['create'],
            },
        },
        options: [
            {
                displayName: 'URL Key',
                name: 'url_key',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Include in Menu',
                name: 'include_in_menu',
                type: 'boolean',
                default: true,
            },
            {
                displayName: 'Position',
                name: 'position',
                type: 'number',
                default: 0,
            },
            {
                displayName: 'Custom Attributes',
                name: 'custom_attributes',
                type: 'fixedCollection',
                typeOptions: { multipleValues: true },
                placeholder: 'Add Attribute',
                default: {},
                options: [
                    {
                        name: 'custom_attribute',
                        displayName: 'Custom Attribute',
                        values: [
                            {
                                displayName: 'Attribute Code',
                                name: 'attribute_code',
                                type: 'string',
                                default: '',
                                description: 'e.g. proline_visibility_group',
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
        ],
    },
];

const displayOptions = {
    show: {
        resource: ['category'],
        operation: ['create'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/connector/category';

export async function execute(
    this: IExecuteFunctions
): Promise<INodeExecutionData[]> {
    const bulk = this.getNodeParameter('bulk', 0) as boolean;
    const items = this.getInputData();
    const data: any[] = [];
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
        try {
            const name = this.getNodeParameter('name', i) as string;
            const is_active = this.getNodeParameter('is_active', i) as boolean;

            const category: any = {
                name,
                is_active,
            };

            const proline_external_id = this.getNodeParameter('proline_external_id', i, '') as string;
            if (proline_external_id) category.proline_external_id = proline_external_id;

            const external_parent_id = this.getNodeParameter('external_parent_id', i, '') as string;
            if (external_parent_id) category.external_parent_id = external_parent_id;

            const id = this.getNodeParameter('id', i, 0) as number;
            if (id) category.id = id;

            const parent_id = this.getNodeParameter('parent_id', i, 0) as number;
            if (parent_id) category.parent_id = parent_id;

            // Additional fields
            const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;
            if (additionalFields) {
                if (additionalFields.url_key) category.url_key = additionalFields.url_key;
                if (typeof additionalFields.include_in_menu === 'boolean') category.include_in_menu = additionalFields.include_in_menu;
                if (additionalFields.position) category.position = additionalFields.position;

                if (additionalFields.custom_attributes) {
                    const caRaw = additionalFields.custom_attributes as { custom_attribute?: any[] };
                    const list = Array.isArray(caRaw.custom_attribute) ? caRaw.custom_attribute : [];
                    if (list.length) {
                        category.custom_attributes = list.map((a: any) => ({
                            attribute_code: a.attribute_code,
                            value: a.value,
                        }));
                    }
                }
            }

            const payload = { category };

            if (!bulk) {
                const executionData = await createApiRequest.call(this, payload, restUrl, false, i);
                returnData.push(...executionData);
            } else {
                data.push(payload);
            }
        } catch (error) {
            if (this.continueOnFail()) {
                returnData.push(...prepareErrorData.call(this, error, i));
                continue;
            }
            throw error;
        }
    }

    if (bulk && data.length) {
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
