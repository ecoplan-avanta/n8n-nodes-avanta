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
import * as companyGroup from './actions/companyGroup';
import * as companyRole from './actions/companyRole';
import * as companyUser from './actions/companyUser';
import * as companySku from './actions/companySku';
import * as salesOrg from './actions/salesOrg';
import * as product from './actions/product';
import * as reports from './actions/reports';
import {loadOptions} from './methods';

//import {companyAddressFields, companyAddressOperations} from "./descriptions/CompanyAddressesDescription";
export class Avanta implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'avanta',
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
						name: 'Company',
						value: 'company',
					},
					{
						name: 'CompanyAddress',
						value: 'companyAddress',
					},
					{
						name: 'CompanyUser',
						value: 'companyUser',
					},
					{
						name: 'CompanySku',
						value: 'companySku',
					},
					{
						name: 'SalesOrg',
						value: 'salesOrg',
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
						name: 'Product',
						value: 'product',
					},
					{
						name: 'Backorder',
						value: 'backorders',
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
						name: 'Reshipment',
						value: 'reshipments',
					},
					{
						name: 'Shipment',
						value: 'shipments',
					},
					{
						name: 'Tracking',
						value: 'trackings',
					}
				],
				default: 'company',
			},
			...routerDescription.description,
			...company.description,
			...companyAddress.description,
			...companyGroup.description,
			...companyRole.description,
			...companyUser.description,
			...companySku.description,
			...salesOrg.description,
			...product.description,
			...reports.description
		],
	};

	methods = {
		loadOptions,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return await router.call(this);
	}
}
