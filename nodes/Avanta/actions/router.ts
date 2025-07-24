import type {
	IDataObject,
	IExecuteFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	INodeProperties
} from 'n8n-workflow';
import {NodeOperationError} from 'n8n-workflow';

import * as company from './company';
import * as companyAddress from './companyAddress';
import * as companyUser from './companyUser';
import * as companySku from './companySku';
import * as salesOrg from './salesOrg';
import * as product from './product';

export const description: INodeProperties[] = [
	{
		displayName: 'Request Options',
		name: 'request_options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		options: [
			{
				displayName: 'Ignore SSL Issues (Insecure)',
				name: 'allowUnauthorizedCerts',
				type: 'boolean',
				noDataExpression: true,
				default: false,
				description: 'Whether to connect even if SSL certificate validation is not possible',
			},
			{
				displayName: 'Timeout',
				name: 'timeout',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 10000,
				description:
					'Time in ms to wait for the server to send response headers (and start the response body) before aborting the request',
			},
		],
	},
	{
		displayName: 'Return to Webhook',
		name: 'return',
		type: 'boolean',
		description: 'A \'Respond to Webhook\' node is required after this node to return the response.',
		default: false,
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Use Bulk API',
		name: 'bulk',
		type: 'boolean',
		description: '',
		default: true,
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
	}
];

export async function router(this: IExecuteFunctions) {
	let returnData: INodeExecutionData[] = [];

	const resource = this.getNodeParameter('resource', 0);
	const operation = this.getNodeParameter('operation', 0) as string;

	let returnToWebhook = false;
	if (operation === 'create') {
		returnToWebhook = this.getNodeParameter('return', 0) as boolean;
	}

	switch (resource) {
		case 'company':
			returnData = await (company as any)[operation].execute.call(this);
			break;
		case 'companyAddress':
			returnData = await (companyAddress as any)[operation].execute.call(this);
			break;
		case 'companyUser':
			returnData = await (companyUser as any)[operation].execute.call(this);
			break;
		case 'companySku':
			returnData = await (companySku as any)[operation].execute.call(this);
			break;
		case 'salesOrg':
			returnData = await (salesOrg as any)[operation].execute.call(this);
			break;
		case 'product':
			returnData = await (product as any)[operation].execute.call(this);
			break;
		default:
			throw new NodeOperationError(this.getNode(), `The resource "${resource}" is not known`);
	}

	if (returnToWebhook) {
		let errors = [];
		const items = this.getInputData();
		for (let i = 0; i < items.length; i++) {
			const item = items[i].json;
			if (item.error) {
				errors.push(item.error);
			}
		}
		if (returnData.length > 0) {
			for (let i = 0; i < returnData.length; i++) {
				const item = returnData[i].json;
				if (item.error) {
					errors.push(item.error);
				}
			}
		}
		const headers = {} as IDataObject;
		let statusCode = 200;
		if (errors.length > 0) {
			statusCode = 500;
		}
		const fullResponse: IN8nHttpFullResponse = {
			body: {
				'basic': {
					'status_code': statusCode,
					'response': returnData,
					'errors': errors
				},
				'response_data': returnData
			},
			headers,
			statusCode: statusCode
		};
		this.sendResponse(fullResponse);
	}

	return [returnData];
}
