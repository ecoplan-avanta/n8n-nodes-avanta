/*
 * Copyright (c) 2026 by ECOPLAN E-Commerce GmbH
 *
 * This software is protected by copyright.
 * Decompiling or modifying the source code, as well as using the
 * software beyond the licensed scope, is prohibited.
 * Violations will be prosecuted.
 */

import type {IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject,} from 'n8n-workflow';
import {NodeApiError, NodeOperationError} from 'n8n-workflow';

import {updateDisplayOptions} from '../../../helpers/displayOptions';
import {formatDate, formatExtensionAttributes, prepareErrorData} from '../../../helpers/utils';
import type {DocumentFile, RetoureItem, RetoureReport} from '../../../transport';
import {createApiRequest} from '../../../transport';

const returnPositionAdditionalFieldsOptions: INodeProperties[] = [
    // Item-level document files
    {
        displayName: 'Document Files',
        name: 'item_document_files',
        type: 'collection',
        default: {},
        placeholder: 'Add Document Files',
        description: 'Return document files. You can add them manually or provide a JSON array.',
        options: [
            {
                displayName: 'Input Mode',
                name: 'inputMode',
                type: 'options',
                options: [
                    { name: 'UI Collection', value: 'collection' },
                    { name: 'Raw JSON', value: 'json' },
                ],
                default: 'collection',
                description: 'Choose whether to provide document files via the UI or as JSON',
            },
            {
                displayName: 'Document File Collection',
                name: 'file',
                type: 'fixedCollection',
                displayOptions: {
                    show: {
                        inputMode: ['collection'],
                    },
                },
                typeOptions: {
                    multipleValues: true,
                },
                default: {},
                placeholder: 'Add Document File',
                options: [
                    {
                        name: 'file',
                        displayName: 'File',
                        values: [
                            { displayName: 'Document ID', name: 'document_id', type: 'string', default: '' },
                            { displayName: 'Type', name: 'type', type: 'string', default: '' },
                            { displayName: 'File', name: 'file', type: 'string', default: '' },
                            { displayName: 'Date', name: 'date', type: 'dateTime', default: '' },
                        ],
                    },
                ],
            },
            {
                displayName: 'Document Files JSON',
                name: 'itemDocumentFilesJson',
                type: 'json',
                displayOptions: {
                    show: {
                        inputMode: ['json'],
                    },
                },
                default: '[]',
                description: 'Provide document files as JSON array',
            },
        ],
    },
    {
        displayName: 'Extension Attributes',
        name: 'item_extension_attributes',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        default: {},
        placeholder: 'Add Extension Attribute',
        options: [
            {
                displayName: 'Extension Attribute',
                name: 'item_extension_attribute',
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
    {
        displayName: 'Return Item ID',
        name: 'retoure_item_id',
        type: 'number',
        default: 0,
        description: 'Internal ID of the Return item',
    },
    {
        displayName: 'Product ID',
        name: 'product_id',
        type: 'number',
        default: 0,
        description: 'Internal ID of product',
    },
    {
        displayName: 'Packaging Unit',
        name: 'packaging_unit',
        type: 'string',
        default: '',
    },
    {
        displayName: 'Shipment_number',
        name: 'shipment_number',
        type: 'string',
        default: '',
        description: 'Number of initial shipment of item',
    },
    {
        displayName: 'Comment',
        name: 'comment',
        type: 'string',
        default: '',
    },
    {
        displayName: 'File',
        name: 'file',
        type: 'string',
        default: '',
        description: 'Additional file for item',
    }
];

const additionalFieldsOptions: INodeProperties[] = [
    {
        displayName: 'Extension Attributes',
        name: 'extension_attributes',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
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
    { displayName: 'Store ID', name: 'store_id', type: 'number', default: 0 },
    { displayName: 'Website ID', name: 'website_id', type: 'number', default: 0 },
    { displayName: 'Return ID', name: 'retoure_id', type: 'number', default: 0, description: 'Internal return ID' },
    { displayName: 'External ID', name: 'external_id', type: 'string', default: '', description: 'External return ID' },
    { displayName: 'Return Number', name: 'retoure_number', type: 'string', default: '', description: 'Assigned Return number' },
    { displayName: 'Company Name', name: 'company_name', type: 'string', default: '', description: 'Return company name' },
    { displayName: 'Status', name: 'status', type: 'string', default: '', description: 'Status of the retoure (e.g. new, processing, finish)' },
    { displayName: 'Comment', name: 'comment', type: 'string', default: '', description: 'Return comment' },
    { displayName: 'Address City', name: 'address_city', type: 'string', default: '', description: 'Return Address city' },
    { displayName: 'Address Country ID', name: 'address_country_id', type: 'string', default: '', description: 'Return Address country ID' },
    { displayName: 'Address Street', name: 'address_street', type: 'string', default: '', description: 'Return Address street' },
    { displayName: 'Address Postcode', name: 'address_postcode', type: 'string', default: '', description: 'Return Address postcode' },
    { displayName: 'Contact Telephone', name: 'contact_telephone', type: 'string', default: '', description: 'Return contact telephone' },
    { displayName: 'Contact Email', name: 'contact_email', type: 'string', default: '', description: 'Return contact email' },
    { displayName: 'User ID', name: 'user_id', type: 'number', default: 0, description: 'Internal ID of User' },
    { displayName: 'Dimensions', name: 'dimensions', type: 'string', default: '', description: 'Dimensions of Return' },
    { displayName: 'Customer Name', name: 'customer', type: 'string', default: '' },
    { displayName: 'Customer Email', name: 'customer_email', type: 'string', default: '' },
    { displayName: 'Crypt Key', name: 'crypt_key', type: 'string', default: '', description: 'Crypt Key for return' },
];

const properties: INodeProperties[] = [
    // Required fields
    {
        displayName: 'Company Customer ID',
        name: 'customer_id',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['returns'], operation: ['create'] } },
        description: 'Customer ID of the company',
    },
    {
        displayName: 'Company ID',
        name: 'company_id',
        type: 'number',
        default: 0,
        displayOptions: { show: { resource: ['returns'], operation: ['create'] } },
        description: 'Internal ID of the company',
    },
    {
        displayName: 'Return Shipping Method',
        name: 'retoure_shipping_method',
        type: 'string',
        required: true,
        displayOptions: { show: { resource: ['returns'], operation: ['create'] } },
        description: 'Shipping method for return (e.g. return_shipment, pickup)',
        default: '',
    },
    // Return positions
    {
        displayName: 'Return Positions Type',
        name: 'retoure_positions_type',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['returns'],
                operation: ['create']
            },
        },
        options: [
            {
                name: 'Fields Below',
                value: 'mapping',
                description: 'Add return positions using fields below',
                action: 'Use fields below to add return positions',
            },
            {
                name: 'JSON',
                value: 'json',
                description: 'Use JSON to dynamically add return positions',
                action: 'Use raw JSON to add return positions',
            },
        ],
        default: 'mapping',
    },
    {
        displayName: 'Return Positions',
        name: 'retoure_positions',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        default: {},
        displayOptions: { hide: { retoure_positions_type: ['json'] }, show: {resource: ['returns'], operation: ['create'] } },
        options: [
            {
                name: 'position',
                displayName: 'Position',
                values: [
                    {
                        displayName: 'Additional Fields',
                        name: 'additionalFields',
                        type: 'collection',
                        default: {},
                        placeholder: 'Add Field',
                        options: returnPositionAdditionalFieldsOptions,
                    },
                    {
                        displayName: 'Quantity',
                        name: 'qty',
                        type: 'number',
                        required:	true,
                        default: 0,
                        description: 'Quantity of the item',
                    },
                    {
                        displayName: 'SKU',
                        name: 'sku',
                        type: 'string',
                        required:	true,
                        default: '',
                        description: 'Stock Keeping Unit',
                    },
                    {
                        displayName: 'Return Reason',
                        name: 'return_reason',
                        type: 'string',
                        required:	true,
                        default: '',
                        description: 'Return reason for item (e.g. fault, does_not_fit, not_wanted)',
                    },
                ],
            },
        ],
    },
    {
        displayName: 'Return Positions JSON',
        name: 'retoure_positions_json',
        type: 'json',
        displayOptions: {
            hide: {
                retoure_positions_type: ['mapping']
            },
            show: {
                resource: ['returns'],
                operation: ['create'],
            }
        },
        description: 'Add return positions via raw JSON',
        default: '',
    },
    // Head-level document files
    {
        displayName: 'Document Files',
        name: 'document_files',
        type: 'collection',
        default: {},
        placeholder: 'Add Document Files',
        description: 'Return document files. You can add them manually or provide a JSON array.',
        displayOptions: { show: { resource: ['returns'], operation: ['create'] } },
        options: [
            {
                displayName: 'Input Mode',
                name: 'inputMode',
                type: 'options',
                options: [
                    { name: 'UI Collection', value: 'collection' },
                    { name: 'Raw JSON', value: 'json' },
                ],
                default: 'collection',
                description: 'Choose whether to provide document files via the UI or as JSON',
            },
            {
                displayName: 'Document File Collection',
                name: 'file',
                type: 'fixedCollection',
                displayOptions: {
                    show: {
                        inputMode: ['collection'],
                    },
                },
                typeOptions: {
                    multipleValues: true,
                },
                default: {},
                placeholder: 'Add Document File',
                options: [
                    {
                        name: 'file',
                        displayName: 'File',
                        values: [
                            { displayName: 'Document ID', name: 'document_id', type: 'string', default: '' },
                            { displayName: 'Type', name: 'type', type: 'string', default: '' },
                            { displayName: 'File', name: 'file', type: 'string', default: '' },
                            { displayName: 'Date', name: 'date', type: 'dateTime', default: '' },
                        ],
                    },
                ],
            },
            {
                displayName: 'Document Files JSON',
                name: 'documentFilesJson',
                type: 'json',
                displayOptions: {
                    show: {
                        inputMode: ['json'],
                    },
                },
                default: '[]',
                description: 'Provide document files as JSON array',
            },
        ],
    },
    // Additional Fields
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: { show: { resource: ['returns'], operation: ['create'] } },
        options: additionalFieldsOptions,
    },
];

const displayOptions = {
    show: {
        resource: ['returns'],
        operation: ['create'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/retoureHead';

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
    const bulk = this.getNodeParameter('bulk', 0) as boolean;
    const items = this.getInputData();
    const data: { retoureHead: RetoureReport }[] = [];
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
        try {
            const report: RetoureReport = {
                customer_id: this.getNodeParameter('customer_id', i) as string,
                company_id: this.getNodeParameter('company_id', i) as number,
                retoure_shipping_method: this.getNodeParameter('retoure_shipping_method', i) as string,
                retoure_positions: [],
            };

            if (this.getNodeParameter('retoure_positions_type', i) == 'json') {
                report.retoure_positions = this.getNodeParameter('retoure_positions_json', i) as Array<RetoureItem>;
            } else {
                const positionsCollection = this.getNodeParameter('retoure_positions', i) as { position?: Array<Partial<RetoureItem> & { additionalFields?: Record<string, any> }> };
                const positionsArray = positionsCollection?.position ?? [];
                if (positionsArray.length > 0) {
                    report.retoure_positions = positionsArray.map((p) => {
                        const { additionalFields, ...rest } = p;
                        const additionalFieldsProcessed = formatExtensionAttributes.call(this, additionalFields ?? {});
                        const { item_document_files, item_extension_attributes, ...otherFields } = additionalFieldsProcessed;

                        // Format date fields in item_document_files
                        let documentFiles: DocumentFile[] = [];
                        const itemFilesConfig = additionalFields?.item_document_files as IDataObject;
                        if (itemFilesConfig) {
                            if (itemFilesConfig.inputMode === 'json' && itemFilesConfig.itemDocumentFilesJson) {
                                try {
                                    const parsed = JSON.parse(itemFilesConfig.itemDocumentFilesJson as string);
                                    if (Array.isArray(parsed)) {
                                        documentFiles = parsed.map((file: any) => ({
                                            ...file,
                                            date: file.date ? formatDate(file.date) : undefined,
                                        }));
                                    }
                                } catch (e) {
                                    throw new NodeOperationError(this.getNode(), `Invalid JSON in Item Document Files: ${(e as Error).message}`);
                                }
                            } else if (itemFilesConfig.file) {
                                const collection = (itemFilesConfig.file as any).file as DocumentFile[];
                                if (Array.isArray(collection)) {
                                    documentFiles = collection.map((file) => ({
                                        ...file,
                                        date: file.date ? formatDate(file.date) : undefined,
                                    }));
                                }
                            }
                        }

                        return {
                            ...rest,
                            ...otherFields,
                            ...(documentFiles.length > 0 && { document_files: documentFiles }),
                            extension_attributes: additionalFields?.item_extension_attributes?.item_extension_attribute,
                        } as RetoureItem;
                    });
                }
            }

            // Map head document files
            const filesConfig = this.getNodeParameter('document_files', i) as IDataObject;
            let filesArray: DocumentFile[] = [];

            if (filesConfig.inputMode === 'json' && filesConfig.documentFilesJson) {
                try {
                    const parsed = JSON.parse(filesConfig.documentFilesJson as string);
                    if (Array.isArray(parsed)) {
                        filesArray = parsed.map((file: any) => ({
                            ...file,
                            date: file.date ? formatDate(file.date) : undefined,
                        }));
                    } else {
                        throw new Error('Document Files JSON must be an array');
                    }
                } catch (err) {
                    throw new NodeOperationError(this.getNode(), `Invalid JSON in Document Files: ${(err as Error).message}`);
                }
            } else if (filesConfig.file) {
                const collection = (filesConfig.file as any).file as DocumentFile[];
                if (Array.isArray(collection)) {
                    filesArray = collection.map((file) => ({
                        ...file,
                        date: file.date ? formatDate(file.date) : undefined,
                    }));
                }
            }

            if (filesArray.length > 0) {
                report.document_files = filesArray;
            }

            // Map optional additional fields
            const additionalFields = formatExtensionAttributes.call(this, this.getNodeParameter('additionalFields', i) as Record<string, any>);
            if (Object.keys(additionalFields).length > 0) {
                const formattedFields: Record<string, any> = { ...additionalFields };
                Object.assign(report, formattedFields);
            }

            if (!bulk) {
                const executionData = await createApiRequest.call(this, {retoureHead: report}, restUrl, false, i);
                returnData.push(...executionData);
            } else {
                data.push({retoureHead: report});
            }
        } catch (error) {
            if (this.continueOnFail()) {
                returnData.push(...prepareErrorData.call(this, error, i));
                continue;
            }
            throw new NodeApiError(this.getNode(), error as JsonObject);
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
                throw new NodeApiError(this.getNode(), error as JsonObject);
            }
        }
    }

    return returnData;
}
