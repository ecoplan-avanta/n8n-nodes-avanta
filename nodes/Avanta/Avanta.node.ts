import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription
} from 'n8n-workflow';
import {
	NodeConnectionType
} from 'n8n-workflow';

import {router} from './actions/router';
import * as routerDescription from './actions/router';
import * as company from './actions/company';
import * as companyAddress from './actions/companyAddress';
import * as companyContact from './actions/companyContact';
import * as companyGroup from './actions/companyGroup';
import * as companyRole from './actions/companyRole';
import * as companyUser from './actions/companyUser';
import * as companySku from './actions/companySku';
import * as salesOrg from './actions/salesOrg';
import * as product from './actions/product';
import * as reports from './actions/reports';
import * as download from './actions/download';
import {loadOptions} from './methods';

export class Avanta implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Avanta',
		name: 'avanta',
		icon: 'file:avanta.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Consume avanta API',
		defaults: {
			name: 'avanta',
		},
		usableAsTool: true,
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'avantaApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Backorder',
						value: 'backorders',
					},
					{
						name: 'Company',
						value: 'company',
					},
					{
						name: 'CompanyAddress',
						value: 'companyAddress',
					},
					{
						name: 'CompanyContact',
						value: 'companyContact',
					},
					{
						name: 'CompanyGroup',
						value: 'companyGroup',
					},
					{
						name: 'CompanyRole',
						value: 'companyRole',
					},
					{
						name: 'CompanySku',
						value: 'companySku',
					},
					{
						name: 'CompanyUser',
						value: 'companyUser',
					},
					{
						name: 'Creditmemo',
						value: 'creditmemos',
					},
					{
						name: 'Invoice',
						value: 'invoices',
					},
					{
						name: 'Order',
						value: 'orders',
					},
					{
						name: 'Product',
						value: 'product',
					},
					{
						name: 'Reshipment',
						value: 'reshipments',
					},
					{
						name: 'SalesOrg',
						value: 'salesOrg',
					},
					{
						name: 'Shipment',
						value: 'shipments',
					},
					{
						name: 'Tracking',
						value: 'trackings',
					},
                    {
                        name: 'Download',
                        value: 'download',
                    }
				],
				default: 'company',
			},
			...routerDescription.description,
			...company.description,
			...companyAddress.description,
            ...companyContact.description,
            ...companyUser.description,
			...companyGroup.description,
			...companyRole.description,
			...companyUser.description,
			...companySku.description,
			...salesOrg.description,
			...product.description,
			...reports.description,
            ...download.description
        ],
	};

	methods = {
		loadOptions,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return await router.call(this);
	}
}
