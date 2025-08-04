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
import * as companyContact from './companyContact';
import * as companyGroup from './companyGroup';
import * as companyRole from './companyRole';
import * as companySku from './companySku';
import * as companyUser from './companyUser';
import * as salesOrg from './salesOrg';
import * as product from './product';
import * as backorders from './reports/backorders';
import * as creditmemos from './reports/creditmemos';
import * as invoices from './reports/invoices';
import * as orders from './reports/orders';
import * as reshipments from './reports/reshipments';
import * as shipments from './reports/shipments';
import * as trackings from './reports/trackings';

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
				operation: ['create', 'linkCompany', 'linkSalesorg'],
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
		case 'companyGroup':
			returnData = await (companyGroup as any)[operation].execute.call(this);
			break;
		case 'companyRole':
			returnData = await (companyRole as any)[operation].execute.call(this);
			break;
        case 'companyContact':
            returnData = await (companyContact as any)[operation].execute.call(this);
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
		case 'backorders':
			returnData = await (backorders as any)[operation].execute.call(this);
			break;
		case 'creditmemos':
			returnData = await (creditmemos as any)[operation].execute.call(this);
			break;
		case 'invoices':
			returnData = await (invoices as any)[operation].execute.call(this);
			break;
		case 'orders':
			returnData = await (orders as any)[operation].execute.call(this);
			break;
		case 'reshipments':
			returnData = await (reshipments as any)[operation].execute.call(this);
			break;
		case 'shipments':
			returnData = await (shipments as any)[operation].execute.call(this);
			break;
		case 'trackings':
			returnData = await (trackings as any)[operation].execute.call(this);
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
