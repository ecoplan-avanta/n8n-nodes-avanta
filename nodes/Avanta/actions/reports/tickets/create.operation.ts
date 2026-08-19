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
    INodeProperties,
    JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

import { updateDisplayOptions } from '../../../helpers/displayOptions';
import { prepareErrorData, formatExtensionAttributes } from '../../../helpers/utils';
import type {TicketReport} from '../../../transport';
import { createApiRequest } from '../../../transport';

const additionalFieldsOptions: INodeProperties[] = [
    { displayName: 'Watchers', name: 'watchers', type: 'json', default: '[]', description: 'List of email adresses of watchers (e.g. ["anna.jung@b2b-demoshop.de","john.doe@b2b-demoshop.de"])' },
    { displayName: 'Status', name: 'status', type: 'string', default: '', description: 'Status of the Ticket (e.g. open, completed, answered, in_progress, follow-up_question)' },
    { displayName: 'Company ID', name: 'company_id', type: 'number', default: 0, description: 'Internal Company ID' },
    { displayName: 'Ticket ID', name: 'ticket_id', type: 'number', default: 0, description: 'Internal Ticket ID' },
    { displayName: 'External ID', name: 'external_id', type: 'string', default: '', description: 'External ticket ID' },
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
    { displayName: 'User ID', name: 'user_id', type: 'number', default: 0, description: 'Internal ID of author' },
    { displayName: 'Customer', name: 'customer', type: 'string', default: '', description: 'Name of author' },
    { displayName: 'Customer Email', name: 'customer_email', type: 'string', default: '', description: 'Email of author' },
];

const properties: INodeProperties[] = [
    // Required fields
    {
        displayName: 'Company Customer ID',
        name: 'customer_id',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['tickets'], operation: ['create'] } },
        description: 'Customer ID of the company',
    },
    {
        displayName: 'Ticket Number',
        name: 'ticket_number',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['tickets'], operation: ['create'] } },
    },
    {
        displayName: 'Subject',
        name: 'subject',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['tickets'], operation: ['create'] } },
        description: 'Subject of the ticket',
    },
    {
        displayName: 'Website ID',
        name: 'website_id',
        type: 'number',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['tickets'], operation: ['create'] } },
    },
    {
        displayName: 'Store ID',
        name: 'store_id',
        type: 'number',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['tickets'], operation: ['create'] } },
    },
    // Ticket comments
    {
        displayName: 'Comment Type',
        name: 'comments_type',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['tickets'],
                operation: ['create']
            },
        },
        options: [
            {
                name: 'Fields Below',
                value: 'mapping',
                description: 'Add comments using fields below',
                action: 'Use fields below to add comments',
            },
            {
                name: 'JSON',
                value: 'json',
                description: 'Use JSON to dynamically add comments',
                action: 'Use raw JSON to add comments',
            },
        ],
        default: 'mapping',
    },
    {
        displayName: 'Comments',
        name: 'comments',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        default: {},
        displayOptions: { hide: { comments_type: ['json'] }, show: {resource: ['tickets'], operation: ['create'] } },
        options: [
            {
                displayName: 'Comment',
                name: 'comment_entry',
                values: [
                    {
                        displayName: 'User Name',
                        name: 'user',
                        type: 'string',
                        required:	true,
                        default: '',
                        description: 'Name of comment author',
                    },
                    {
                        displayName: 'Comment Content',
                        name: 'comment',
                        type: 'string',
                        required:	true,
                        default: '',
                        description: 'Content of the comment',
                    },
                    {
                        displayName: 'Created At',
                        name: 'created_at',
                        type: 'dateTime',
                        required:	true,
                        default: '',
                        description: 'Creation date of comment',
                    },
                ],
            },
        ],
    },
    {
        displayName: 'Comments JSON',
        name: 'comments_json',
        type: 'json',
        displayOptions: {
            hide: {
                comments_type: ['mapping']
            },
            show: {
                resource: ['tickets'],
                operation: ['create'],
            }
        },
        description: 'Add comments via raw JSON',
        default: '[]',
    },
    // Additional Fields
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: { show: { resource: ['tickets'], operation: ['create'] } },
        options: additionalFieldsOptions,
    },
];

const displayOptions = {
    show: {
        resource: ['tickets'],
        operation: ['create'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/avanta-admin/offer/ticket';

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
    const bulk = this.getNodeParameter('bulk', 0) as boolean;
    const items = this.getInputData();
    const data: { ticket: TicketReport }[] = [];
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
        try {
            const report: TicketReport = {
                customer_id: this.getNodeParameter('customer_id', i) as string,
                website_id: this.getNodeParameter('website_id', i) as number,
                store_id: this.getNodeParameter('store_id', i) as number,
                subject: this.getNodeParameter('subject', i) as string,
                comments: '[]',
            };

            // Handle comments
            if (this.getNodeParameter('comments_type', i) == 'json') {
                report.comments = JSON.stringify(this.getNodeParameter('comments_json', i)) as string;
            } else {
                const commentsCollection = this.getNodeParameter('comments', i) as { comment_entry?: Array<Record<string, any>>};
                const commentsArray = commentsCollection?.comment_entry ?? [];
                if (commentsArray.length > 0) {
                    report.comments = JSON.stringify(commentsArray.map((comment, index) => {
                        return {
                            id: index + 1,
                            user: comment.user,
                            comment: comment.comment,
                            created_at: comment.created_at,
                        };
                    }));
                }
            }

            // Map optional additional fields
            const additionalFields = formatExtensionAttributes.call(this, this.getNodeParameter('additionalFields', i) as Record<string, any>);
            if (Object.keys(additionalFields).length > 0) {
                const formattedFields: Record<string, any> = { ...additionalFields };
                Object.assign(report, formattedFields);
            }

            if (!bulk) {
                const executionData = await createApiRequest.call(this, {ticket: report}, restUrl, false, i);
                returnData.push(...executionData);
            } else {
                data.push({ticket: report});
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
