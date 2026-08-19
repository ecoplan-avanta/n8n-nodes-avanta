/*
 * Copyright (c) 2026 by ECOPLAN E-Commerce GmbH
 *
 * This software is protected by copyright.
 * Decompiling or modifying the source code, as well as using the
 * software beyond the licensed scope, is prohibited.
 * Violations will be prosecuted.
 */

import type {
    IDataObject,
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties,
    JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import { updateDisplayOptions } from '../../../helpers/displayOptions';
import { prepareErrorData, formatExtensionAttributes, formatDate } from '../../../helpers/utils';
import {createApiRequest} from '../../../transport';
import type { DocumentFile, InquiryItem, InquiryReport } from '../../../transport';

const inquiryPositionAdditionalFieldsOptions: INodeProperties[] = [
    {
        displayName: 'Inquiry Item ID',
        name: 'inquiry_item_id',
        type: 'number',
        default: 0,
        description: 'Internal ID of the Inquiry item',
    },
    {
        displayName: 'Parent Item ID',
        name: 'parent_item_id',
        type: 'number',
        default: 0,
        description: 'Internal ID of Parent Item (if value is provided the parent will automatically be the previous item)',
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
        name: 'proline_productunit',
        type: 'string',
        default: '',
    },
    {
        displayName: 'Info BuyRequest',
        name: 'buy_request',
        type: 'string',
        default: '',
        description: 'Value of info_buyRequest for cart offer items',
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
    { displayName: 'Inquiry ID', name: 'inquiry_id', type: 'number', default: 0, description: 'Internal inquiry ID' },
    { displayName: 'External ID', name: 'external_id', type: 'string', default: '', description: 'External inquiry ID' },
    { displayName: 'Status', name: 'status', type: 'string', default: '', description: 'Status of the inquiry (e.g. open, processing, finished)' },
    { displayName: 'Content', name: 'content', type: 'string', default: '', description: 'Inquiry content' },
    { displayName: 'City', name: 'city', type: 'string', default: '', description: 'Inquiry city' },
    { displayName: 'Company Name', name: 'company_name', type: 'string', default: '', description: 'Inquiry company name' },
    { displayName: 'Country ID', name: 'country_id', type: 'string', default: '', description: 'Inquiry country ID' },
    { displayName: 'Street', name: 'street', type: 'string', default: '', description: 'Inquiry street' },
    { displayName: 'Telephone', name: 'telephone', type: 'string', default: '', description: 'Inquiry telephone' },
    { displayName: 'Postcode', name: 'postcode', type: 'string', default: '', description: 'Inquiry postcode' },
    { displayName: 'Offer Number', name: 'offer_number', type: 'string', default: '', description: 'Assigned Offer number of inquiry' },
    { displayName: 'User ID', name: 'user_id', type: 'number', default: 0, description: 'Internal ID of User' },
    { displayName: 'Customer Name', name: 'customer', type: 'string', default: '' },
    { displayName: 'Customer Email', name: 'customer_email', type: 'string', default: '' },
];

const properties: INodeProperties[] = [
    // Required fields
    {
        displayName: 'Company Customer ID',
        name: 'customer_id',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['inquiries'], operation: ['create'] } },
        description: 'Customer ID of the company',
    },
    {
        displayName: 'Company ID',
        name: 'company_id',
        type: 'number',
        default: 0,
        displayOptions: { show: { resource: ['inquiries'], operation: ['create'] } },
        description: 'Internal ID of the company',
    },
    {
        displayName: 'Customer Inquiry ID',
        name: 'customer_inquiryid',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['inquiries'], operation: ['create'] } },
        description: 'Inquiry ID provided by the customer',
    },
    {
        displayName: 'Inquiry Type',
        name: 'inquiry_type',
        type: 'options',
        required: true,
        displayOptions: { show: { resource: ['inquiries'], operation: ['create'] } },
        options: [
            {
                name: 'Offer',
                value: 'offer',
                description: 'Offer from product page',
            },
            {
                name: 'Question',
                value: 'question',
                description: 'Question from product page',
            },
            {
                name: 'Cart Offer',
                value: 'cartoffer',
                description: 'Offer from checkout page',
            },
        ],
        default: 'offer',
    },
    // Inquiry positions
    {
        displayName: 'Inquiry Positions Type',
        name: 'inquiry_positions_type',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['inquiries'],
                operation: ['create']
            },
        },
        options: [
            {
                name: 'Fields Below',
                value: 'mapping',
                description: 'Add inquiry positions using fields below',
                action: 'Use fields below to add inquiry positions',
            },
            {
                name: 'JSON',
                value: 'json',
                description: 'Use JSON to dynamically add inquiry positions',
                action: 'Use raw JSON to add inquiry positions',
            },
        ],
        default: 'mapping',
    },
    {
        displayName: 'Inquiry Positions',
        name: 'inquiry_positions',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        default: {},
        displayOptions: { hide: { inquiry_positions_type: ['json'] }, show: {resource: ['inquiries'], operation: ['create'] } },
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
                        options: inquiryPositionAdditionalFieldsOptions,
                    },
                    {
                        displayName: 'Product Name',
                        name: 'product_name',
                        type: 'string',
                        required:	true,
                        default: '',
                        description: 'Name of the item',
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
                        name: 'product_sku',
                        type: 'string',
                        required:	true,
                        default: '',
                        description: 'Stock Keeping Unit',
                    },
                    {
                        displayName: 'Type Name or ID',
                        name: 'type_id',
                        type: 'options',
                        required:	true,
                        description:
                            'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                        typeOptions: {
                            loadOptionsMethod: 'getProductTypes',
                        },
                        default: '',
                    },
                ],
            },
        ],
    },
    {
        displayName: 'Inquiry Positions JSON',
        name: 'inquiry_positions_json',
        type: 'json',
        displayOptions: {
            hide: {
                inquiry_positions_type: ['mapping']
            },
            show: {
                resource: ['inquiries'],
                operation: ['create'],
            }
        },
        description: 'Add inquiry positions via raw JSON',
        default: '',
    },
    // Head-level document files
    {
        displayName: 'Document Files',
        name: 'document_files',
        type: 'collection',
        default: {},
        placeholder: 'Add Document Files',
        description: 'Inquiry document files. You can add them manually or provide a JSON array.',
        displayOptions: { show: { resource: ['inquiries'], operation: ['create'] } },
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
        displayOptions: { show: { resource: ['inquiries'], operation: ['create'] } },
        options: additionalFieldsOptions,
    },
];

const displayOptions = {
    show: {
        resource: ['inquiries'],
        operation: ['create'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/offer/inquiry';

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
    const bulk = this.getNodeParameter('bulk', 0) as boolean;
    const items = this.getInputData();
    const data: { inquiry: InquiryReport }[] = [];
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
        try {
            const report: InquiryReport = {
                customer_id: this.getNodeParameter('customer_id', i) as string,
                company_id: this.getNodeParameter('company_id', i) as number,
                customer_inquiryid: this.getNodeParameter('customer_inquiryid', i) as string,
                inquiry_type: this.getNodeParameter('inquiry_type', i) as string,
                inquiry_positions: [],
            };

            if (this.getNodeParameter('inquiry_positions_type', i) == 'json') {
                report.inquiry_positions = this.getNodeParameter('inquiry_positions_json', i) as Array<InquiryItem>;
            } else {
                const positionsCollection = this.getNodeParameter('inquiry_positions', i) as { position?: Array<Partial<InquiryItem> & { additionalFields?: Record<string, any> }> };
                const positionsArray = positionsCollection?.position ?? [];
                if (positionsArray.length > 0) {
                    report.inquiry_positions = positionsArray.map((p) => {
                        const { additionalFields, ...rest } = p;
                        const additionalFieldsProcessed = formatExtensionAttributes.call(this, additionalFields ?? {});
                        const { ...otherFields } = additionalFieldsProcessed;

                        return {
                            ...rest,
                            ...otherFields,
                        } as InquiryItem;
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
                const executionData = await createApiRequest.call(this, {inquiry: report}, restUrl, false, i);
                returnData.push(...executionData);
            } else {
                data.push({inquiry: report});
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
